import {HttpErrorResponse} from '@angular/common/http';
import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {BackendInfoDict} from '../../../backend/backend.model';
import {BackendService} from '../../../backend/backend.service';
import {UserService} from '../../../users/user.service';

@Component({
    selector: 'geoengine-backend-status-page',
    templateUrl: './backend-status-page.component.html',
    styleUrls: ['./backend-status-page.component.scss'],
})
export class BackendStatusPageComponent implements OnInit {
    public backendAvailable = false;
    public error: HttpErrorResponse | undefined = undefined;
    public backendInfo: BackendInfoDict | undefined = undefined;

    constructor(
        private backendService: BackendService,
        private changeDetectorRef: ChangeDetectorRef,
        private router: Router,
        private userService: UserService,
    ) {}

    ngOnInit(): void {
        this.fetchBackendState();
    }

    fetchBackendState(): void {
        this.backendService.getBackendAvailable().subscribe({
            next: () => {
                this.backendAvailable = true;
                this.error = undefined;
                setTimeout(() => this.changeDetectorRef.markForCheck());
            },
            error: (error: HttpErrorResponse) => {
                this.error = error;
                this.backendAvailable = false;
                setTimeout(() => this.changeDetectorRef.markForCheck());
            },
        });

        this.backendService.getBackendInfo().subscribe({
            next: (backendInfo) => {
                this.backendInfo = backendInfo;
                setTimeout(() => this.changeDetectorRef.markForCheck());
            },
            error: (_err) => {
                this.backendInfo = undefined;
                setTimeout(() => this.changeDetectorRef.markForCheck());
            },
        });
    }

    refresh(): void {
        this.fetchBackendState();
    }

    goBack(): void {
        this.userService.getSessionOrUndefinedStream().subscribe((_session) => {
            this.router.navigate(['/map']);
        });

        if (!this.backendAvailable) {
            this.userService.initializeSessionFromBrowserOrCreateGuest();
        }
    }
}
