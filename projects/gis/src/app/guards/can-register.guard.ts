import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree} from '@angular/router';
import {Observable} from 'rxjs';
import {AppConfig} from '../app-config.service';

@Injectable({
    providedIn: 'root',
})
export class CanRegisterGuard {
    constructor(private readonly config: AppConfig) {}

    canActivate(
        _route: ActivatedRouteSnapshot,
        _state: RouterStateSnapshot,
    ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        return this.config.COMPONENTS.REGISTRATION.AVAILABLE;
    }
}
