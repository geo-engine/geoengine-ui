import {Component, inject} from '@angular/core';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {Observable} from 'rxjs';
import {map, shareReplay} from 'rxjs/operators';
import {Router} from '@angular/router';
import {AppConfig} from '../app-config.service';
import {UserService} from '@geoengine/common';
import {MatSidenavContainer, MatSidenav, MatSidenavContent} from '@angular/material/sidenav';
import {MatToolbar} from '@angular/material/toolbar';
import {MatNavList, MatListItem} from '@angular/material/list';
import {DatasetsComponent} from '../datasets/datasets.component';
import {LayersComponent} from '../layers/layers.component';
import {AsyncPipe} from '@angular/common';

export enum NavigationType {
    Datasets = 'datasets',
    Layers = 'layers',
}

@Component({
    selector: 'geoengine-manager-navigation',
    templateUrl: './navigation.component.html',
    styleUrls: ['./navigation.component.scss'],
    imports: [
        MatSidenavContainer,
        MatSidenav,
        MatToolbar,
        MatNavList,
        MatListItem,
        MatSidenavContent,
        DatasetsComponent,
        LayersComponent,
        AsyncPipe,
    ],
})
export class NavigationComponent {
    private breakpointObserver = inject(BreakpointObserver);
    private userService = inject(UserService);
    private router = inject(Router);
    readonly config = inject<AppConfig>(AppConfig);

    isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
        map((result) => result.matches),
        shareReplay(),
    );

    NavigationType = NavigationType;

    selectedType: NavigationType = NavigationType.Datasets;

    logout(): void {
        this.userService.logout();
        this.router.navigate(['/signin']);
    }

    toggleSelection(selection: NavigationType): void {
        this.selectedType = selection;
    }
}
