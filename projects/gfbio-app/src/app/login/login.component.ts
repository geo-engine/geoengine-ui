import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {Component, OnInit, ChangeDetectionStrategy, AfterViewInit, Inject, ChangeDetectorRef, OnDestroy} from '@angular/core';
import {FormGroup, FormBuilder, Validators, FormControl} from '@angular/forms';
import {Config, NotificationService, User, UserService, WaveValidators} from 'wave-core';
import {GFBioUserService} from '../users/user.service';
import {AppConfig} from '../app-config.service';

enum FormStatus {
    LoggedOut,
    LoggedIn,
    Loading,
}

@Component({
    selector: 'wave-gfbio-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {

    readonly FormStatus = FormStatus;

    formStatus$ = new BehaviorSubject<FormStatus>(FormStatus.Loading);

    loginForm: FormGroup;

    user: Observable<User>;
    invalidCredentials$ = new BehaviorSubject<boolean>(false);

    private formStatusSubscription: Subscription;

    constructor(private formBuilder: FormBuilder,
                @Inject(Config) private readonly config: AppConfig,
                @Inject(UserService) private readonly userService: GFBioUserService,
                private readonly changeDetectorRef: ChangeDetectorRef,
                private readonly notificationService: NotificationService) {
        this.loginForm = this.formBuilder.group({
            username: ['', Validators.compose([
                Validators.required,
                WaveValidators.keyword([this.config.USER.GUEST.NAME]),
            ])],
            password: ['', Validators.required],
            staySignedIn: [true, Validators.required],
        });
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

        this.formStatusSubscription = this.formStatus$.subscribe(() => setTimeout(() => this.changeDetectorRef.markForCheck()));
    }

    ngAfterViewInit() {
        // do this once for observables
        setTimeout(() => this.loginForm.updateValueAndValidity());
    }

    ngOnDestroy() {
        if (this.formStatusSubscription) {
            this.formStatusSubscription.unsubscribe();
        }
    }

    login() {
        this.formStatus$.next(FormStatus.Loading);

        this.userService.gfbioLogin({
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
