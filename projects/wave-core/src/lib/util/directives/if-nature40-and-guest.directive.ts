import {Directive, ViewContainerRef, Component, TemplateRef} from '@angular/core';
import {Config} from '../../config.service';
import {UserService} from '../../users/user.service';

@Directive({
    selector: '[waveIfNature40AndGuest]'
})
export class IfNature40AndGuestDirective {

    constructor(private config: Config,
                private userService: UserService,
                private templateRef: TemplateRef<Component>,
                private viewContainer: ViewContainerRef) {
        const projectIsNature40 = this.config.PROJECT === 'Nature40';
        const isGuestUser = this.userService.isGuestUser();
        if (projectIsNature40 && isGuestUser) {
            this.viewContainer.createEmbeddedView(this.templateRef);
        }
    }

}
