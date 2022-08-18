import {BehaviorSubject, Subscription} from 'rxjs';

import {AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';

import {Config} from '../../config.service';
import {WaveValidators} from '../../util/form.validators';
import {UserService} from '../user.service';
import {User} from '../user.model';
import {NotificationService} from '../../notification.service';
import {first} from 'rxjs/operators';

enum FormStatus {
    LoggedOut,
    LoggedIn,
    Loading,
}

@Component({
    selector: 'wave-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
    readonly FormStatus = FormStatus;

    formStatus$ = new BehaviorSubject<FormStatus>(FormStatus.Loading);

    loginForm: UntypedFormGroup;

    user?: User;
    invalidCredentials$ = new BehaviorSubject<boolean>(false);

    private formStatusSubscription?: Subscription;

    constructor(
        private readonly changeDetectorRef: ChangeDetectorRef,
        private readonly config: Config,
        private readonly userService: UserService,
        private readonly notificationService: NotificationService,
    ) {
        this.loginForm = new UntypedFormGroup({
            email: new UntypedFormControl(
                '',
                Validators.compose([Validators.required, WaveValidators.keyword([this.config.USER.GUEST.NAME])]),
            ),
            password: new UntypedFormControl('', Validators.required),
        });
    }

    ngOnInit(): void {
        this.userService
            .getSessionStream()
            .pipe(first())
            .subscribe((session) => {
                if (!session.user || session.user.isGuest) {
                    this.formStatus$.next(FormStatus.LoggedOut);
                } else {
                    this.user = session.user;
                    this.formStatus$.next(FormStatus.LoggedIn);
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
}
