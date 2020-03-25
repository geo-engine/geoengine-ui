import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {first} from 'rxjs/operators';

import {Component, OnInit, ChangeDetectionStrategy, AfterViewInit, Inject, ChangeDetectorRef, OnDestroy} from '@angular/core';

import {Config, NotificationService, User, UserService} from 'wave-core';

import {AppConfig} from '../../app-config.service';
import {Nature40UserService} from '../nature40-user.service';


enum FormStatus {
    LoggedOut,
    LoggedIn,
    Loading,
}

@Component({
    selector: 'wave-nature40-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {

    readonly FormStatus = FormStatus;

    formStatus$ = new BehaviorSubject<FormStatus>(FormStatus.Loading);
    user: Observable<User>;

    private formStatusSubscription: Subscription;

    constructor(@Inject(Config) private readonly config: AppConfig,
                @Inject(UserService) private readonly userService: Nature40UserService,
                private readonly changeDetectorRef: ChangeDetectorRef,
                private readonly notificationService: NotificationService) {
    }

    ngOnInit() {
        this.userService.isSessionValid(this.userService.getSession())
            .subscribe(valid => {
                const isNoGuest = !this.userService.isGuestUser();
                this.formStatus$.next(valid && isNoGuest ? FormStatus.LoggedIn : FormStatus.LoggedOut);
            });

        this.user = this.userService.getUserStream();

        this.formStatusSubscription = this.formStatus$.subscribe(() => setTimeout(() => this.changeDetectorRef.markForCheck()));
    }

    ngAfterViewInit() {
    }

    ngOnDestroy() {
        if (this.formStatusSubscription) {
            this.formStatusSubscription.unsubscribe();
        }
    }

    login() {
        this.formStatus$.next(FormStatus.Loading);
        this.userService.getNature40JwtClientToken().pipe(
            first(),
        ).subscribe(
            ({clientToken}: { clientToken }) => {
                // no need to set form status since we redirect the page
                window.location.href = this.config.NATURE40.SSO_JWT_PROVIDER_URL + clientToken;
            },
            error => {
                const errorString = error.toString() === {}.toString() ? '' : ` (${error})`;
                this.notificationService.error('The backend is currently unavailable' + errorString);
                this.formStatus$.next(FormStatus.LoggedOut);
            },
        );
    }

    logout() {
        this.formStatus$.next(FormStatus.Loading);
        this.userService.guestLogin().subscribe(
            () => this.formStatus$.next(FormStatus.LoggedOut),
            error => this.notificationService.error(`The backend is currently unavailable (${error})`),
        );
    }
}
