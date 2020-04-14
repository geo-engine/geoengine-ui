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
    OperatorTypeFactory,
    WaveCoreModule,
} from 'wave-core';
import {AppConfig} from './app-config.service';
import {SpectralOverviewPlotType, SpectralOverviewPlotTypeDict} from './operators/types/spectral-overview-plot-type.model';
import {DttLayoutService} from './layout.service';
import {SpectralOverviewPlotComponent} from './operators/dialogs/spectral-overview-plot/spectral-overview-plot.component';
import {MatSidenavModule} from '@angular/material/sidenav';
import { TimestampSliderComponent } from './timestamp-slider/timestamp-slider.component';
import { UseCaseListComponent } from './use-case/use-case-list/use-case-list.component';
import { UseCaseDetailsComponent } from './use-case/use-case-details/use-case-details.component';
import { UseCaseResetDialogComponent } from './use-case/use-case-reset-dialog/use-case-reset-dialog.component';

@NgModule({
    declarations: [
        AppComponent,
        SpectralOverviewPlotComponent,
        TimestampSliderComponent,
        UseCaseListComponent,
        UseCaseDetailsComponent,
        UseCaseResetDialogComponent
    ],
    imports: [
        BrowserAnimationsModule,
        BrowserModule,
        HttpClientModule,
        RouterModule.forRoot([{path: '**', component: AppComponent}], {useHash: true}),
        MatSidenavModule,
        WaveCoreModule,
    ],
    providers: [
        {provide: Config, useClass: AppConfig},
        {
            provide: APP_INITIALIZER,
            useFactory: (config: AppConfig) => () => config.load(),
            deps: [Config],
            multi: true,
        },
        {
            provide: APP_INITIALIZER,
            useFactory: () => () => setupOperatorTypes(),
            deps: [],
            multi: true,
        },
        {
            provide: LayoutService, useClass: DttLayoutService
        },
        LayerService,
        MappingQueryService,
        MapService,
        NotificationService,
        ProjectService,
        RandomColorService,
        SidenavRef,
        StorageService,
        UserService,
    ],
    bootstrap: [AppComponent],
})
export class AppModule {
}

function setupOperatorTypes(): Promise<void> {
    return new Promise((resolve, _reject) => {
        OperatorTypeFactory.addType(
            SpectralOverviewPlotType.TYPE,
            dict => SpectralOverviewPlotType.fromDict(dict as SpectralOverviewPlotTypeDict),
        );
        resolve();
    });
}
