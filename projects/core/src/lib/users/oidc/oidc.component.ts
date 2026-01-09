import {Component, inject, signal, resource} from '@angular/core';
import {User} from '../user.model';
import {Router} from '@angular/router';
import {UserService} from '@geoengine/common';
import {SidenavHeaderComponent} from '../../sidenav/sidenav-header/sidenav-header.component';
import {MatCard, MatCardHeader, MatCardTitle, MatCardContent} from '@angular/material/card';
import {IfLoggedInDirective} from '../../util/directives/if-logged-in.directive';
import {MatButton} from '@angular/material/button';
import {IfGuestDirective} from '../../util/directives/if-guest.directive';
import {UserSessionComponent} from '../user-session/user-session.component';
import {QuotaInfoComponent} from '../quota/quota-info/quota-info.component';
import {RolesComponent} from '../roles/roles.component';
import {firstValueFrom} from 'rxjs';

@Component({
    selector: 'geoengine-oidc',
    templateUrl: 'oidc.component.html',
    styleUrls: ['./oidc.component.scss'],
    imports: [
        SidenavHeaderComponent,
        MatCard,
        MatCardHeader,
        MatCardTitle,
        MatCardContent,
        IfLoggedInDirective,
        MatButton,
        IfGuestDirective,
        UserSessionComponent,
        QuotaInfoComponent,
        RolesComponent,
    ],
})
export class OidcComponent {
    private readonly userService = inject(UserService);
    private readonly router = inject(Router);

    readonly user = resource({
        defaultValue: undefined,
        loader: async (): Promise<User | undefined> => {
            const session = await firstValueFrom(this.userService.getSessionStream());
            if (!session.user || session.user.isGuest) {
                return undefined;
            }
            return session.user;
        },
    });
    readonly loginDisabled = signal<boolean>(false);

    private pendingLoginRequest = false;

    async login(): Promise<void> {
        if (this.pendingLoginRequest) return;

        this.pendingLoginRequest = true;
        this.loginDisabled.set(true);

        try {
            const idr = await this.userService.oidcInit(window.location.href);
            window.location.href = idr.url;
        } catch {
            // reset pending state on error
            this.pendingLoginRequest = false;
            this.loginDisabled.set(false);
        }
    }

    async logout(): Promise<void> {
        try {
            const session = await this.userService.guestLogin();
            if (!session.user || session.user.isGuest) {
                this.user.set(undefined);
            } else {
                this.user.set(session.user);
            }
        } catch {
            // guest login failed -> reload the application
            // we navigate to a dummy url first in order to ensure that the guards (logged in) are executed again
            const url = this.router.url;
            await this.router.navigate(['/dummy']);
            await this.router.navigate([url]);
        }
    }
}
