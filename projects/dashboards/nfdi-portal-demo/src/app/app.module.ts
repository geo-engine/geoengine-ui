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
    CoreModule,
    CoreConfig,
    RasterLegendComponent,
} from '@geoengine/core';
import {AppConfig} from './app-config.service';
import {PortalModule} from '@angular/cdk/portal';
import {LegendComponent} from './legend/legend.component';
import {AttributionsComponent} from './attributions/attributions.component';
import {SpeciesSelectorComponent} from './species-selector/species-selector.component';
import {DataSelectionService} from './data-selection.service';
import {MainComponent} from './main/main.component';
import {LoginComponent} from './login/login.component';
import {AppRoutingModule} from './app-routing.module';
import {NgxMatSelectSearchModule} from 'ngx-mat-select-search';
import {FormsModule} from '@angular/forms';
import {NotificationService, RandomColorService, UserService} from '@geoengine/common';
import {CommonConfig} from '@geoengine/common';

@NgModule({
    declarations: [AppComponent, AttributionsComponent, LegendComponent, SpeciesSelectorComponent, MainComponent, LoginComponent],
    bootstrap: [AppComponent],
    imports: [
        AppRoutingModule,
        BrowserAnimationsModule,
        BrowserModule,
        CoreModule,
        FormsModule,
        NgxMatSelectSearchModule,
        PortalModule,
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
        DataSelectionService,
        UserService,
        provideHttpClient(withInterceptorsFromDi()),
    ],
})
export class AppModule {}
