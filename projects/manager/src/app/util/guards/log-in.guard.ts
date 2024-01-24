import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {Observable} from 'rxjs';
import {SessionService} from '../../session/session.service';

@Injectable({
    providedIn: 'root',
})
export class LogInGuard implements CanActivate {
    constructor(
        private router: Router,
        private sessionService: SessionService,
    ) {}

    canActivate(
        _route: ActivatedRouteSnapshot,
        _state: RouterStateSnapshot,
    ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        const isLoggedIn = this.sessionService.isLoggedIn();

        if (!isLoggedIn) {
            this.router.navigate(['/signin']);
            return false;
        }

        return true;
    }
}
