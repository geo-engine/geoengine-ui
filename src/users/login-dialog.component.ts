import {Component, ChangeDetectionStrategy, OnInit, OnDestroy} from '@angular/core';
import {FormBuilder, FormGroup, FormControl, Validators} from "@angular/forms";
import {BehaviorSubject, Subscription, Observable} from 'rxjs/Rx';
import {MdDialogRef} from '@angular/material';

import Config from '../app/config.model';

import {User} from './user.model';
import {UserService} from './user.service';

enum FormStatus { LoggedOut, LoggedIn, Loading }

// TODO: switch from radio to button-toggle in newer version of materials

@Component({
    selector: 'wave-login-dialog',
    template: `
      <h1 md-dialog-title md-primary>{{dialogTitle}}</h1>
      <div md-dialog-content class="user-form">
        <form *ngIf="isLoggedOut$ | async" [formGroup]="form" class="flex-column">
            <md-radio-group formControlName="loginAuthority" *ngIf="config.PROJECT === 'GFBio'" style="margin-bottom: 1rem;">
                <md-radio-button value="system">System</md-radio-button>
                <md-radio-button value="GFBio">GFBio</md-radio-button>
            </md-radio-group>
            <md-input-container>
              <input mdInput type="text" placeholder="Username" formControlName="username">
            </md-input-container>
            <md-input-container>
              <input mdInput type="password" placeholder="Password" formControlName="password">
            </md-input-container>
            <span *ngIf="invalidCredentials">Invalid Credentials</span>
            <md-checkbox ngControl="staySignedIn">Stay signed in</md-checkbox>
        </form>
        <div *ngIf="isLoggedIn$ | async" class="logged-in flex-column">
          <md-input-container>
            <input md-input
                type="text"
                placeholder="Username"
                [ngModel]="(user | async).name"
                [disabled]="true"
            >
          </md-input-container>
          <md-input-container>
            <input md-input
                type="text"
                placeholder="Real Name"
                [ngModel]="(user | async).realName"
                [disabled]="true"
            >
          </md-input-container>
          <md-input-container>
            <input md-input
                type="text"
                placeholder="E-Mail"
                [ngModel]="(user | async).email"
                [disabled]="true"
            >
          </md-input-container>
        </div>
        <div *ngIf="isLoading$ | async" class="loading">
          <md-progress-circle mode="indeterminate"></md-progress-circle>
        </div>
      </div>
      <div md-dialog-actions>
          <button *ngIf="isLoggedOut$ | async" md-raised-button md-dialog-close (click)="login()">Login</button>
          <button *ngIf="isLoggedIn$ | async" md-raised-button md-dialog-close (click)="logout()">Logout</button>
          <button md-raised-button md-dialog-close>Cancel</button>
      </div>
    `,
    styles: [`
    h1 {
      font-family: Roboto, "Helvetica Neue", sans-serif;
    }    
    form {
        padding: 16px 0;
    }
    span {
        color: red;
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
    .flex-column {
      display: flex;
      flex-direction: column;
    }
    .user-form {
      display:flex;
      flex-direction: column;
      font-family: Roboto, "Helvetica Neue", sans-serif;
    }
    
    md-progress-circle {
        width: 100px;
        height: 100px;
    }
    `],
    providers: [],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class LoginDialogComponent implements OnInit, OnDestroy {
    formStatus$ = new BehaviorSubject<FormStatus>(FormStatus.Loading);
    isLoggedIn$ = this.formStatus$.map(status => status === FormStatus.LoggedIn);
    isLoggedOut$ = this.formStatus$.map(status => status === FormStatus.LoggedOut);
    isLoading$ = this.formStatus$.map(status => status === FormStatus.Loading);
    invalidCredentials = false;
    user: Observable<User>;

    config = Config;
    form: FormGroup;

    private subscriptions: Array<Subscription> = [];
    private dialogTitle: string;

    constructor(
        public dialogRef: MdDialogRef<LoginDialogComponent>,
        private userService: UserService,
        private formBuilder: FormBuilder
    ) {

        this.form = this.formBuilder.group({
            loginAuthority: ['system', Validators.required],
            username: ['', Validators.compose([
                Validators.required,
                (control: FormControl) => {
                    // tslint:disable-next-line:no-null-keyword
                    return control.value === Config.USER.GUEST.NAME ? {'keyword': true} : null;
                },
            ])],
            password: ['', Validators.required],
            staySignedIn: [true, Validators.required],
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
                (this.form.controls['username'] as FormControl).setValue(
                    this.userService.getSession().user
                );
            }
        });

        this.user = this.userService.getUserStream();
    }

    ngOnInit() {
        this.subscriptions.push(
            this.formStatus$.subscribe(status => {
                switch (status) {
                    case FormStatus.LoggedIn:
                        this.dialogTitle = 'User Info';
                        //this.removeLoginButtons();
                    break;
                    case FormStatus.LoggedOut:
                        this.dialogTitle = 'Login';
                        this.createLoginButtons();
                    break;
                    case FormStatus.Loading:
                    /* falls through */
                    default:
                        //this.removeLoginButtons();
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

        let loginRequest: Promise<boolean>;

        switch (this.form.controls['loginAuthority'].value) {
            case 'GFBio':
                loginRequest = this.userService.gfbioLogin({
                    user: this.form.controls['username'].value,
                    password: this.form.controls['password'].value,
                });

                break;
            case 'system':
            /* falls through */
            default:
                loginRequest = this.userService.login({
                    user: this.form.controls['username'].value,
                    password: this.form.controls['password'].value,
                    staySignedIn: this.form.controls['staySignedIn'].value.checked,
                });
                break;
        }

        loginRequest.then(valid => {
            if (valid) {
                this.invalidCredentials = false;
                this.formStatus$.next(FormStatus.LoggedIn);
            } else {
                this.invalidCredentials = true;
                (this.form.controls['password'] as FormControl).setValue('');
                this.formStatus$.next(FormStatus.LoggedOut);
            }
        });
    }

    logout() {
        this.formStatus$.next(FormStatus.Loading);
        this.userService.guestLogin().then(success => {
            // TODO: what to do if this is not successful?
            (this.form.controls['password'] as FormControl).setValue('');
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
/*
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
*/
    }

}
