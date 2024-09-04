import {Routes} from '@angular/router';
import {AppComponent} from './app.component';
import {CommonConfig, UserService} from '@geoengine/common';
import {
    BackendService,
    CoreConfig,
    LayoutService,
    MapService,
    NotificationService,
    ProjectService,
    RandomColorService,
    SidenavRef,
    SpatialReferenceService,
} from '@geoengine/core';
import {APP_INITIALIZER} from '@angular/core';
import {DataSelectionService} from 'projects/dashboards/data-atlas/src/app/data-selection.service';
import {DashboardComponent} from './dashboard/dashboard.component';

export const routes: Routes = [
    {
        path: '',
        component: AppComponent,
        providers: [
            // {provide: CommonConfig, useExisting: CoreConfig},
            // CoreConfig,
            // {
            //     provide: APP_INITIALIZER,
            //     useFactory: (config: CoreConfig) => (): Promise<void> => config.load(),
            //     deps: [CommonConfig, CoreConfig],
            //     multi: true,
            // },
            // BackendService,
            // LayoutService,
            // MapService,
            // NotificationService,
            // ProjectService,
            // RandomColorService,
            // SidenavRef,
            // SpatialReferenceService,
            // DataSelectionService,
            // UserService,
        ], // Provide the service here
    },
];
