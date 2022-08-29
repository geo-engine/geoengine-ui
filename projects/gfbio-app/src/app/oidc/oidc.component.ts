import {Component, OnInit, Inject, OnDestroy} from '@angular/core';
import {UserService, Config, User} from 'wave-core';
import {AppConfig} from '../app-config.service';
import {first, SubscriptionLike} from 'rxjs';

@Component({
    selector: 'wave-gfbio-login',
    templateUrl: 'oidc.component.html',
    styleUrls: ['./oidc.component.scss'],
})
export class OidcComponent implements OnInit, OnDestroy {
    private userSubscription: SubscriptionLike | undefined;
    private loginSubscription: SubscriptionLike | undefined;
    private logoutSubscription: SubscriptionLike | undefined;

    user?: User;

    constructor(@Inject(Config) private readonly config: AppConfig, private readonly userService: UserService) {}

    ngOnInit(): void {
        this.userSubscription = this.userService
            .getSessionStream()
            .pipe(first())
            .subscribe((session) => {
                if (!session.user || session.user.isGuest) {
                } else {
                    this.user = session.user;
                }
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
                error: (e) => console.log('error ' + e), //TODO: Remove for final version.
                complete: () => {
                    this.logoutSubscription?.unsubscribe();
                },
            });
    }

    ngOnDestroy() {
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
