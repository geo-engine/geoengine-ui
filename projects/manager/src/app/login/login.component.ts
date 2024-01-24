import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {SessionService} from '../session/session.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss',
})
export class LoginComponent {
    constructor(
        private router: Router,
        private sessionService: SessionService,
    ) {}

    login() {
        this.sessionService.login();
        this.router.navigate(['navigation']);
    }
}
