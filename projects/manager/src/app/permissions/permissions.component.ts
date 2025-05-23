import {DataSource} from '@angular/cdk/collections';
import {AfterViewInit, Component, Input, OnChanges, SimpleChanges, ViewChild} from '@angular/core';
import {Permission, PermissionListing} from '@geoengine/openapi-client';
import {BehaviorSubject, firstValueFrom, Observable, Subject, tap} from 'rxjs';
import {MatPaginator} from '@angular/material/paginator';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ConfirmationComponent, errorToText, PermissionsService, ResourceType, UserService} from '@geoengine/common';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import {AppConfig} from '../app-config.service';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {AsyncPipe, NgForOf, NgIf} from '@angular/common';
import {
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderCellDef,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRow,
    MatRowDef,
    MatTable,
} from '@angular/material/table';
import {MatFormField} from '@angular/material/form-field';
import {MatInput, MatLabel} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatIcon} from '@angular/material/icon';
import {MatButton, MatIconButton} from '@angular/material/button';

export interface PermissionForm {
    role: FormControl<string>;
    permission: FormControl<Permission>;
}

@Component({
    selector: 'geoengine-manager-permissions',
    templateUrl: './permissions.component.html',
    styleUrl: './permissions.component.scss',
    imports: [
        MatProgressSpinner,
        NgIf,
        AsyncPipe,
        MatTable,
        MatIcon,
        MatLabel,
        MatColumnDef,
        MatHeaderCell,
        MatCell,
        MatPaginator,
        MatHeaderRow,
        MatRow,
        ReactiveFormsModule,
        MatFormField,
        MatInput,
        MatSelect,
        MatOption,
        NgForOf,
        MatButton,
        MatCellDef,
        MatHeaderCellDef,
        MatIconButton,
        MatHeaderRowDef,
        MatRowDef,
    ],
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
        private readonly config: AppConfig,
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
            this.snackBar.open('Permission successfully deleted', 'Close', {duration: this.config.DEFAULTS.SNACKBAR_DURATION});
            this.source.refresh();
        } catch (error) {
            const errorMessage = await errorToText(error, 'Deleting permission failed.');
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
            const errorMessage = await errorToText(error, 'Getting role by name failed.');
            this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
            return;
        }

        try {
            await this.permissionsService.addPermission(this.resourceType, this.resourceId, roleId, permission);
            this.snackBar.open('Permission successfully added', 'Close', {duration: this.config.DEFAULTS.SNACKBAR_DURATION});
            this.source.refresh();
        } catch (error) {
            const errorMessage = await errorToText(error, 'Adding permission failed.');
            this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
        }
    }

    protected loadPermissionsPage(): void {
        this.source.loadPermissions(this.paginator.pageIndex, this.paginator.pageSize);
    }

    protected setUpSource(): void {
        this.source = new PermissionDataSource(this.permissionsService, this.paginator, this.resourceType, this.resourceId);
        this.source.isOwner$.subscribe((isOwner) => {
            if (isOwner) {
                this.displayedColumns = ['roleName', 'roleId', 'permission', 'remove'];
            } else {
                this.displayedColumns = ['roleName', 'roleId', 'permission'];
            }
        });
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

    readonly isOwner$ = new BehaviorSubject(false);

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
            if (pageIndex * pageSize == 0) {
                this.isOwner$.next(permissions.length > 0 && permissions[0].permission == Permission.Owner);
            }
            this.loading$.next(false);
            if (this.paginator && permissions.length === pageSize) {
                // we do not know the number of items in total, so instead for each full page set the length to show the "next" button
                this.paginator.length = (pageIndex + 1) * pageSize + 1;
            }

            this.permissions$.next(permissions);
        });
    }
}
