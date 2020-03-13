import {BrowserModule} from '@angular/platform-browser';
import {APP_INITIALIZER, NgModule} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {
    Config,
    LayerService,
    LayoutService,
    MappingQueryService,
    MapService,
    NotificationService,
    ProjectService,
    RandomColorService,
    StorageService,
    SidenavRef,
    UserService,
    WaveCoreModule,
} from 'wave-core';
import {HttpClientModule} from '@angular/common/http';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        AppRoutingModule,
        BrowserAnimationsModule,
        BrowserModule,
        HttpClientModule,
        WaveCoreModule,
    ],
    providers: [
        {
            provide: APP_INITIALIZER,
            useFactory: (config: Config) => () => config.load(),
            deps: [Config],
            multi: true,
        },
        Config,
        LayerService,
        LayoutService,
        MappingQueryService,
        MapService,
        NotificationService,
        ProjectService,
        RandomColorService,
        SidenavRef,
        StorageService,
        UserService,
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
