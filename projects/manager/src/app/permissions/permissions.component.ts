import {DataSource} from '@angular/cdk/collections';
import {AfterViewInit, Component, Input, OnChanges, SimpleChanges, ViewChild} from '@angular/core';
import {PermissionListing} from '@geoengine/openapi-client';
import {BehaviorSubject, Observable, Subject, tap} from 'rxjs';
import {PermissionsService} from './permissions.service';
import {MatPaginator} from '@angular/material/paginator';

@Component({
    selector: 'geoengine-manager-permissions',
    templateUrl: './permissions.component.html',
    styleUrl: './permissions.component.scss',
})
export class PermissionsComponent implements AfterViewInit, OnChanges {
    @Input()
    resourceType!: string;
    @Input()
    resourceId!: string;

    @ViewChild(MatPaginator) paginator!: MatPaginator;

    readonly loadingSpinnerDiameterPx: number = 3 * parseFloat(getComputedStyle(document.documentElement).fontSize);

    source!: PermissionDataSource;

    displayedColumns: string[] = ['roleName', 'roleId', 'permission'];

    constructor(private readonly permissionsService: PermissionsService) {}

    ngAfterViewInit(): void {
        this.paginator.page.pipe(tap(() => this.loadPermissionsPage())).subscribe();
        this.setUpSource();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.resourceId && changes.resourceType) {
            this.resourceId = changes.resourceId.currentValue;
            this.resourceType = changes.resourceType.currentValue;
            this.setUpSource();
        }
    }

    protected loadPermissionsPage(): void {
        this.source.loadPermissions(this.paginator.pageIndex, this.paginator.pageSize);
    }

    protected setUpSource(): void {
        this.source = new PermissionDataSource(this.permissionsService, this.paginator, this.resourceType, this.resourceId);
        this.source.loadPermissions(0, 5);
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
        private resourceType: string,
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
