import {Directive, TemplateRef, Component, ViewContainerRef, OnDestroy} from '@angular/core';
import {UserService} from '@geoengine/common';
import {Subscription} from 'rxjs';

@Directive({
    selector: '[geoengineIfGuest]',
})
export class IfGuestDirective implements OnDestroy {
    private subscription: Subscription;

    constructor(
        private userService: UserService,
        private templateRef: TemplateRef<Component>,
        private viewContainer: ViewContainerRef,
    ) {
        this.subscription = this.userService.isGuestUserStream().subscribe((isGuest) => {
            this.viewContainer.clear();
            if (isGuest) {
                this.viewContainer.createEmbeddedView(this.templateRef).markForCheck();
            }
        });
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }
}
