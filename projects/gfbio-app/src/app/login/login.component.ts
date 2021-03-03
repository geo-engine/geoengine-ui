import {BehaviorSubject, Observable, Subscription} from 'rxjs';

import {Component, OnInit, ChangeDetectionStrategy, AfterViewInit, Inject, ChangeDetectorRef, OnDestroy} from '@angular/core';
import {Location} from '@angular/common';

import {Config, NotificationService, User, UserService} from 'wave-core';

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

    user: Observable<User>;

    private formStatusSubscription: Subscription;

    constructor(
        @Inject(Config) private readonly config: AppConfig,
        @Inject(UserService) private readonly userService: GFBioUserService,
        private readonly changeDetectorRef: ChangeDetectorRef,
        private readonly location: Location,
        private readonly notificationService: NotificationService,
    ) {}

    ngOnInit() {
        this.userService.isSessionValid(this.userService.getSession()).subscribe((valid) => {
            const isNoGuest = !this.userService.isGuestUser();
            this.formStatus$.next(valid && isNoGuest ? FormStatus.LoggedIn : FormStatus.LoggedOut);
        });

        this.user = this.userService.getUserStream();

        this.formStatusSubscription = this.formStatus$.subscribe(() => setTimeout(() => this.changeDetectorRef.markForCheck()));
    }

    ngAfterViewInit() {}

    ngOnDestroy() {
        if (this.formStatusSubscription) {
            this.formStatusSubscription.unsubscribe();
        }
    }

    login() {
        this.formStatus$.next(FormStatus.Loading);

        this.userService.redirectToOidcProvider();
    }

    logout() {
        this.formStatus$.next(FormStatus.Loading);
        this.userService.guestLogin().subscribe(
            () => this.formStatus$.next(FormStatus.LoggedOut),
            (error) => this.notificationService.error(`The backend is currently unavailable (${error})`),
        );
    }
}
