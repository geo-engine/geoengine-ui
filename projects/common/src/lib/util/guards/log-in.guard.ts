import {Injectable, inject} from '@angular/core';
import {ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router} from '@angular/router';
import {Observable, map} from 'rxjs';
import {UserService} from '../../user/user.service';

@Injectable({
    providedIn: 'root',
})
export class LogInGuard {
    private readonly userService = inject(UserService);
    private router = inject(Router);

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
