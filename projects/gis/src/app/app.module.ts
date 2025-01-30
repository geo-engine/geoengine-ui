import {NgModule, inject, provideAppInitializer} from '@angular/core';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {BrowserModule} from '@angular/platform-browser';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';

import {AppComponent} from './app.component';
import {
    LayoutService,
    MapService,
    ProjectService,
    SidenavRef,
    SpatialReferenceService,
    TabsService,
    CoreModule,
    CoreConfig,
} from '@geoengine/core';
import {AppConfig} from './app-config.service';
import {MainComponent} from './main/main.component';
import {AppRoutingModule} from './app-routing.module';
import {NotificationService, RandomColorService, UserService} from '@geoengine/common';
import {CommonConfig} from '@geoengine/common';

@NgModule({
    declarations: [AppComponent, MainComponent],
    bootstrap: [AppComponent],
    imports: [BrowserAnimationsModule, BrowserModule, AppRoutingModule, CoreModule],
    providers: [
        AppConfig,
        {
            provide: CoreConfig,
            useExisting: AppConfig,
        },
        {
            provide: CommonConfig,
            useExisting: AppConfig,
        },
        provideAppInitializer(() => {
            const initializerFn = (
                (config: AppConfig) => (): Promise<void> =>
                    config.load()
            )(inject(AppConfig));
            return initializerFn();
        }),
        LayoutService,
        MapService,
        NotificationService,
        ProjectService,
        RandomColorService,
        SidenavRef,
        SpatialReferenceService,
        UserService,
        TabsService,
        provideHttpClient(withInterceptorsFromDi()),
    ],
})
export class AppModule {}
