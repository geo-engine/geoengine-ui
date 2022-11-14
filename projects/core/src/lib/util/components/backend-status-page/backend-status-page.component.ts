import {HttpErrorResponse} from '@angular/common/http';
import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {BackendInfoDict} from '../../../backend/backend.model';
import {BackendService} from '../../../backend/backend.service';

@Component({
    selector: 'geoengine-backend-status-page',
    templateUrl: './backend-status-page.component.html',
    styleUrls: ['./backend-status-page.component.scss'],
})
export class BackendStatusPageComponent implements OnInit {
    public error: HttpErrorResponse | undefined = undefined;
    public backendInfo: BackendInfoDict | undefined = undefined;

    constructor(private backendService: BackendService, private changeDetectorRef: ChangeDetectorRef, private router: Router) {}

    ngOnInit(): void {
        this.backendService.getBackendInfo().subscribe({
            next: (backendInfo) => {
                this.backendInfo = backendInfo;
                this.changeDetectorRef.markForCheck();
            },
            error: (err) => {
                this.error = err;
                this.changeDetectorRef.markForCheck();
            },
            complete: () => this.changeDetectorRef.markForCheck(),
        });
    }

    refresh(): void {
        this.error = undefined;
        this.backendInfo = undefined;

        this.ngOnInit();
    }

    goBack(): void {
        this.router.navigate(['/']);
    }
}
