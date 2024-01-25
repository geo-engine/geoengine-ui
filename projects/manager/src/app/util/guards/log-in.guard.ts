import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {Observable, map} from 'rxjs';
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
        const loggedInOrRedirect = this.sessionService.isLoggedIn().pipe(
            map((loggedIn) => {
                if (loggedIn) {
                    return true;
                }
                return this.router.createUrlTree(['/signin']);
            }),
        );
        return loggedInOrRedirect;
    }
}
