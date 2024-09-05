import {APP_INITIALIZER, NgModule} from '@angular/core';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {BrowserModule} from '@angular/platform-browser';
import {HttpClientModule} from '@angular/common/http';
import {RouterModule} from '@angular/router';
import {AppComponent} from './app.component';
import {
    DatasetService,
    LayoutService,
    MapService,
    NotificationService,
    ProjectService,
    RandomColorService,
    SidenavRef,
    SpatialReferenceService,
    UserService,
    CoreModule,
    CoreConfig,
} from '@geoengine/core';
import {AppConfig} from './app-config.service';
import {PortalModule} from '@angular/cdk/portal';
import {LegendComponent} from './legend/legend.component';
import {AnalysisComponent} from './analysis/analysis.component';
import {AboutComponent} from './about/about.component';
import {AppDatasetService} from './app-dataset.service';
import {LoginComponent} from './login/login.component';
import {MainComponent} from './main/main.component';
import {AppRoutingModule} from './app-routing.module';
import {NgxMatSelectSearchModule} from 'ngx-mat-select-search';
import {AccordionEntryComponent} from './accordion-entry/accordion-entry.component';
import {AccordionVectorEntryComponent} from './accordion-vector-entry/accordion-vector-entry.component';
import {DataPointComponent} from './data-point/data-point.component';
import {CommonConfig} from '@geoengine/common';

@NgModule({
    declarations: [
        AboutComponent,
        AccordionEntryComponent,
        AccordionVectorEntryComponent,
        AnalysisComponent,
        AppComponent,
        DataPointComponent,
        LegendComponent,
        LoginComponent,
        MainComponent,
    ],
    imports: [
        BrowserAnimationsModule,
        BrowserModule,
        HttpClientModule,
        RouterModule.forRoot([{path: '**', component: AppComponent}], {useHash: true}),
        CoreModule,
        PortalModule,
        AppRoutingModule,
        NgxMatSelectSearchModule,
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
        {provide: DatasetService, useClass: AppDatasetService},
        LayoutService,
        MapService,
        NotificationService,
        ProjectService,
        RandomColorService,
        SidenavRef,
        SpatialReferenceService,
        UserService,
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
