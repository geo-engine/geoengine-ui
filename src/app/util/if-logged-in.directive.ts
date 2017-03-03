import {Directive, TemplateRef, Component, ViewContainerRef} from '@angular/core';
import {UserService} from '../../users/user.service';
import {Config} from '../config.service';

@Directive({
    selector: '[waveIfLoggedIn]'
})
export class IfLoggedInDirective {

    constructor(private config: Config,
                private userService: UserService,
                private templateRef: TemplateRef<Component>,
                private viewContainer: ViewContainerRef) {
        const isLoggedIn = !this.userService.isGuestUser();
        if (isLoggedIn) {
            this.viewContainer.createEmbeddedView(this.templateRef);
        }
    }

}
