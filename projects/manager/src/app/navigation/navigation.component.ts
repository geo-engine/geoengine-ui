import {Component, Inject} from '@angular/core';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {Observable} from 'rxjs';
import {map, shareReplay} from 'rxjs/operators';
import {SessionService} from '../../../../common/src/lib/session/session.service';
import {Router} from '@angular/router';
import {AppConfig} from '../app-config.service';

export enum NavigationType {
    Datasets = 'datasets',
    Layers = 'layers',
}

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

    NavigationType = NavigationType;

    selectedType: NavigationType = NavigationType.Datasets;

    constructor(
        private breakpointObserver: BreakpointObserver,
        private sessionService: SessionService,
        private router: Router,
        @Inject(AppConfig) readonly config: AppConfig,
    ) {}

    logout(): void {
        this.sessionService.logout();
        this.router.navigate(['/signin']);
    }

    toggleSelection(selection: NavigationType): void {
        this.selectedType = selection;
    }
}
