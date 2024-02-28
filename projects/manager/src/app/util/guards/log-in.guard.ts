import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {UserService} from '@geoengine/common';
import {Observable, map} from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class LogInGuard implements CanActivate {
    constructor(
        private router: Router,
        private userService: UserService,
    ) {}

    canActivate(
        _route: ActivatedRouteSnapshot,
        _state: RouterStateSnapshot,
    ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        const loggedInOrRedirect = this.userService.isLoggedIn().pipe(
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
