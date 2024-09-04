import {APP_INITIALIZER, ApplicationConfig, importProvidersFrom} from '@angular/core';
import {provideRouter} from '@angular/router';
import {provideAnimations} from '@angular/platform-browser/animations';

import {routes} from './app.routes';
import {CommonConfig} from '@geoengine/common';
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
    UserService,
} from '@geoengine/core';
import {DataSelectionService} from 'projects/dashboards/data-atlas/src/app/data-selection.service';
import {provideHttpClient} from '@angular/common/http';

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        provideAnimations(),
        // provideHttpClient(),
        // {
        //     provide: APP_INITIALIZER,
        //     useFactory: (config: CoreConfig) => (): Promise<void> => config.load(),
        //     deps: [CoreConfig],
        //     multi: true,
        // },
        // {provide: CommonConfig, useExisting: CoreConfig},
        // CoreConfig,
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
    ],
};
