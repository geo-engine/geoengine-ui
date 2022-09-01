import {Component, OnInit, OnDestroy} from '@angular/core';
import {first, SubscriptionLike} from 'rxjs';

import {UserService} from '../user.service';
import {User} from '../user.model';

@Component({
    selector: 'wave-oidc',
    templateUrl: 'oidc.component.html',
    styleUrls: ['./oidc.component.scss'],
})
export class OidcComponent implements OnInit, OnDestroy {
    user?: User;

    private userSubscription: SubscriptionLike | undefined;
    private loginSubscription: SubscriptionLike | undefined;
    private logoutSubscription: SubscriptionLike | undefined;

    constructor(private readonly userService: UserService) {}

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
        this.loginSubscription = this.userService.oidcInit().subscribe((idr) => {
            window.location.href = idr.url;
        });
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
                error: () => {},
                complete: () => {
                    this.logoutSubscription?.unsubscribe();
                },
            });
    }

    ngOnDestroy(): void {
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
