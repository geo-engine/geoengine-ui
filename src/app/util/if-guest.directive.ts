import {Directive, TemplateRef, Component, ViewContainerRef, OnDestroy} from '@angular/core';
import {UserService} from '../users/user.service';
import {Subscription} from 'rxjs/Rx';

@Directive({
    selector: '[waveIfGuest]'
})
export class IfGuestDirective implements OnDestroy {

    private subscription: Subscription;

    constructor(private userService: UserService,
                private templateRef: TemplateRef<Component>,
                private viewContainer: ViewContainerRef) {
        this.subscription = this.userService.isGuestUserStream().subscribe(isGuest => {
            if (isGuest) {
                this.viewContainer.createEmbeddedView(this.templateRef).markForCheck();
            } else {
                this.viewContainer.clear();
            }
        });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

}
