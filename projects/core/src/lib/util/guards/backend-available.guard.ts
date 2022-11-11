import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree, Router} from '@angular/router';

import {Observable, map, catchError, of} from 'rxjs';
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
        const loggedInOrRedirect = this.backendService.getBackendInfo().pipe(
            map((backendInfo) => {
                console.log('BackendAvailableGuard: backend info = ' + backendInfo);
                return true;
            }),
            catchError((err, _caught) => {
                console.log('BackendAvailableGuard: error = ' + err);
                return of(this.router.createUrlTree(['/error', {error: 'Backend not available', error_details: err.message}]));
            }),
        );
        return loggedInOrRedirect;
    }
}
