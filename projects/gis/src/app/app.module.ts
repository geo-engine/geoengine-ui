import {APP_INITIALIZER, NgModule} from '@angular/core';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {BrowserModule} from '@angular/platform-browser';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';

import {AppComponent} from './app.component';
import {
    Config,
    LayoutService,
    MapService,
    NotificationService,
    ProjectService,
    RandomColorService,
    SidenavRef,
    SpatialReferenceService,
    TabsService,
    UserService,
    CoreModule,
} from '@geoengine/core';
import {AppConfig} from './app-config.service';
import {LoginComponent} from './login/login.component';
import {MainComponent} from './main/main.component';
import {AppRoutingModule} from './app-routing.module';
import {RegisterComponent} from './register/register.component';

@NgModule({
    declarations: [AppComponent, LoginComponent, MainComponent, RegisterComponent],
    bootstrap: [AppComponent],
    imports: [BrowserAnimationsModule, BrowserModule, AppRoutingModule, CoreModule],
    providers: [
        {provide: Config, useClass: AppConfig},
        {
            provide: APP_INITIALIZER,
            useFactory: (config: AppConfig) => (): Promise<void> => config.load(),
            deps: [Config],
            multi: true,
        },
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
