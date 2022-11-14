import {HttpErrorResponse} from '@angular/common/http';
import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {BackendInfoDict} from '../../../backend/backend.model';
import {BackendService} from '../../../backend/backend.service';

@Component({
    selector: 'geoengine-backend-status-page',
    templateUrl: './backend-status-page.component.html',
    styleUrls: [],
})
export class BackendStatusPageComponent implements OnInit {
    public error: HttpErrorResponse | undefined = undefined;
    public backendInfo: BackendInfoDict | undefined = undefined;

    constructor(private backendService: BackendService, private changeDetectorRef: ChangeDetectorRef) {}

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
}
