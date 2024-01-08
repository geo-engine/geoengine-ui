import {AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, ViewChild} from '@angular/core';
import {UserService} from '../user.service';
import {BehaviorSubject, Subscription} from 'rxjs';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material/table';

@Component({
    selector: 'geoengine-roles',
    templateUrl: './roles.component.html',
    styleUrls: ['./roles.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesComponent implements AfterViewInit, OnDestroy {
    roleNames: Array<string> | undefined;
    displayedColumns: string[] = ['roleName'];
    roleTable: MatTableDataSource<string> | undefined;
    numberOfRoles: BehaviorSubject<number> = new BehaviorSubject(0);

    @ViewChild(MatPaginator) paginator!: MatPaginator;

    private roleNamesSubscription: Subscription | undefined;

    constructor(
        protected readonly userService: UserService,
        protected readonly changeDetectorRef: ChangeDetectorRef,
    ) {}

    ngAfterViewInit(): void {
        this.roleNamesSubscription = this.userService.getRoleDescriptions().subscribe((roleNames) => {
            if (roleNames) {
                this.roleNames = roleNames.filter((x) => !x.individual).map((x) => x.role.name);
                this.numberOfRoles.next(this.roleNames.length);
                this.roleTable = new MatTableDataSource(this.roleNames);
                this.roleTable.paginator = this.paginator;
            } else {
                this.roleNames = undefined;
                this.numberOfRoles.next(0);
                this.roleTable = undefined;
            }
            this.changeDetectorRef.detectChanges();
        });
    }

    ngOnDestroy(): void {
        this.roleNamesSubscription?.unsubscribe();
    }
}
