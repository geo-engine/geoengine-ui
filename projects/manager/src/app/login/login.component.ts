import {Component, Inject} from '@angular/core';
import {Router} from '@angular/router';
import {SessionService} from '../session/session.service';
import {AppConfig} from '../app-config.service';

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
        private sessionService: SessionService,
        @Inject(AppConfig) readonly config: AppConfig,
    ) {}

    login(): void {
        this.sessionService.login({email: this.email, password: this.password}).subscribe({
            next: (_session) => this.router.navigate(['navigation']),
            error: (error) => console.error(error),
        });
    }
}
