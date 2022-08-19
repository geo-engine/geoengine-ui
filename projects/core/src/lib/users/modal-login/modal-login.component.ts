import {BehaviorSubject, Observable, Subscription} from 'rxjs';

import {ChangeDetectionStrategy, Component, OnDestroy} from '@angular/core';
import {UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';

import {Config} from '../../config.service';
import {WaveValidators} from '../../util/form.validators';
import {User} from '../user.model';
import {Session} from '../session.model';
import {MatDialogRef} from '@angular/material/dialog';

enum FormStatus {
    LoggedOut,
    LoggedIn,
    Loading,
}

export interface UserLogin {
    email: string;
    password: string;
}

@Component({
    selector: 'ge-modal-login',
    templateUrl: './modal-login.component.html',
    styleUrls: ['./modal-login.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalLoginComponent implements OnDestroy {
    readonly FormStatus = FormStatus;

    formStatus$ = new BehaviorSubject<FormStatus>(FormStatus.LoggedOut);

    loginForm: UntypedFormGroup;

    user?: User;
    invalidCredentials$ = new BehaviorSubject<boolean>(false);

    loginCallback!: (credential: UserLogin) => Observable<Session>;

    private formStatusSubscription?: Subscription;

    constructor(private readonly config: Config, private dialogRef: MatDialogRef<ModalLoginComponent>) {
        this.loginForm = new UntypedFormGroup({
            email: new UntypedFormControl(
                '',
                Validators.compose([Validators.required, WaveValidators.keyword([this.config.USER.GUEST.NAME])]),
            ),
            password: new UntypedFormControl('', Validators.required),
        });
    }

    ngOnDestroy(): void {
        if (this.formStatusSubscription) {
            this.formStatusSubscription.unsubscribe();
        }
    }

    login(): void {
        this.formStatus$.next(FormStatus.Loading);

        this.loginCallback({
            email: this.loginForm.controls['email'].value,
            password: this.loginForm.controls['password'].value,
        }).subscribe(
            (session) => {
                this.user = session.user;
                this.invalidCredentials$.next(false);
                this.dialogRef.close();
            },
            () => {
                // on error
                this.invalidCredentials$.next(true);
                (this.loginForm.controls['password'] as UntypedFormControl).setValue('');
                this.formStatus$.next(FormStatus.LoggedOut);
            },
        );
    }
}
