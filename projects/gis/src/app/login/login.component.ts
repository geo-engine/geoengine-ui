import {BehaviorSubject, Subscription} from 'rxjs';

import {AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';

import {Config, NotificationService, UserService, User, geoengineValidators} from '@geoengine/core';
import {first} from 'rxjs/operators';
import {Router} from '@angular/router';
import {AppConfig} from '../app-config.service';

enum FormStatus {
    LoggedOut,
    LoggedIn,
    Loading,
    Oidc,
}

@Component({
    selector: 'geoengine-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
    readonly FormStatus = FormStatus;

    formStatus$ = new BehaviorSubject<FormStatus>(FormStatus.Loading);
    canRegister = this.config.COMPONENTS.REGISTRATION.AVAILABLE;

    loginForm: UntypedFormGroup;

    user?: User;
    invalidCredentials$ = new BehaviorSubject<boolean>(false);

    private oidcUrl = '';

    private formStatusSubscription?: Subscription;

    constructor(
        private readonly changeDetectorRef: ChangeDetectorRef,
        @Inject(Config) private readonly config: AppConfig,
        private readonly userService: UserService,
        private readonly notificationService: NotificationService,
        private readonly router: Router,
    ) {
        this.loginForm = new UntypedFormGroup({
            email: new UntypedFormControl(
                '',
                Validators.compose([Validators.required, geoengineValidators.keyword([this.config.USER.GUEST.NAME])]),
            ),
            password: new UntypedFormControl('', Validators.required),
        });
    }

    ngOnInit(): void {
        // check if OIDC login is enabled
        this.userService.oidcInit().subscribe(
            (idr) => {
                this.oidcUrl = idr.url;
                this.formStatus$.next(FormStatus.Oidc);
            },
            (_error) => {
                // OIDC login failed show local login
                this.userService
                    .getSessionOrUndefinedStream()
                    .pipe(first())
                    .subscribe((session) => {
                        if (!session || !session.user || session.user.isGuest) {
                            this.formStatus$.next(FormStatus.LoggedOut);
                        } else {
                            this.user = session.user;
                            this.formStatus$.next(FormStatus.LoggedIn);
                        }
                    });
            },
        );

        // this essentially allows checking for the sidenav-header component on status changes
        this.formStatusSubscription = this.formStatus$.subscribe(() => setTimeout(() => this.changeDetectorRef.markForCheck()));
    }

    ngAfterViewInit(): void {
        // do this once for observables
        setTimeout(() => this.loginForm.updateValueAndValidity());
    }

    ngOnDestroy(): void {
        if (this.formStatusSubscription) {
            this.formStatusSubscription.unsubscribe();
        }
    }

    oidcLogin(): void {
        this.formStatus$.next(FormStatus.Loading);
        window.location.href = this.oidcUrl;
    }

    login(): void {
        this.formStatus$.next(FormStatus.Loading);

        this.userService
            .login({
                email: this.loginForm.controls['email'].value,
                password: this.loginForm.controls['password'].value,
            })
            .subscribe(
                (session) => {
                    this.user = session.user;
                    this.invalidCredentials$.next(false);
                    this.formStatus$.next(FormStatus.LoggedIn);

                    this.redirectToMainView();
                },
                () => {
                    // on error
                    this.invalidCredentials$.next(true);
                    (this.loginForm.controls['password'] as UntypedFormControl).setValue('');
                    this.formStatus$.next(FormStatus.LoggedOut);
                },
            );
    }

    logout(): void {
        this.formStatus$.next(FormStatus.LoggedOut);

        // we log out by trying to perform a guest login
        // if this fails, we will get logged out
        this.userService.guestLogin().subscribe(
            (_) => {
                this.loginForm.controls['password'].setValue('');
            },
            (error) => {
                if (error.error.error !== 'AnonymousAccessDisabled') {
                    this.notificationService.error(`The backend is currently unavailable (${error})`);
                }
            },
        );
    }

    redirectToMainView(): void {
        this.router.navigate(['map']);
    }
}
