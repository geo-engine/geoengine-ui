import {APP_INITIALIZER, NgModule} from '@angular/core';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {BrowserModule} from '@angular/platform-browser';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {RouterModule} from '@angular/router';
import {AppComponent} from './app.component';
import {
    LayoutService,
    MapService,
    ProjectService,
    SidenavRef,
    SpatialReferenceService,
    CoreModule,
    CoreConfig,
    RasterLegendComponent,
} from '@geoengine/core';
import {AppConfig} from './app-config.service';
import {PortalModule} from '@angular/cdk/portal';
import {LegendComponent} from './legend/legend.component';
import {AttributionsComponent} from './attributions/attributions.component';
import {CountrySelectorComponent} from './country-selector/country-selector.component';
import {EbvSelectorComponent} from './ebv-selector/ebv-selector.component';
import {DataSelectionService} from './data-selection.service';
import {NgxMatSelectSearchModule} from 'ngx-mat-select-search';
import {LayoutModule} from '@angular/cdk/layout';
import {NotificationService, RandomColorService, UserService} from '@geoengine/common';
import {CommonConfig} from '@geoengine/common';

@NgModule({
    declarations: [AppComponent, AttributionsComponent, LegendComponent, CountrySelectorComponent, EbvSelectorComponent],
    bootstrap: [AppComponent],
    imports: [
        BrowserAnimationsModule,
        BrowserModule,
        RouterModule.forRoot([{path: '**', component: AppComponent}], {useHash: true}),
        CoreModule,
        PortalModule,
        NgxMatSelectSearchModule,
        LayoutModule,
        RasterLegendComponent,
    ],
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
        {
            provide: APP_INITIALIZER,
            useFactory: (config: AppConfig) => (): Promise<void> => config.load(),
            deps: [AppConfig],
            multi: true,
        },
        LayoutService,
        MapService,
        NotificationService,
        ProjectService,
        RandomColorService,
        SidenavRef,
        SpatialReferenceService,
        DataSelectionService,
        UserService,
        provideHttpClient(withInterceptorsFromDi()),
    ],
})
export class AppModule {}
