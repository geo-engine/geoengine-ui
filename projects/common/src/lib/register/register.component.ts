import {BehaviorSubject, Observable} from 'rxjs';

import {AfterViewInit, ChangeDetectionStrategy, Component, input} from '@angular/core';
import {UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';

import {map, mergeMap} from 'rxjs/operators';
import {Router} from '@angular/router';
import {CommonConfig} from '../config.service';
import {UserService} from '../user/user.service';
import {NotificationService} from '../notification.service';
import {geoengineValidators} from '../util/form.validators';
import {GeoEngineError} from '../util/errors';

@Component({
    selector: 'geoengine-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class RegisterComponent implements AfterViewInit {
    PASSWORD_MIN_LENGTH = 8;

    loginRedirect = input('/map');

    loading$ = new BehaviorSubject<boolean>(false);
    notLoading$ = this.loading$.pipe(map((loading) => !loading));
    formIsInvalid$: Observable<boolean>;

    registrationError$ = new BehaviorSubject<string>('');

    registrationForm: UntypedFormGroup;

    constructor(
        private readonly config: CommonConfig,
        private readonly userService: UserService,
        private readonly notificationService: NotificationService,
        private readonly router: Router,
    ) {
        this.registrationForm = new UntypedFormGroup({
            name: new UntypedFormControl('', Validators.required),
            email: new UntypedFormControl(
                '',
                Validators.compose([Validators.required, Validators.email, geoengineValidators.keyword([this.config.USER.GUEST.NAME])]),
            ),
            password: new UntypedFormControl('', [Validators.required, Validators.minLength(this.PASSWORD_MIN_LENGTH)]),
        });

        this.formIsInvalid$ = this.registrationForm.statusChanges.pipe(map((status) => status !== 'VALID'));
    }

    ngAfterViewInit(): void {
        // do this once for observables
        setTimeout(() => this.registrationForm.updateValueAndValidity());
    }

    async register(): Promise<void> {
        this.loading$.next(true);
        this.registrationError$.next('');

        const realName: string = this.registrationForm.controls['name'].value;
        const email: string = this.registrationForm.controls['email'].value;
        const password: string = this.registrationForm.controls['password'].value;

        try {
            await this.userService.registerUser({
                email,
                password,
                realName,
            });

            this.notificationService.info('Registration successful!');
            this.redirectToMainView();
        } catch (error) {
            if (error instanceof GeoEngineError) {
                this.registrationError$.next(error.message);
            }

            this.loading$.next(false);
        }
    }

    redirectToMainView(): void {
        this.router.navigate([this.loginRedirect()]);
    }
}
