import {Component, ChangeDetectionStrategy, OnInit} from '@angular/core';
import {COMMON_DIRECTIVES, Validators, FormBuilder, ControlGroup} from '@angular/common';

import {MATERIAL_DIRECTIVES} from 'ng2-material';
import {MD_INPUT_DIRECTIVES} from '@angular2-material/input';

import Config from '../app/config.model';

import {DefaultBasicDialog} from '../dialogs/basic-dialog.component';

import {User, Guest} from './user.model';
import {UserService} from './user.service';

@Component({
    selector: 'wave-plot-detail-dialog',
    template: `
    <form *ngIf="!loggedIn" [ngFormModel]="loginForm" layout="column">
        <md-input type="text" placeholder="Username" ngControl="username"></md-input>
        <div ngControlGroup="password" class="password" layout="column">
            <md-input
                type="password"
                placeholder="Password"
                ngControl="value"
            ></md-input>
            <md-input
                type="password"
                placeholder="Confirmation"
                ngControl="confirmation"
            >
                <md-hint align="end" style="color: #f44336"
                    *ngIf="!passwordConfirmed()"
                >Passwords differ</md-hint>
            </md-input>
        </div>
        <button md-button
            class="md-primary"
            [disabled]="!validForLogin()"
            (click)="login()"
        >Login</button>
    <template [ngIf]="loggedIn">
    </template>
    `,
    styles: [`
    form {
        display: block;
        padding-top: 8px;
    }
    .password {
        width: 90%;
    }
    `],
    providers: [],
    directives: [
        COMMON_DIRECTIVES, MATERIAL_DIRECTIVES, MD_INPUT_DIRECTIVES,
    ],
    pipes: [],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class LoginDialogComponent extends DefaultBasicDialog implements OnInit {
    loggedIn: boolean;
    user: User;

    loginForm: ControlGroup;

    constructor(
        private userService: UserService,
        private formBuilder: FormBuilder
    ) {
        super();
        this.userService.isSessionValid(this.userService.getSession()).then(valid => {
            this.user = this.userService.getUser();
            this.loggedIn = valid && !(this.user instanceof Guest);

            if (!(this.user instanceof Guest)) {
                this.loginForm.controls['username'].value = this.user.name;
            }
        });

        this.loginForm = this.formBuilder.group({
            username: ['', Validators.required],
            password: this.formBuilder.group({
                value: ['', Validators.required],
                confirmation: ['', Validators.required],
            }),
        });
    }

    ngOnInit() {
        this.dialog.setTitle('Login');
    }

    login() {
        this.userService.login({
            user: this.loginForm.controls['username'].value,
            password: this.loginForm.controls['password']['value'].value,
        }).then(valid =>
            console.log('login valid', valid)
        );
    }

    passwordConfirmed(): boolean {
        const value = this.loginForm.controls['password'].value['value'];
        const confirmation = this.loginForm.controls['password'].value['confirmation'];
        return value === confirmation;
    }

    validForLogin(): boolean {
        const username = this.loginForm.controls['username'].value;
        const password = this.loginForm.controls['password'].value['value'];
        return username.length > 0 && username !== Config.USER.GUEST.NAME
                && password.length > 0 && this.passwordConfirmed();
    }

}
