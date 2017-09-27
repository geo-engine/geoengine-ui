import {ChangeDetectionStrategy, Component, OnDestroy} from '@angular/core';

import {BehaviorSubject, Observable, Subscription} from 'rxjs/Rx';
import * as moment from 'moment';

import {Basket, BasketsOverview, BasketTypeAbcdGrouped} from './gfbio-basket.model';
import {MappingQueryService} from '../../../queries/mapping-query.service';
import {NotificationService} from '../../../notification.service';
import {ReplaySubject} from 'rxjs/ReplaySubject';

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

    constructor(private mappingQueryService: MappingQueryService,
                private notificationService: NotificationService) {
        let initialBasketLoaded = false;

        this.subscriptions.push(
            Observable
                .combineLatest(this.page$, this.limit$, this.reload$)
                .do(() => this.isOverviewLoading$.next(true))
                .flatMap(([page, limit]) => this.mappingQueryService
                    .getGFBioBaskets({offset: page * limit, limit: limit})
                    .do(() => this.isError$.next(false))
                    .catch(error => {
                        this.isError$.next(true);
                        this.notificationService.error(error);
                        return Observable.of({
                            baskets: [],
                            totalNumberOfBaskets: NaN,
                        } as BasketsOverview);
                    }))
                .do(() => this.isOverviewLoading$.next(false))
                .do(basketsOverviews => {
                    if (!initialBasketLoaded && basketsOverviews.baskets.length > 0) {
                        this.loadBasket(basketsOverviews.baskets[0].basketId);
                        initialBasketLoaded = true;
                    }
                })
                .subscribe(basketsOverview => this.basketsOverview$.next(basketsOverview))
        );

        this.subscriptions.push(
            Observable
                .combineLatest(this.selectedBasketId$, this.reload$)
                .do(() => this.isDetailsLoading$.next(true))
                .flatMap(([id]) => this.mappingQueryService
                    .getGFBioBasket(id)
                    .do(() => this.isError$.next(false))
                    .catch(error => {
                        this.isError$.next(true);
                        this.notificationService.error(error);
                        return Observable.of({
                            query: '',
                            results: [],
                            timestamp: moment.invalid(),
                        } as Basket);
                    }))
                .do(() => this.isDetailsLoading$.next(false))
                .subscribe(basket => this.selectedBasket$.next(basket))
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
