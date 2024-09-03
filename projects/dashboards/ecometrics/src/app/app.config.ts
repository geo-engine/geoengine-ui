import {APP_INITIALIZER, ApplicationConfig, importProvidersFrom} from '@angular/core';
import {provideRouter} from '@angular/router';
import {provideAnimations} from '@angular/platform-browser/animations';

import {routes} from './app.routes';
import {CommonConfig, UserService} from '@geoengine/common';
import {Config} from '@geoengine/core';

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        provideAnimations(),
        CommonConfig,
        Config,
        {
            provide: APP_INITIALIZER,
            useFactory: (config: Config, commonConfig: CommonConfig) => async (): Promise<void> => {
                await config.load();
                await commonConfig.load();
            },
            deps: [Config, CommonConfig],
            multi: true,
        },
    ],
};
