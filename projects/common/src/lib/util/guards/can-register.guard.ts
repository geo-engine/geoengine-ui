import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree} from '@angular/router';
import {Observable} from 'rxjs';
import {CommonConfig} from '../../config.service';

@Injectable({
    providedIn: 'root',
})
export class CanRegisterGuard {
    constructor(private readonly config: CommonConfig) {}

    canActivate(
        _route: ActivatedRouteSnapshot,
        _state: RouterStateSnapshot,
    ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        return this.config.USER.REGISTRATION_AVAILABLE;
    }
}
