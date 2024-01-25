import {Component} from '@angular/core';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {Observable} from 'rxjs';
import {map, shareReplay} from 'rxjs/operators';
import {SessionService} from '../session/session.service';
import {Router} from '@angular/router';

@Component({
    selector: 'geoengine-manager-navigation',
    templateUrl: './navigation.component.html',
    styleUrls: ['./navigation.component.scss'],
})
export class NavigationComponent {
    isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
        map((result) => result.matches),
        shareReplay(),
    );

    constructor(
        private breakpointObserver: BreakpointObserver,
        private sessionService: SessionService,
        private router: Router,
    ) {}

    logout(): void {
        this.sessionService.logout();
        this.router.navigate(['/signin']);
    }
}
