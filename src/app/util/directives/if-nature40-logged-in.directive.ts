import {Directive, ViewContainerRef, Component, TemplateRef} from '@angular/core';
import {Config} from '../../config.service';
import {UserService} from '../../users/user.service';

@Directive({
    selector: '[waveIfNature40LoggedIn]'
})
export class IfNature40LoggedInDirective {

    constructor(private config: Config,
                private userService: UserService,
                private templateRef: TemplateRef<Component>,
                private viewContainer: ViewContainerRef) {
        const projectIsNature40 = this.config.PROJECT === 'Nature40';
        const userIsLoggedIn = this.userService.getSession().isExternallyConnected;
        if (projectIsNature40 && userIsLoggedIn) {
            this.viewContainer.createEmbeddedView(this.templateRef);
        }
    }

}
