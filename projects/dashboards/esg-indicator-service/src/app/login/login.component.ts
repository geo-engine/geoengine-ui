import {BehaviorSubject, Subscription} from 'rxjs';

import {AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';

import {NotificationService, UserService, User, CoreModule} from '@geoengine/core';
import {first} from 'rxjs/operators';
import {Router} from '@angular/router';
import {AsyncPipe} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';

enum FormStatus {
    LoggedOut,
    LoggedIn,
    Loading,
    Oidc,
}

@Component({
    selector: 'geoengine-login',
    standalone: true,
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    imports: [CoreModule, AsyncPipe, MatGridListModule, MatMenuModule, MatIconModule, MatButtonModule, MatCardModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
    readonly FormStatus = FormStatus;

    formStatus$ = new BehaviorSubject<FormStatus>(FormStatus.Loading);

    loginForm: UntypedFormGroup;

    user?: User;
    invalidCredentials$ = new BehaviorSubject<boolean>(false);

    private oidcUrl = '';

    private formStatusSubscription?: Subscription;

    constructor(
        private readonly changeDetectorRef: ChangeDetectorRef,
        private readonly userService: UserService,
        private readonly notificationService: NotificationService,
        private readonly router: Router,
    ) {
        this.loginForm = new UntypedFormGroup({
            email: new UntypedFormControl('', Validators.compose([Validators.required])),
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
    }

    redirectToMainView(): void {
        this.router.navigate(['dashboard']);
    }
}
