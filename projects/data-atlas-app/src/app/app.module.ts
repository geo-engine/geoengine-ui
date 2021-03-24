import {APP_INITIALIZER, NgModule} from '@angular/core';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {BrowserModule} from '@angular/platform-browser';
import {HttpClientModule} from '@angular/common/http';
import {RouterModule} from '@angular/router';
import {AppComponent} from './app.component';
import {
    Config,
    LayoutService,
    MapService,
    NotificationService,
    ProjectService,
    RandomColorService,
    SidenavRef,
    UserService,
    WaveCoreModule,
} from 'wave-core';
import {AppConfig} from './app-config.service';
import {SelectLayersComponent} from './select-layers/select-layers.component';
import {PortalModule} from '@angular/cdk/portal';
import {LegendComponent} from './legend/legend.component';
import {AnalysisComponent} from './analysis/analysis.component';
import {TimeStepSelectorComponent} from './time-step-selector/time-step-selector.component';
import {AboutComponent} from './about/about.component';

@NgModule({
    declarations: [AppComponent, SelectLayersComponent, LegendComponent, AnalysisComponent, TimeStepSelectorComponent, AboutComponent],
    imports: [
        BrowserAnimationsModule,
        BrowserModule,
        HttpClientModule,
        RouterModule.forRoot([{path: '**', component: AppComponent}], {useHash: true}),
        WaveCoreModule,
        PortalModule,
    ],
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
        UserService,
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
