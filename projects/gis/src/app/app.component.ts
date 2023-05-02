import {ChangeDetectionStrategy, Component, Inject, OnInit, ViewContainerRef} from '@angular/core';
import {MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer, Title} from '@angular/platform-browser';
import {Router} from '@angular/router';
import {Config, UserService} from '@geoengine/core';
import {AppConfig} from './app-config.service';
import {Location} from '@angular/common';

@Component({
    selector: 'geoengine-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
    constructor(
        private readonly iconRegistry: MatIconRegistry,
        private readonly sanitizer: DomSanitizer,
        private readonly userService: UserService,
        private readonly router: Router,
        @Inject(Config) readonly config: AppConfig,
        private readonly titleService: Title,
        private readonly vcRef: ViewContainerRef,
        private readonly location: Location,
    ) {
        this.registerIcons();

        this.setupLogoutCallback();

        this.titleService.setTitle(this.config.BRANDING.PAGE_TITLE);
    }

    ngOnInit(): void {
        if (window.location.search.length > 0) {
            // remove the query parameters before the hash from the url because they are not part of the app and cannot be removed later on
            // services can get the original query parameters from the `URLSearchParams` in their constructor which is called before the routing is initialized.
            const search = window.location.search;
            window.history.replaceState(null, '', window.location.pathname);
            this.location.go('/', search);
        }

        this.router.initialNavigation();
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
