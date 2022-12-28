import {APP_INITIALIZER, NgModule} from '@angular/core';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {BrowserModule} from '@angular/platform-browser';
import {HttpClientModule} from '@angular/common/http';
import {MatLegacyTableModule as MatTableModule} from '@angular/material/legacy-table';
import {MatLegacyButtonModule as MatButtonModule} from '@angular/material/legacy-button';
import {RouterModule} from '@angular/router';

import {AppComponent} from './app.component';
import {
    Config,
    DatasetService,
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
import {HelpComponent} from './help/help.component';
import {SplashDialogComponent} from './splash-dialog/splash-dialog.component';
import {BasketDialogComponent} from './basket/basket-dialog/basket-dialog.component';
import {BasketService} from './basket/basket.service';

@NgModule({
    declarations: [AppComponent, HelpComponent, SplashDialogComponent, BasketDialogComponent],
    imports: [
        BrowserAnimationsModule,
        BrowserModule,
        HttpClientModule,
        MatTableModule,
        MatButtonModule,
        RouterModule.forRoot([{path: '**', component: AppComponent}], {useHash: true}),
        CoreModule,
    ],
    providers: [
        {provide: Config, useClass: AppConfig},
        {
            provide: APP_INITIALIZER,
            useFactory: (config: AppConfig) => (): Promise<void> => config.load(),
            deps: [Config],
            multi: true,
        },
        BasketService,
        DatasetService,
        LayoutService,
        MapService,
        NotificationService,
        ProjectService,
        RandomColorService,
        SidenavRef,
        SpatialReferenceService,
        UserService,
        TabsService,
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
