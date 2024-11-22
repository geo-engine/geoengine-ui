import {APP_INITIALIZER, ApplicationConfig} from '@angular/core';
import {provideRouter, withHashLocation} from '@angular/router';
import {provideAnimations} from '@angular/platform-browser/animations';

import {routes} from './app.routes';
import {RandomColorService} from '@geoengine/common';
import {
    BackendService,
    CoreConfig,
    LayoutService,
    MapService,
    NotificationService,
    ProjectService,
    SidenavRef,
    SpatialReferenceService,
    UserService,
} from '@geoengine/core';
import {DataSelectionService} from 'projects/dashboards/data-atlas/src/app/data-selection.service';
import {provideHttpClient} from '@angular/common/http';

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes, withHashLocation()),
        provideAnimations(),
        provideHttpClient(),
        {
            provide: APP_INITIALIZER,
            useFactory: (config: CoreConfig) => (): Promise<void> => config.load(),
            deps: [CoreConfig],
            multi: true,
        },
        CoreConfig,
        BackendService,
        LayoutService,
        MapService,
        NotificationService,
        ProjectService,
        RandomColorService,
        SidenavRef,
        SpatialReferenceService,
        DataSelectionService,
        UserService,
    ],
};
