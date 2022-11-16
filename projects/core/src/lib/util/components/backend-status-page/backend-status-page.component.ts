import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {BackendInfoDict} from '../../../backend/backend.model';
import {BackendService, BackendStatus} from '../../../backend/backend.service';

@Component({
    selector: 'geoengine-backend-status-page',
    templateUrl: './backend-status-page.component.html',
    styleUrls: ['./backend-status-page.component.scss'],
})
export class BackendStatusPageComponent implements OnInit {
    public backendStatus: BackendStatus | undefined = undefined;
    public backendInfo: BackendInfoDict | undefined = undefined;

    constructor(private backendService: BackendService, private changeDetectorRef: ChangeDetectorRef, private router: Router) {
        this.fetchBackendState();
    }

    ngOnInit(): void {}

    fetchBackendState(): void {
        this.backendService.getBackendStatus().subscribe({
            next: (status) => {
                this.backendStatus = status;

                if (status.available) {
                    this.refreshBackendInfo();
                } else {
                    this.backendInfo = undefined;
                }

                setTimeout(() => this.changeDetectorRef.markForCheck());
            },
        });
    }

    refreshBackendInfo(): void {
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
        this.backendService.triggerBackendStatusUpdate();
    }

    goBack(): void {
        this.refresh();
        setTimeout(() => {
            this.router.navigate(['/map']);
        });
    }
}
