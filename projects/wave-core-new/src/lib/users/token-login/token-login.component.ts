import {BehaviorSubject, Subscription} from 'rxjs';

import {AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';

import {first} from 'rxjs/operators';
import {Router} from '@angular/router';
import {UserService} from '../user.service';
import {UUID} from '../../backend/backend.model';

enum FormStatus {
    LoggedOut,
    LoggedIn,
    Loading,
}

@Component({
    selector: 'wave-token-login',
    templateUrl: './token-login.component.html',
    styleUrls: ['./token-login.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenLoginComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input() routeTo?: Array<string>;
    @Input() invalidTokenText = 'Invalid token';
    @Input() color: 'primary' | 'accent' = 'primary';

    readonly FormStatus = FormStatus;

    formStatus$ = new BehaviorSubject<FormStatus>(FormStatus.LoggedOut);

    loginForm: UntypedFormGroup;

    invalidCredentials$ = new BehaviorSubject<boolean>(false);

    private formStatusSubscription?: Subscription;

    constructor(
        private readonly changeDetectorRef: ChangeDetectorRef,
        private readonly userService: UserService,
        private readonly router: Router,
    ) {
        this.loginForm = new UntypedFormGroup({
            sessionToken: new UntypedFormControl('', Validators.required),
        });
    }

    ngOnInit(): void {
        this.userService
            .getSessionOrUndefinedStream()
            .pipe(first())
            .subscribe((session) => {
                if (session) {
                    this.redirectRoute();
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

                this.redirectRoute();
            },
            () => {
                // on error
                this.invalidCredentials$.next(true);
                (this.loginForm.controls['sessionToken'] as UntypedFormControl).setValue('');
                this.formStatus$.next(FormStatus.LoggedOut);
            },
        );
    }

    redirectRoute(): void {
        if (!this.routeTo) {
            return;
        }
        this.router.navigate(this.routeTo);
    }
}
