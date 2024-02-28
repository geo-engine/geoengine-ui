import {Component, Inject} from '@angular/core';
import {Router} from '@angular/router';
import {AppConfig} from '../app-config.service';
import {UserService} from '@geoengine/common';

@Component({
    selector: 'geoengine-manager-login',
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss',
})
export class LoginComponent {
    email = '';
    password = '';

    constructor(
        private router: Router,
        private userService: UserService,
        @Inject(AppConfig) readonly config: AppConfig,
    ) {}

    login(): void {
        this.userService
            .login({email: this.email, password: this.password})
            .then((_session) => this.router.navigate(['navigation']))
            .catch((error) => console.error(error));
    }
}
