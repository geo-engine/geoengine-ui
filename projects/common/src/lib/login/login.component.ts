import {BehaviorSubject, Subscription} from 'rxjs';

import {AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, input, OnDestroy, OnInit, inject} from '@angular/core';
import {UntypedFormControl, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule} from '@angular/forms';

import {first} from 'rxjs/operators';
import {Router, RouterLink} from '@angular/router';
import {CommonConfig} from '../config.service';
import {UserService} from '../user/user.service';
import {geoengineValidators} from '../util/form.validators';
import {User} from '../user/user.model';
import {NotificationService} from '../notification.service';
import {
    FxLayoutDirective,
    FxLayoutAlignDirective,
    FxLayoutGapDirective,
    FxFlexDirective,
} from '../util/directives/flexbox-legacy.directive';
import {MatCard, MatCardHeader, MatCardSubtitle, MatCardContent, MatCardActions} from '@angular/material/card';
import {MatButton} from '@angular/material/button';
import {MatFormField, MatInput} from '@angular/material/input';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {MatIcon} from '@angular/material/icon';
import {MatTooltip} from '@angular/material/tooltip';
import {AsyncPipe} from '@angular/common';
import {AsyncValueDefault} from '../util/pipes/async-converters.pipe';

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
    imports: [
        FormsModule,
        ReactiveFormsModule,
        FxLayoutDirective,
        FxLayoutAlignDirective,
        MatCard,
        MatCardHeader,
        MatCardSubtitle,
        MatCardContent,
        MatCardActions,
        MatButton,
        MatFormField,
        MatInput,
        MatProgressSpinner,
        FxLayoutGapDirective,
        FxFlexDirective,
        RouterLink,
        MatIcon,
        MatTooltip,
        AsyncPipe,
        AsyncValueDefault,
    ],
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
    readonly config = inject(CommonConfig);
    private readonly changeDetectorRef = inject(ChangeDetectorRef);
    private readonly userService = inject(UserService);
    private readonly notificationService = inject(NotificationService);
    private readonly router = inject(Router);

    readonly FormStatus = FormStatus;

    readonly loginRedirect = input('/map');

    formStatus$ = new BehaviorSubject<FormStatus>(FormStatus.Loading);
    canRegister = this.config.USER.REGISTRATION_AVAILABLE;

    loginForm: UntypedFormGroup;

    user?: User;
    invalidCredentials$ = new BehaviorSubject<boolean>(false);

    private oidcUrl = '';

    private formStatusSubscription?: Subscription;

    constructor() {
        this.loginForm = new UntypedFormGroup({
            email: new UntypedFormControl(
                '',
                Validators.compose([Validators.required, geoengineValidators.keyword([this.config.USER.GUEST.NAME])]),
            ),
            password: new UntypedFormControl('', Validators.required),
        });
    }

    ngOnInit(): void {
        const redirectUri = window.location.href.replace(/\/signin$/, this.loginRedirect());

        // check if OIDC login is enabled
        this.userService.oidcInit(redirectUri).subscribe(
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
                        if (!session?.user || session.user.isGuest) {
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
        this.router.navigate([this.loginRedirect()]);
    }
}
