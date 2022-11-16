import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree, Router} from '@angular/router';

import {Observable, map, skipWhile} from 'rxjs';
import {BackendService} from '../../backend/backend.service';

@Injectable({
    providedIn: 'root',
})
export class BackendAvailableGuard implements CanActivate {
    constructor(private readonly backendService: BackendService, private router: Router) {}

    canActivate(
        _route: ActivatedRouteSnapshot,
        _state: RouterStateSnapshot,
    ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        const loggedInOrRedirect = this.backendService.getBackendStatus().pipe(
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
