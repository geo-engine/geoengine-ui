import {BehaviorSubject, Subscription} from 'rxjs';

import {AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';

import {Config, NotificationService, UserService, UUID} from 'wave-core';
import {first} from 'rxjs/operators';
import {Router} from '@angular/router';
import {AppConfig} from '../app-config.service';

enum FormStatus {
    LoggedOut,
    LoggedIn,
    Loading,
}

@Component({
    selector: 'wave-app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
    readonly FormStatus = FormStatus;

    formStatus$ = new BehaviorSubject<FormStatus>(FormStatus.LoggedOut);

    loginForm: FormGroup;

    invalidCredentials$ = new BehaviorSubject<boolean>(false);

    private formStatusSubscription?: Subscription;

    constructor(
        private readonly changeDetectorRef: ChangeDetectorRef,
        @Inject(Config) private readonly config: AppConfig,
        private readonly userService: UserService,
        private readonly notificationService: NotificationService,
        private readonly router: Router,
    ) {
        this.loginForm = new FormGroup({
            sessionToken: new FormControl('', Validators.required),
        });
    }

    ngOnInit(): void {
        this.userService
            .getSessionOrUndefinedStream()
            .pipe(first())
            .subscribe((session) => {
                if (session) {
                    this.redirectToMainView();
                }
            });

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

    login(): void {
        this.formStatus$.next(FormStatus.Loading);

        const sessionToken: UUID = this.loginForm.controls['sessionToken'].value;

        this.userService.createSessionWithToken(sessionToken).subscribe(
            () => {
                this.invalidCredentials$.next(false);
                this.formStatus$.next(FormStatus.LoggedIn);

                this.redirectToMainView();
            },
            () => {
                // on error
                this.invalidCredentials$.next(true);
                (this.loginForm.controls['sessionToken'] as FormControl).setValue('');
                this.formStatus$.next(FormStatus.LoggedOut);
            },
        );
    }

    redirectToMainView(): void {
        this.router.navigate(['map']);
    }
}
