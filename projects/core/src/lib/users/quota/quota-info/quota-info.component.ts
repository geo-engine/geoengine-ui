import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {UserService} from '../../user.service';
import {Quota} from '../quota.model';

@Component({
    selector: 'geoengine-quota-info',
    templateUrl: './quota-info.component.html',
    styleUrls: ['./quota-info.component.scss'],
})
export class QuotaInfoComponent implements OnDestroy, OnInit {
    sessionQuota: Quota | undefined;
    sessionQuotaSubscription: Subscription | undefined;

    constructor(protected readonly userService: UserService, protected readonly changeDetectorRef: ChangeDetectorRef) {}

    ngOnInit(): void {
        this.sessionQuotaSubscription = this.userService.getSessionQuotaStream().subscribe((quota) => {
            this.sessionQuota = quota;
            this.changeDetectorRef.detectChanges();
        });

        setInterval(() => {
            this.refreshQuota();
        }, 3000);
    }

    ngOnDestroy(): void {
        this.sessionQuotaSubscription?.unsubscribe();
    }

    protected hasQuota(): boolean {
        return !!this.sessionQuota;
    }

    protected refreshQuota(): void {
        this.userService.refreshSessionQuota();
    }
}
