import {ChangeDetectionStrategy, Component, Inject, ViewContainerRef} from '@angular/core';
import {MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer, Title} from '@angular/platform-browser';
import {Router} from '@angular/router';
import {Config, UserService} from '@geoengine/core';
import {AppConfig} from './app-config.service';

@Component({
    selector: 'geoengine-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
    constructor(
        private readonly iconRegistry: MatIconRegistry,
        private readonly sanitizer: DomSanitizer,
        private readonly userService: UserService,
        private readonly router: Router,
        @Inject(Config) readonly config: AppConfig,
        private readonly titleService: Title,
        private readonly vcRef: ViewContainerRef,
    ) {
        this.registerIcons();

        this.setupLogoutCallback();

        this.titleService.setTitle(this.config.BRANDING.PAGE_TITLE);
    }

    private registerIcons(): void {
        this.iconRegistry.addSvgIconInNamespace(
            'geoengine',
            'logo',
            this.sanitizer.bypassSecurityTrustResourceUrl(this.config.BRANDING.LOGO_URL),
        );

        this.iconRegistry.addSvgIconInNamespace(
            'geoengine',
            'favicon-white',
            this.sanitizer.bypassSecurityTrustResourceUrl(this.config.BRANDING.LOGO_ICON_URL),
        );

        this.iconRegistry.addSvgIconInNamespace(
            'geoengine',
            'logo-alt',
            this.sanitizer.bypassSecurityTrustResourceUrl(this.config.BRANDING.LOGO_ALT_URL),
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
