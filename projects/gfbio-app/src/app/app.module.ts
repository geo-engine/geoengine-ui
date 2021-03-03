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
    OperatorTypeFactory,
} from 'wave-core';
import {AppConfig} from './app-config.service';
import {LoginComponent} from './login/login.component';
import {GFBioUserService} from './users/user.service';
import {TerminologyLookupType, TerminologyLookupTypeDict} from './operators/types/terminology-lookup-type';
import {PangaeaSourceType, PangaeaSourceTypeDict} from './operators/types/pangaea-source-type.model';
import {ABCDSourceType, ABCDSourceTypeDict} from './operators/types/abcd-source-type.model';
import {AbcdRepositoryComponent} from './operators/dialogs/abcd-repository/abcd-repository.component';
import {BasketResultGroupByDatasetPipe} from './operators/dialogs/baskets/gfbio-basket.pipe';
import {GfbioBasketsComponent} from './operators/dialogs/baskets/gfbio-baskets.component';
import {GroupedAbcdBasketResultComponent} from './operators/dialogs/baskets/grouped-abcd-basket-result/grouped-abcd-basket-result.component';
import {PangaeaBasketResultComponent} from './operators/dialogs/baskets/pangaea-basket-result/pangaea-basket-result.component';
import {TerminologyLookupOperatorComponent} from './operators/dialogs/terminology-lookup/terminology-lookup.component';
import {GFBioMappingQueryService} from './queries/mapping-query.service';
import {SplashDialogComponent} from './dialogs/splash-dialog/splash-dialog.component';
import {HelpComponent} from './help/help.component';

@NgModule({
    declarations: [
        AppComponent,
        AbcdRepositoryComponent,
        BasketResultGroupByDatasetPipe,
        GfbioBasketsComponent,
        GroupedAbcdBasketResultComponent,
        LoginComponent,
        PangaeaBasketResultComponent,
        SplashDialogComponent,
        TerminologyLookupOperatorComponent,
        HelpComponent,
    ],
    imports: [
        BrowserAnimationsModule,
        BrowserModule,
        HttpClientModule,
        RouterModule.forRoot([{path: '**', component: AppComponent}], {useHash: true, initialNavigation: 'disabled'}),
        WaveCoreModule,
    ],
    providers: [
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
        LayerService,
        LayoutService,
        MapService,
        NotificationService,
        ProjectService,
        RandomColorService,
        SidenavRef,
        StorageService,
        {provide: Config, useClass: AppConfig},
        {provide: MappingQueryService, useClass: GFBioMappingQueryService},
        {provide: UserService, useClass: GFBioUserService},
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}

function setupOperatorTypes(): Promise<void> {
    return new Promise((resolve, _reject) => {
        OperatorTypeFactory.addType(TerminologyLookupType.TYPE, (dict) =>
            TerminologyLookupType.fromDict(dict as TerminologyLookupTypeDict),
        );
        OperatorTypeFactory.addType(PangaeaSourceType.TYPE, (dict) => PangaeaSourceType.fromDict(dict as PangaeaSourceTypeDict));
        OperatorTypeFactory.addType(ABCDSourceType.TYPE, (dict) => ABCDSourceType.fromDict(dict as ABCDSourceTypeDict));

        resolve();
    });
}
