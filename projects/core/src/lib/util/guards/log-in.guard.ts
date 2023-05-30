import {Injectable} from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import {Observable, map} from 'rxjs';
import {UserService} from '../../users/user.service';

@Injectable({
    providedIn: 'root',
})
export class LogInGuard  {
    constructor(private readonly userService: UserService, private router: Router) {}

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
