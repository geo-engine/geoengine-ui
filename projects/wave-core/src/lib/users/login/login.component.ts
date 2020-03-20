import {BehaviorSubject, Observable} from 'rxjs';
import {first, map} from 'rxjs/operators';
import {Component, OnInit, ChangeDetectionStrategy, AfterViewInit} from '@angular/core';
import {FormGroup, FormBuilder, Validators, FormControl} from '@angular/forms';
import {Config} from '../../config.service';
import {WaveValidators} from '../../util/form.validators';
import {UserService} from '../user.service';
import {User} from '../user.model';
import {NotificationService} from '../../notification.service';

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
export class LoginComponent implements OnInit, AfterViewInit {

    readonly useSsoLogin = false; // ['Nature40'].includes(this.config.PROJECT); TODO: REMOVE

    formStatus$ = new BehaviorSubject<FormStatus>(FormStatus.Loading);
    isLoggedIn$: Observable<boolean>;
    isLoggedOut$: Observable<boolean>;
    isLoading$: Observable<boolean>;

    loginForm: FormGroup;

    user: Observable<User>;
    invalidCredentials$ = new BehaviorSubject<boolean>(false);

    constructor(private formBuilder: FormBuilder,
                private config: Config,
                private userService: UserService,
                private notificationService: NotificationService) {
        this.loginForm = this.formBuilder.group({
            username: ['', Validators.compose([
                Validators.required,
                WaveValidators.keyword([this.config.USER.GUEST.NAME]),
            ])],
            password: ['', Validators.required],
            staySignedIn: [true, Validators.required],
        });

        this.isLoggedIn$ = this.formStatus$.pipe(map(status => status === FormStatus.LoggedIn));
        this.isLoggedOut$ = this.formStatus$.pipe(map(status => status === FormStatus.LoggedOut));
        this.isLoading$ = this.formStatus$.pipe(map(status => status === FormStatus.Loading));
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

        this.userService.login({
            user: this.loginForm.controls['username'].value,
            password: this.loginForm.controls['password'].value,
            staySignedIn: this.loginForm.controls['staySignedIn'].value,
        }).subscribe(
            valid => {
                if (valid) {
                    this.invalidCredentials$.next(false);
                    this.formStatus$.next(FormStatus.LoggedIn);
                } else {
                    this.invalidCredentials$.next(true);
                    (this.loginForm.controls['password'] as FormControl).setValue('');
                    this.formStatus$.next(FormStatus.LoggedOut);
                }
            },
            () => { // on error
                this.invalidCredentials$.next(true);
                (this.loginForm.controls['password'] as FormControl).setValue('');
                this.formStatus$.next(FormStatus.LoggedOut);
            }
        );
    }

    jwtNature40Login() {
        this.userService.getNature40JwtClientToken().pipe(first()).subscribe(({clientToken}: { clientToken }) => {
            window.location.href = this.config.NATURE40.SSO_JWT_PROVIDER_URL + clientToken;
        });
    }


    logout() {
        this.formStatus$.next(FormStatus.Loading);
        this.userService.guestLogin()
            .subscribe(
                () => {
                    this.loginForm.controls['password'].setValue('');
                    this.formStatus$.next(FormStatus.LoggedOut);
                },
                error => this.notificationService.error(`The backend is currently unavailable (${error})`));
    }
}
