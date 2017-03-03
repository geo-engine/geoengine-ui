import {Directive, ViewContainerRef, Component, TemplateRef} from '@angular/core';
import {Config} from '../config.service';
import {UserService} from '../../users/user.service';

@Directive({
  selector: '[waveIfGfbioLoggedIn]'
})
export class IfGfbioLoggedInDirective {

  constructor(private config: Config,
              private userService: UserService,
              private templateRef: TemplateRef<Component>,
              private viewContainer: ViewContainerRef) {
      const projectIsGFBio = this.config.PROJECT.toLowerCase() === 'gfbio';
      const userIsLoggedInGFBio = this.userService.getSession().isExternallyConnected;
      if (projectIsGFBio && userIsLoggedInGFBio) {
          this.viewContainer.createEmbeddedView(this.templateRef);
      }
  }

}
