import {APP_INITIALIZER, NgModule} from '@angular/core';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {BrowserModule} from '@angular/platform-browser';
import {HttpClientModule} from '@angular/common/http';
import {RouterModule} from '@angular/router';

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

import {AppConfig} from './app-config.service';
import {Nature40CatalogComponent} from './operators/dialogs/nature40-catalog/nature40-catalog.component';
import {Nature40UserService} from './users/nature40-user.service';
import {LoginComponent} from './users/login/login.component';

@NgModule({
    declarations: [
        AppComponent,
        LoginComponent,
        Nature40CatalogComponent,
    ],
    imports: [
        BrowserAnimationsModule,
        BrowserModule,
        HttpClientModule,
        RouterModule.forRoot([{path: '**', component: AppComponent}], {useHash: true}),
        WaveCoreModule,
    ],
    providers: [
        {
            provide: APP_INITIALIZER,
            useFactory: (config: AppConfig) => () => config.load(),
            deps: [Config],
            multi: true,
        },
        {provide: Config, useClass: AppConfig},
        {provide: UserService, useClass: Nature40UserService},
        LayerService,
        LayoutService,
        MappingQueryService,
        MapService,
        NotificationService,
        ProjectService,
        RandomColorService,
        SidenavRef,
        StorageService,
    ],
    bootstrap: [AppComponent],
})
export class AppModule {
}
