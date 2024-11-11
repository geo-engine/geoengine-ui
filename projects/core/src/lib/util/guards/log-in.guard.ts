import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router} from '@angular/router';
import {UserService} from '@geoengine/common';
import {Observable, map} from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class LogInGuard {
    constructor(
        private readonly userService: UserService,
        private router: Router,
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
