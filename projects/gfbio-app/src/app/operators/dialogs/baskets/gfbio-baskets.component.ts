import {
    of as observableOf, combineLatest as observableCombineLatest, ReplaySubject, BehaviorSubject, Subscription,
} from 'rxjs';
import {tap, mergeMap, catchError} from 'rxjs/operators';

import {ChangeDetectionStrategy, Component, Inject, OnDestroy} from '@angular/core';

import moment from 'moment/src/moment';

import {MappingQueryService, NotificationService} from 'wave-core';

import {Basket, BasketsOverview, BasketTypeAbcdGrouped} from './gfbio-basket.model';
import {GFBioMappingQueryService} from '../../../queries/mapping-query.service';

@Component({
    selector: 'wave-gfbio-baskets',
    templateUrl: './gfbio-baskets.component.html',
    styleUrls: ['./gfbio-baskets.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class GfbioBasketsComponent implements OnDestroy {
    // for template
    BasketTypeAbcdGrouped: BasketTypeAbcdGrouped = 'abcd_grouped';

    page$ = new BehaviorSubject(0);
    limit$ = new BehaviorSubject(5);

    basketsOverview$ = new ReplaySubject<BasketsOverview>(1);
    selectedBasketId$ = new ReplaySubject<number>(1);
    selectedBasket$ = new ReplaySubject<Basket>(1);

    isOverviewLoading$ = new BehaviorSubject(true);
    isDetailsLoading$ = new BehaviorSubject(true);
    isError$ = new BehaviorSubject(false);
    reload$: BehaviorSubject<void> = new BehaviorSubject(undefined);

    historyExpanded$ = new BehaviorSubject(false);

    private subscriptions: Array<Subscription> = [];

    constructor(@Inject(MappingQueryService) private mappingQueryService: GFBioMappingQueryService,
                private notificationService: NotificationService) {
        let initialBasketLoaded = false;

        this.subscriptions.push(
            observableCombineLatest(this.page$, this.limit$, this.reload$).pipe(
                tap(() => this.isOverviewLoading$.next(true)),
                mergeMap(([page, limit]) => this.mappingQueryService
                    .getGFBioBaskets({offset: page * limit, limit}).pipe(
                        tap(() => this.isError$.next(false)),
                        catchError(error => {
                            this.isError$.next(true);
                            this.notificationService.error(error);
                            return observableOf({
                                baskets: [],
                                totalNumberOfBaskets: NaN,
                            } as BasketsOverview);
                        }),
                    )),
                tap(() => this.isOverviewLoading$.next(false)),
                tap(basketsOverviews => {
                    if (!initialBasketLoaded && basketsOverviews.baskets.length > 0) {
                        this.loadBasket(basketsOverviews.baskets[0].basketId);
                        initialBasketLoaded = true;
                    }
                }),
            )
                .subscribe(basketsOverview => this.basketsOverview$.next(basketsOverview))
        );

        this.subscriptions.push(
            observableCombineLatest(this.selectedBasketId$, this.reload$).pipe(
                tap(() => this.isDetailsLoading$.next(true)),
                mergeMap(([id]) => this.mappingQueryService
                    .getGFBioBasket(id).pipe(
                        tap(() => this.isError$.next(false)),
                        catchError(error => {
                            this.isError$.next(true);
                            this.notificationService.error(error);
                            return observableOf({
                                query: '',
                                results: [],
                                timestamp: moment.invalid(),
                            } as Basket);
                        }),
                    )),
                tap(() => this.isDetailsLoading$.next(false)),
            ).subscribe(basket => this.selectedBasket$.next(basket))
        );
    }

    ngOnDestroy() {
        this.subscriptions.forEach(subscription => {
            subscription.unsubscribe();
        });
    }

    loadBasket(id: number) {
        this.selectedBasketId$.next(id);
        this.historyExpanded$.next(false);
    }

    reload() {
        this.reload$.next(undefined);
    }
}
