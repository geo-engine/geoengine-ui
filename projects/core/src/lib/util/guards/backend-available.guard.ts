import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router} from '@angular/router';
import {UserService} from '../../users/user.service';

import {Observable, map, skipWhile} from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class BackendAvailableGuard {
    constructor(
        private readonly userService: UserService,
        private router: Router,
    ) {}

    canActivate(
        _route: ActivatedRouteSnapshot,
        _state: RouterStateSnapshot,
    ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        const loggedInOrRedirect = this.userService.getBackendStatus().pipe(
            skipWhile((status) => status.initial === true),
            map((status) => {
                if (status.available) {
                    return true;
                } else {
                    return this.router.parseUrl('/backend-status');
                }
            }),
        );
        return loggedInOrRedirect;
    }
}
