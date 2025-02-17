import {ChangeDetectionStrategy, Component, ViewContainerRef} from '@angular/core';
import {MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer} from '@angular/platform-browser';
import {Router} from '@angular/router';
import {UserService} from '@geoengine/common';

@Component({
    selector: 'geoengine-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class AppComponent {
    constructor(
        private readonly iconRegistry: MatIconRegistry,
        private readonly sanitizer: DomSanitizer,
        private readonly userService: UserService,
        private readonly router: Router,
        private readonly vcRef: ViewContainerRef,
    ) {
        this.registerIcons();

        this.setupLogoutCallback();
    }

    private registerIcons(): void {
        this.iconRegistry.addSvgIconInNamespace(
            'geoengine',
            'logo',
            this.sanitizer.bypassSecurityTrustResourceUrl('assets/geoengine-white.svg'),
        );

        // used for navigation
        this.iconRegistry.addSvgIcon('cogs', this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/cogs.svg'));
    }

    private setupLogoutCallback(): void {
        this.userService.setLogoutCallback(() => {
            this.router.navigate(['signin']);
        });
    }
}
