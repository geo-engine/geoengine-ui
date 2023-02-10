import {ChangeDetectorRef, Component, OnDestroy} from '@angular/core';
import {ProjectService} from '../../../project/project.service';
import {BehaviorSubject, combineLatest, debounce, distinct, mergeMap, of, Subscription, tap} from 'rxjs';
import {UserService} from '../../user.service';
import {Quota} from '../quota.model';
import {BackendService} from '../../../backend/backend.service';

@Component({
    selector: 'geoengine-quota-info',
    templateUrl: './quota-info.component.html',
    styleUrls: ['./quota-info.component.scss'],
})
export class QuotaInfoComponent implements OnDestroy {
    sessionQuota: Quota | undefined;
    updateQuota$: BehaviorSubject<void> = new BehaviorSubject<void>(undefined);
    sessionSubscription: Subscription | undefined;
    layerSubscription: Subscription | undefined;
    plotSubscription: Subscription | undefined;

    constructor(
        protected readonly userService: UserService,
        protected readonly projectService: ProjectService,
        protected readonly backendService: BackendService,
        protected readonly changeDetectorRef: ChangeDetectorRef,
    ) {
        this.sessionSubscription = combineLatest([
            this.userService.isBackendFeatureEnabled('pro'),
            this.userService.getSessionStream(),
            this.updateQuota$,
        ])
            .pipe(
                mergeMap(([isPro, _session, _update]) => {
                    if (!isPro) {
                        return of(undefined);
                    }
                    return this.userService.getSessionQuota();
                }),
            )
            .subscribe((quota) => {
                if (quota) {
                    this.sessionQuota = Quota.fromDict(quota);
                } else {
                    this.sessionQuota = undefined;
                }
                console.log('this.sessionQuota', this.sessionQuota);
                this.changeDetectorRef.markForCheck();
            });

        this.layerSubscription = this.projectService.getLayerStream().subscribe((_layer) => {
            this.refreshQuota();
        });
        this.plotSubscription = this.projectService.getPlotStream().subscribe((_plot) => {
            this.refreshQuota();
        });
    }

    ngOnDestroy(): void {
        this.sessionSubscription?.unsubscribe();
        this.layerSubscription?.unsubscribe();
        this.plotSubscription?.unsubscribe();
    }

    get progressColor(): string {
        if (!this.sessionQuota) {
            return 'gray';
        }
        if (this.sessionQuota.percentUsed > 90) {
            return 'warn';
        }
        return 'primary';
    }

    protected hasQuota(): boolean {
        return !!this.sessionQuota;
    }

    protected refreshQuota(): void {
        this.updateQuota$.next(undefined);
    }
}
