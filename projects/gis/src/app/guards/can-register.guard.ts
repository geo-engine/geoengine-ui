import {Inject, Injectable} from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import {Observable} from 'rxjs';
import {AppConfig} from '../app-config.service';
import {Config} from '@geoengine/core';

@Injectable({
    providedIn: 'root',
})
export class CanRegisterGuard  {
    constructor(@Inject(Config) private readonly config: AppConfig) {}

    canActivate(
        _route: ActivatedRouteSnapshot,
        _state: RouterStateSnapshot,
    ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        return this.config.COMPONENTS.REGISTRATION.AVAILABLE;
    }
}
