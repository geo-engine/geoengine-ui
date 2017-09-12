import {Component, OnDestroy, ChangeDetectorRef} from '@angular/core';

import {Observable, Subscription, BehaviorSubject} from 'rxjs/Rx';

import {IBasket, BasketTypeAbcdGrouped} from './gfbio-basket.model';
import {UserService} from '../../../users/user.service';

@Component({
    selector: 'wave-gfbio-baskets',
    templateUrl: './gfbio-baskets.component.html',
    styleUrls: ['./gfbio-baskets.component.css']
})

export class GfbioBasketsComponent implements OnDestroy {

    baskets: Array<IBasket> = [];
    selectedBasket: IBasket;

    private _abcdGroupedType: BasketTypeAbcdGrouped = 'abcd_grouped';

    private gfbioBasketStream: Observable<Array<IBasket>>;
    private subscription: Subscription;
    private isLoading$ = new BehaviorSubject<boolean>(true);

    constructor(
        private userService: UserService,
        private changeDetectorRef: ChangeDetectorRef
    ) {
        this.gfbioBasketStream = this.userService.getGfbioBasketStream();
        this.subscribeToBasketStream();
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    reload() {
        this.baskets = [];
        this.selectedBasket = undefined;

        this.subscribeToBasketStream();

        this.isLoading$.next(true);
    }

    private subscribeToBasketStream() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }

        this.subscription = this.gfbioBasketStream.subscribe(baskets => {
            this.baskets = baskets;
            if (!this.selectedBasket && !!baskets && baskets.length > 0) {
                this.selectedBasket = baskets[0];
            }
            this.isLoading$.next(false);
            this.changeDetectorRef.markForCheck();
        });
    }
}
