import {DataSource} from '@angular/cdk/collections';
import {AfterViewInit, Component, Input, OnChanges, SimpleChanges, ViewChild} from '@angular/core';
import {Permission, PermissionListing, ResponseError} from '@geoengine/openapi-client';
import {BehaviorSubject, Observable, Subject, firstValueFrom, tap} from 'rxjs';
import {MatPaginator} from '@angular/material/paginator';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ConfirmationComponent, PermissionsService, ResourceType, UserService} from '@geoengine/common';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';

export interface PermissionForm {
    role: FormControl<string>;
    permission: FormControl<Permission>;
}

@Component({
    selector: 'geoengine-manager-permissions',
    templateUrl: './permissions.component.html',
    styleUrl: './permissions.component.scss',
})
export class PermissionsComponent implements AfterViewInit, OnChanges {
    @Input({required: true})
    resourceType!: ResourceType;
    @Input({required: true})
    resourceId!: string;

    @ViewChild(MatPaginator) paginator!: MatPaginator;

    readonly loadingSpinnerDiameterPx: number = 3 * parseFloat(getComputedStyle(document.documentElement).fontSize);

    form: FormGroup<PermissionForm> = this.setUpForm();

    PERMISSIONS = [Permission.Read];

    source!: PermissionDataSource;

    displayedColumns: string[] = ['roleName', 'roleId', 'permission', 'remove'];

    constructor(
        private readonly permissionsService: PermissionsService,
        private readonly userService: UserService,
        private readonly snackBar: MatSnackBar,
        private readonly dialog: MatDialog,
    ) {}

    ngAfterViewInit(): void {
        this.paginator.page.pipe(tap(() => this.loadPermissionsPage())).subscribe();
        this.setUpSource();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.resourceId || changes.resourceType) {
            this.setUpSource();
        }
    }

    async removePermission(permission: PermissionListing): Promise<void> {
        const dialogRef = this.dialog.open(ConfirmationComponent, {
            data: {message: 'Confirm the deletion of the permission. This cannot be undone.'},
        });

        const confirm = await firstValueFrom(dialogRef.afterClosed());

        if (!confirm) {
            return;
        }

        try {
            await this.permissionsService.removePermission(this.resourceType, this.resourceId, permission.role.id, permission.permission);
            this.snackBar.open('Permission successfully deleted', 'Close', {duration: 2000});
            this.source.refresh();
        } catch (error) {
            const e = error as ResponseError;
            const errorJson = await e.response.json().catch(() => ({}));
            const errorMessage = errorJson.message ?? 'Deleting permission failed.';
            this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
        }
    }

    async addPermission(): Promise<void> {
        const permission = this.form.controls.permission.value;

        const roleName = this.form.controls.role.value;
        let roleId = '';
        try {
            roleId = await this.userService.getRoleByName(roleName);
        } catch (error) {
            const e = error as ResponseError;
            const errorJson = await e.response.json().catch(() => ({}));
            const errorMessage = errorJson.message ?? 'Getting role by name failed.';
            this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
            return;
        }

        try {
            await this.permissionsService.addPermission(this.resourceType, this.resourceId, roleId, permission);
            this.snackBar.open('Permission successfully added', 'Close', {duration: 2000});
            this.source.refresh();
        } catch (error) {
            const e = error as ResponseError;
            const errorJson = await e.response.json().catch(() => ({}));
            const errorMessage = errorJson.message ?? 'Adding    permission failed.';
            this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
        }
    }

    protected loadPermissionsPage(): void {
        this.source.loadPermissions(this.paginator.pageIndex, this.paginator.pageSize);
    }

    protected setUpSource(): void {
        this.source = new PermissionDataSource(this.permissionsService, this.paginator, this.resourceType, this.resourceId);
        this.source.loadPermissions(0, 5);
    }

    private setUpForm(): FormGroup<PermissionForm> {
        return new FormGroup<PermissionForm>({
            role: new FormControl('', {
                nonNullable: true,
                validators: [Validators.required, Validators.minLength(1)],
            }),
            permission: new FormControl(Permission.Read, {
                nonNullable: true,
                validators: [Validators.required],
            }),
        });
    }
}

/**
 * A custom data source that allows fetching datasets for a virtual scroll source.
 */
class PermissionDataSource extends DataSource<PermissionListing> {
    readonly loading$ = new BehaviorSubject(false);

    protected permissions$ = new Subject<Array<PermissionListing>>();

    constructor(
        private permissionsService: PermissionsService,
        private paginator: MatPaginator,
        private resourceType: ResourceType,
        private resourceId: string,
    ) {
        super();
    }

    connect(): Observable<Array<PermissionListing>> {
        return this.permissions$.asObservable();
    }

    /**
     * Clean up resources
     */
    disconnect(): void {
        this.permissions$.complete();
    }

    refresh(): void {
        this.loadPermissions(this.paginator.pageIndex, this.paginator.pageSize);
    }

    loadPermissions(pageIndex: number, pageSize: number): void {
        this.loading$.next(false);

        this.permissionsService.getPermissions(this.resourceType, this.resourceId, pageIndex * pageSize, pageSize).then((permissions) => {
            this.loading$.next(false);
            if (this.paginator && permissions.length === pageSize) {
                // we do not know the number of items in total, so instead for each full page set the length to show the "next" button
                this.paginator.length = (pageIndex + 1) * pageSize + 1;
            }

            this.permissions$.next(permissions);
        });
    }
}
