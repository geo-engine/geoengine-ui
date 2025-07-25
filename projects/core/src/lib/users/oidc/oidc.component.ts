import {Component, OnInit, OnDestroy} from '@angular/core';
import {BehaviorSubject, finalize, first, SubscriptionLike} from 'rxjs';

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
import {AsyncPipe} from '@angular/common';

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
        AsyncPipe,
    ],
})
export class OidcComponent implements OnInit, OnDestroy {
    user?: User;
    loginDisabled: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    private userSubscription?: SubscriptionLike;
    private loginSubscription?: SubscriptionLike;
    private logoutSubscription?: SubscriptionLike;

    private pendingLoginRequest = false;

    constructor(
        private readonly userService: UserService,
        private readonly router: Router,
    ) {}

    ngOnInit(): void {
        this.userSubscription = this.userService
            .getSessionStream()
            .pipe(first())
            .subscribe((session) => {
                if (!session.user || session.user.isGuest) {
                    return;
                }

                this.user = session.user;
            });
    }

    login(): void {
        if (!this.pendingLoginRequest) {
            this.pendingLoginRequest = true;
            this.loginDisabled.next(true);
            this.loginSubscription = this.userService
                .oidcInit(window.location.href)
                .pipe(
                    first(),
                    finalize(() => {
                        this.pendingLoginRequest = false;
                        this.loginDisabled.next(false);
                    }),
                )
                .subscribe((idr) => {
                    window.location.href = idr.url;
                });
        }
    }

    logout(): void {
        this.logoutSubscription = this.userService
            .guestLogin()
            .pipe(first())
            .subscribe({
                next: (session) => {
                    if (!session.user || session.user.isGuest) {
                        this.user = undefined;
                    } else {
                        this.user = session.user;
                    }
                },
                error: () => {
                    // guest login failed -> reload the application
                    // we navigate to a dummy url first in order to ensure that the guards (logged in) are executed again
                    const url = this.router.url;
                    this.router.navigate(['/dummy']).then(() => {
                        this.router.navigate([url]);
                    });
                },
                complete: () => {
                    this.logoutSubscription?.unsubscribe();
                },
            });
    }

    ngOnDestroy(): void {
        this.loginDisabled.unsubscribe();
        if (this.loginSubscription) {
            this.loginSubscription.unsubscribe();
        }
        if (this.userSubscription) {
            this.userSubscription.unsubscribe();
        }
        if (this.logoutSubscription) {
            this.logoutSubscription.unsubscribe();
        }
    }
}
