import {ChangeDetectorRef, Component, OnDestroy} from '@angular/core';
import {ProjectService} from '../../../project/project.service';
import {BehaviorSubject, combineLatest, mergeMap, of, Subscription} from 'rxjs';
import {UserService} from '../../user.service';
import {Quota} from '../quota.model';
import {BackendService} from '../../../backend/backend.service';
import {ThemePalette} from '@angular/material/core';
import {MapService} from '../../../map/map.service';

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
        protected readonly mapService: MapService,
    ) {
        this.sessionSubscription = combineLatest([
            this.userService.isBackendFeatureEnabled('pro'),
            this.userService.getSessionStream(),
            this.mapService.getViewportSizeStream(),
            this.updateQuota$,
        ])
            .pipe(
                mergeMap(([isPro, _session, _viewport, _update]) => {
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
                this.changeDetectorRef.markForCheck();
            });

        setInterval(() => {
            this.refreshQuota();
        }, 3000);
    }

    ngOnDestroy(): void {
        this.sessionSubscription?.unsubscribe();
        this.layerSubscription?.unsubscribe();
        this.plotSubscription?.unsubscribe();
    }

    get progressColor(): ThemePalette {
        if (!this.sessionQuota) {
            return undefined;
        }
        if (this.sessionQuota.fractionUsed > 0.9) {
            return 'warn';
        }
        return 'primary';
    }

    protected hasQuota(): boolean {
        return !!this.sessionQuota;
    }

    protected refreshQuota(): void {
        this.updateQuota$.next();
    }
}
