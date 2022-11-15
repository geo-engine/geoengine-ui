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
        const loggedInOrRedirect = this.backendService.getBackendAvailable().pipe(
            map(() => true),
            catchError((_err, _caught) => of(this.router.createUrlTree(['/backend-status']))),
        );
        return loggedInOrRedirect;
    }
}
