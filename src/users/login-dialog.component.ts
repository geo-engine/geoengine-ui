import {Component, ChangeDetectionStrategy, OnInit, OnDestroy} from '@angular/core';
import {COMMON_DIRECTIVES, Validators, FormBuilder, ControlGroup, Control} from '@angular/common';

import {BehaviorSubject, Subscription, Observable} from 'rxjs/Rx';

import {MATERIAL_DIRECTIVES} from 'ng2-material';
import {MD_INPUT_DIRECTIVES} from '@angular2-material/input';
import {MD_PROGRESS_CIRCLE_DIRECTIVES} from '@angular2-material/progress-circle';

import Config from '../app/config.model';

import {DefaultBasicDialog} from '../dialogs/basic-dialog.component';

import {User} from './user.model';
import {UserService} from './user.service';

enum FormStatus { LoggedOut, LoggedIn, Loading }

@Component({
    selector: 'wave-login-dialog',
    template: `
    <form
        *ngIf="isLoggedOut$ | async"
        [ngFormModel]="form"
        layout="column"
    >
        <md-input type="text" placeholder="Username" ngControl="username"></md-input>
        <md-input type="password" placeholder="Password" ngControl="password"></md-input>
        <span *ngIf="invalidCredentials">Invalid Credentials</span>
    </form>
    <div *ngIf="isLoggedIn$ | async" class="logged-in" layout="column">
        <md-input
            type="text"
            placeholder="Username"
            [ngModel]="(user | async).name"
            [disabled]="true"
        ></md-input>
        <md-input
            type="text"
            placeholder="Real Name"
            [ngModel]="(user | async).realName"
            [disabled]="true"
        ></md-input>
        <md-input
            type="text"
            placeholder="E-Mail"
            [ngModel]="(user | async).email"
            [disabled]="true"
        ></md-input>
        <button md-raised-button (click)="logout()">Logout</button>
    </div>
    <div *ngIf="isLoading$ | async" class="loading">
        <md-progress-circle mode="indeterminate"></md-progress-circle>
    </div>
    `,
    styles: [`
    form {
        padding: 16px 0;
    }
    span {
        color: ${Config.COLORS.WARN};
    }
    .password {
        width: 90%;
    }
    div.logged-in {
        margin: 16px 0;
    }
    .logged-in button {
        width: 90%;
        margin-left: calc(10%/2);
    }
    div.loading {
        padding: 32px calc(50% - 100px/2);
    }
    md-progress-circle {
        width: 100px;
        height: 100px;
    }
    `],
    providers: [],
    directives: [
        COMMON_DIRECTIVES, MATERIAL_DIRECTIVES, MD_INPUT_DIRECTIVES, MD_PROGRESS_CIRCLE_DIRECTIVES,
    ],
    pipes: [],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class LoginDialogComponent extends DefaultBasicDialog implements OnInit, OnDestroy {
    formStatus$ = new BehaviorSubject<FormStatus>(FormStatus.Loading);
    isLoggedIn$ = this.formStatus$.map(status => status === FormStatus.LoggedIn);
    isLoggedOut$ = this.formStatus$.map(status => status === FormStatus.LoggedOut);
    isLoading$ = this.formStatus$.map(status => status === FormStatus.Loading);
    invalidCredentials = false;
    user: Observable<User>;

    form: ControlGroup;

    private subscriptions: Array<Subscription> = [];

    constructor(
        private userService: UserService,
        private formBuilder: FormBuilder
    ) {
        super();

        this.form = this.formBuilder.group({
            username: ['', Validators.compose([
                Validators.required,
                (control: Control) => {
                    // tslint:disable-next-line:no-null-keyword
                    return control.value === Config.USER.GUEST.NAME ? {'keyword': true} : null;
                },
            ])],
            password: ['', Validators.required],
        });

        this.userService.isSessionValid(this.userService.getSession()).then(valid => {
            // this.user = this.userService.getUser();
            // this.loggedIn = valid && !(this.user instanceof Guest);
            const isNoGuest = this.userService.getSession().user !== Config.USER.GUEST.NAME;
            this.formStatus$.next(valid && isNoGuest ? FormStatus.LoggedIn : FormStatus.LoggedOut);

            // if (!(this.user instanceof Guest)) {
            //     this.form.controls['username'].value = this.user.name;
            // }
            if (isNoGuest) {
                (this.form.controls['username'] as Control).updateValue(
                    this.userService.getSession().user
                );
            }
        });

        this.user = this.userService.getUserStream();
    }

    ngOnInit() {
        this.dialog.setTitle('User Info');

        this.subscriptions.push(
            this.formStatus$.subscribe(status => {
                switch (status) {
                    case FormStatus.LoggedIn:
                        this.removeLoginButtons();
                    break;
                    case FormStatus.LoggedOut:
                        this.createLoginButtons();
                    break;
                    case FormStatus.Loading:
                    /* falls through */
                    default:
                        this.removeLoginButtons();
                    break;
                }
            })
        );
    }

    ngOnDestroy() {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
    }

    login() {
        this.formStatus$.next(FormStatus.Loading);
        this.userService.login({
            user: this.form.controls['username'].value,
            password: this.form.controls['password'].value,
        }).then(valid => {
            if (valid) {
                this.invalidCredentials = false;
                this.formStatus$.next(FormStatus.LoggedIn);
            } else {
                this.invalidCredentials = true;
                (this.form.controls['password'] as Control).updateValue('');
                this.formStatus$.next(FormStatus.LoggedOut);
            }
        });
    }

    logout() {
        this.formStatus$.next(FormStatus.Loading);
        this.userService.guestLogin().then(success => {
            // TODO: what to do if this is not successful?
            (this.form.controls['password'] as Control).updateValue('');
            this.formStatus$.next(FormStatus.LoggedOut);
        });
    }

    private createLoginButtons() {
        const loginButtonDisabled$ = new BehaviorSubject(true);
        this.subscriptions.push(
            this.form.statusChanges.map(status => {
                return status === 'INVALID';
            }).subscribe(
                loginButtonDisabled$
            )
        );

        this.dialog.setButtons([
            {
                title: 'Login',
                action: () => this.login(),
                disabled: loginButtonDisabled$,
            },
            {
                title: 'Cancel',
                action: () => this.dialog.close(),
            },
        ]);
    }

    private removeLoginButtons() {
        this.dialog.setButtons([]);
    }

}
