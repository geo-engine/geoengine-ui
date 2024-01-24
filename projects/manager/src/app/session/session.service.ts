import {Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class SessionService {
    private loggedIn = false;

    constructor() {}

    isLoggedIn(): boolean {
        return this.loggedIn;
    }

    login(): void {
        this.loggedIn = true;
    }
}
