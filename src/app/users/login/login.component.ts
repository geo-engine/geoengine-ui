import {Component, OnInit, ChangeDetectionStrategy, AfterViewInit} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs/Rx';
import {FormGroup, FormBuilder, Validators, FormControl} from '@angular/forms';
import {Config} from '../../config.service';
import {WaveValidators} from '../../util/form.validators';
import {UserService} from '../user.service';
import {User} from '../user.model';

enum FormStatus {
    LoggedOut,
    LoggedIn,
    Loading
}

@Component({
    selector: 'wave-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit, AfterViewInit {

    formStatus$ = new BehaviorSubject<FormStatus>(FormStatus.Loading);
    isLoggedIn$: Observable<boolean>;
    isLoggedOut$: Observable<boolean>;
    isLoading$: Observable<boolean>;

    loginForm: FormGroup;

    user: Observable<User>;
    invalidCredentials$ = new BehaviorSubject<boolean>(false);

    constructor(private formBuilder: FormBuilder,
                private config: Config,
                private userService: UserService) {
        this.loginForm = this.formBuilder.group({
            loginAuthority: ['system', Validators.required],
            username: ['', Validators.compose([
                Validators.required,
                WaveValidators.keyword([this.config.USER.GUEST.NAME]),
            ])],
            password: ['', Validators.required],
            staySignedIn: [true, Validators.required],
        });

        this.isLoggedIn$ = this.formStatus$.map(status => status === FormStatus.LoggedIn);
        this.isLoggedOut$ = this.formStatus$.map(status => status === FormStatus.LoggedOut);
        this.isLoading$ = this.formStatus$.map(status => status === FormStatus.Loading);
    }

    ngOnInit() {
        this.userService.isSessionValid(this.userService.getSession())
            .subscribe(valid => {
                const isNoGuest = !this.userService.isGuestUser();
                this.formStatus$.next(valid && isNoGuest ? FormStatus.LoggedIn : FormStatus.LoggedOut);

                if (isNoGuest) {
                    this.loginForm.controls['username'].setValue(
                        this.userService.getSession().user
                    );
                }
            });

        this.user = this.userService.getUserStream();
    }

    ngAfterViewInit() {
        // do this once for observables
        setTimeout(() => this.loginForm.updateValueAndValidity(), 0);
    }

    login() {
        this.formStatus$.next(FormStatus.Loading);

        let loginRequest: Observable<boolean>;

        switch (this.loginForm.controls['loginAuthority'].value.toLowerCase()) {
            case 'gfbio':
                loginRequest = this.userService.gfbioLogin({
                    user: this.loginForm.controls['username'].value,
                    password: this.loginForm.controls['password'].value,
                });

                break;
            case 'system':
            /* falls through */
            default:
                loginRequest = this.userService.login({
                    user: this.loginForm.controls['username'].value,
                    password: this.loginForm.controls['password'].value,
                    staySignedIn: this.loginForm.controls['staySignedIn'].value.checked,
                });
                break;
        }

        loginRequest.subscribe(valid => {
            if (valid) {
                this.invalidCredentials$.next(false);
                this.formStatus$.next(FormStatus.LoggedIn);
            } else {
                this.invalidCredentials$.next(true);
                (this.loginForm.controls['password'] as FormControl).setValue('');
                this.formStatus$.next(FormStatus.LoggedOut);
            }
        });
    }

    logout() {
        this.formStatus$.next(FormStatus.Loading);
        this.userService.guestLogin().subscribe(success => {
            // TODO: what to do if this is not successful?
            this.loginForm.controls['password'].setValue('');
            this.formStatus$.next(FormStatus.LoggedOut);
        });
    }

}
