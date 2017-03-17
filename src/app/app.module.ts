import {BrowserModule} from '@angular/platform-browser';
import {NgModule, APP_INITIALIZER} from '@angular/core';
import {FormsModule, FormBuilder, ReactiveFormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {MaterialModule, MdIconRegistry} from '@angular/material';
import 'hammerjs';

import {AppComponent} from './app.component';
import {RasterRepositoryComponent} from './operators/dialogs/raster-repository/raster-repository.component';
import {MapComponent} from './map/map.component';
import {
    OlPointLayerComponent, OlLineLayerComponent, OlRasterLayerComponent,
    OlPolygonLayerComponent
} from './map/map-layer.component';
import {ProvenanceListComponent, NbspPipe} from './provenance/provenance-list/provenance-list.component';
import {SidenavContainerComponent} from './sidenav/sidenav-container/sidenav-container.component';
import {AbcdRepositoryComponent} from './operators/dialogs/abcd-repository/abcd-repository.component';
import {CssStringToRgbaPipe} from './util/pipes/css-string-to-rgba.pipe';
import {RgbaToCssStringPipe} from './util/pipes/rgba-to-css-string.pipe';
import {SymbologyPointsComponent, SymbologyVectorComponent} from './layers/symbology/symbology-points.component';
import {SymbologyRasterComponent} from './layers/symbology/symbology-raster.component';
import {CodeEditorComponent} from '../components/code-editor.component';
import {DragulaService} from 'ng2-dragula/components/dragula.provider';
import {DragulaModule} from 'ng2-dragula/ng2-dragula';
import {
    LegendaryPointComponent, LegendaryRasterComponent,
    LegendaryVectorComponent, LegendaryMappingColorizerRasterComponent, LegendaryClusteredPointComponent,
    LegendaryComponent
} from './layers/symbology/legendary.component';
import {MappingQueryService} from './queries/mapping-query.service';
import {UserService} from './users/user.service';
import {VatLogoComponent, IdessaLogoComponent} from './logo.component';
import {MappingDataSourceFilter} from './util/pipes/mapping-data-sources.pipe';
import {HighlightPipe} from './util/pipes/highlight.pipe';
import {BasketResultGroupByDatasetPipe} from './operators/dialogs/baskets/gfbio-basket.pipe';
import {TrimPipe} from './util/pipes/trim.pipe';
import {GroupedAbcdBasketResultComponent, PangaeaBasketResultComponent} from './operators/dialogs/baskets/gfbio-basket-result.component';
import {SafeStylePipe} from './util/pipes/safe-style.pipe';
import {SafeHtmlPipe} from './util/pipes/safe-html.pipe';
import {MappingColorizerToGradientPipe} from './layers/symbology/mapping-colorizer-to-gradient.pipe';
import {ProjectService} from './project/project.service';
import {LayerService} from './layers/layer.service';
import {LayoutService} from './layout.service';
import {StorageService} from './storage/storage.service';
import {RandomColorService} from './util/services/random-color.service';
import {MapService} from './map/map.service';
import {NotificationService} from './notification.service';
import {GfbioBasketsComponent} from './operators/dialogs/baskets/gfbio-baskets.component';
import {PointInPolygonFilterOperatorComponent} from './operators/dialogs/point-in-polygon-filter/point-in-polygon-filter.component';
import {DialogHeaderComponent} from './dialogs/dialog-header/dialog-header.component';
import {NumericAttributeFilterOperatorComponent} from './operators/dialogs/numeric-attribute-filter/numeric-attribute-filter.component';
import {HistogramComponent} from './plots/histogram.component';
import {DialogSectionHeadingComponent} from './dialogs/dialog-section-heading/dialog-section-heading.component';
import {FlexLayoutModule} from '@angular/flex-layout';
import {RenameLayerComponent} from './layers/dialogs/rename-layer.component';
import {LayerSelectionComponent} from './operators/dialogs/helpers/layer-selection/layer-selection.component';
import {OperatorOutputNameComponent} from './operators/dialogs/helpers/operator-output-name/operator-output-name.component';
import {MultiLayerSelectionComponent} from './operators/dialogs/helpers/multi-layer-selection/multi-layer-selection.component';
import {ReprojectionSelectionComponent} from './operators/dialogs/helpers/reprojection-selection/reprojection-selection.component';
import {RasterValueExtractionOperatorComponent} from './operators/dialogs/raster-value-extraction/raster-value-extraction.component';
import {NextLayerListComponent} from './layers/next-layer-list/next-layer-list.component';
import {SmallTimeInteractionComponent} from './small-time-interaction/small-time-interaction.component';
import {TimeConfigComponent} from './time-config/time-config.component';
import {ExpressionOperatorComponent} from './operators/dialogs/expression-operator/expression-operator.component';
import {HistogramOperatorComponent} from './operators/dialogs/histogram-operator/histogram-operator.component';
import {GbifOperatorComponent} from './operators/dialogs/gbif-operator/gbif-operator.component';
import {Config} from './config.service';
import {SidenavRef} from './sidenav/sidenav-ref.service';
import { SidenavHeaderComponent } from './sidenav/sidenav-header/sidenav-header.component';
import { NavigationComponent } from './sidenav/navigation/navigation.component';
import { SourceOperatorListComponent } from './operators/dialogs/source-operator-list/source-operator-list.component';
import { IfGfbioDirective } from './util/directives/if-gfbio.directive';
import { IfGfbioLoggedInDirective } from './util/directives/if-gfbio-logged-in.directive';
import { IfLoggedInDirective } from './util/directives/if-logged-in.directive';
import { IfGuestDirective } from './util/directives/if-guest.directive';
import { LoginComponent } from './users/login/login.component';
import {DataTableModule} from './datatable/datatable.module';
import { PlotListComponent } from './plots/plot-list/plot-list.component';
import { SplashDialogComponent } from './dialogs/splash-dialog/splash-dialog.component';
import { HelpComponent } from './help.component';
import { PlotDetailViewComponent } from './plots/plot-detail-view/plot-detail-view.component';
import { CsvDialogComponent } from './operators/dialogs/csv/csv-dialog/csv-dialog.component';
import { CsvConfigComponent } from './operators/dialogs/csv/csv-config/csv-config.component';
import { CsvUploadComponent } from './operators/dialogs/csv/file-upload/file-upload.component';
import { FeaturedbSourceListComponent } from './operators/dialogs/featuredb-source-list/featuredb-source-list.component';
import { WorkspaceSettingsComponent } from './project/workspace-settings/workspace-settings.component';
import { RasterIconComponent } from './raster-icon/raster-icon.component';
import { LineageGraphComponent } from './provenance/lineage-graph/lineage-graph.component';
import { LayerExportComponent } from './layers/dialogs/layer-export/layer-export.component';
import { ChangeProjectionComponent } from './project/change-projection/change-projection.component';
import { NewProjectComponent } from './project/new-project/new-project.component';
import { LoadProjectComponent } from './project/load-project/load-project.component';
import { SaveProjectAsComponent } from './project/save-project-as/save-project-as.component';
import {ColorPickerModule} from 'angular2-color-picker';
import { OperatorListComponent } from './operators/dialogs/operator-list/operator-list.component';
import {SidenavSearchComponent, SidenavSearchRightDirective} from './sidenav/sidenav-search/sidenav-search.component';
import { ROperatorComponent } from './operators/dialogs/r/r-operator/r-operator.component';

export function configInitializer(config: Config) {
    return () => config.load();
}

@NgModule({
    declarations: [
        AppComponent,
        RasterRepositoryComponent,
        MapComponent,
        OlPointLayerComponent,
        OlLineLayerComponent,
        OlRasterLayerComponent,
        OlPolygonLayerComponent,
        ProvenanceListComponent,
        SidenavContainerComponent,
        AbcdRepositoryComponent,
        RgbaToCssStringPipe,
        CssStringToRgbaPipe,
        SymbologyPointsComponent,
        SymbologyRasterComponent,
        SymbologyVectorComponent,
        NbspPipe,
        ReprojectionSelectionComponent,
        OperatorOutputNameComponent,
        CodeEditorComponent,
        LegendaryComponent,
        LegendaryPointComponent,
        LegendaryRasterComponent,
        LegendaryVectorComponent,
        LegendaryMappingColorizerRasterComponent,
        LegendaryClusteredPointComponent,
        VatLogoComponent,
        IdessaLogoComponent,
        MappingDataSourceFilter,
        HighlightPipe,
        BasketResultGroupByDatasetPipe,
        TrimPipe,
        PangaeaBasketResultComponent,
        GroupedAbcdBasketResultComponent,
        SafeStylePipe,
        SafeHtmlPipe,
        MappingColorizerToGradientPipe,
        GfbioBasketsComponent,
        HistogramComponent,
        PointInPolygonFilterOperatorComponent,
        NumericAttributeFilterOperatorComponent,
        DialogHeaderComponent,
        DialogSectionHeadingComponent,
        RenameLayerComponent,
        LayerSelectionComponent,
        OperatorOutputNameComponent,
        MultiLayerSelectionComponent,
        ReprojectionSelectionComponent,
        RasterValueExtractionOperatorComponent,
        SmallTimeInteractionComponent,
        NextLayerListComponent,
        TimeConfigComponent,
        ExpressionOperatorComponent,
        HistogramOperatorComponent,
        GbifOperatorComponent,
        SidenavHeaderComponent,
        NavigationComponent,
        SourceOperatorListComponent,
        IfGfbioDirective,
        IfGfbioLoggedInDirective,
        IfLoggedInDirective,
        IfGuestDirective,
        LoginComponent,
        PlotListComponent,
        SplashDialogComponent,
        HelpComponent,
        PlotDetailViewComponent,
        CsvDialogComponent,
        CsvConfigComponent,
        CsvUploadComponent,
        FeaturedbSourceListComponent,
        WorkspaceSettingsComponent,
        RasterIconComponent,
        LineageGraphComponent,
        LayerExportComponent,
        ChangeProjectionComponent,
        NewProjectComponent,
        LoadProjectComponent,
        SaveProjectAsComponent,
        OperatorListComponent,
        SidenavSearchComponent,
        SidenavSearchRightDirective,
        ROperatorComponent,
    ],
    imports: [
        BrowserModule,
        FormsModule,
        HttpModule,
        MaterialModule,
        FlexLayoutModule,
        DragulaModule,
        ReactiveFormsModule,
        DataTableModule,
        ColorPickerModule,
    ],
    entryComponents: [
        RenameLayerComponent,
        RasterRepositoryComponent,
        AbcdRepositoryComponent,
        GfbioBasketsComponent,
        PointInPolygonFilterOperatorComponent,
        NumericAttributeFilterOperatorComponent,
        TimeConfigComponent,
        ExpressionOperatorComponent,
        RasterValueExtractionOperatorComponent,
        HistogramOperatorComponent,
        GbifOperatorComponent,
        SourceOperatorListComponent,
        LoginComponent,
        HelpComponent,
        SplashDialogComponent,
        CsvDialogComponent,
        PlotListComponent,
        PlotDetailViewComponent,
        FeaturedbSourceListComponent,
        WorkspaceSettingsComponent,
        LineageGraphComponent,
        LayerExportComponent,
        ChangeProjectionComponent,
        NewProjectComponent,
        LoadProjectComponent,
        SaveProjectAsComponent,
        OperatorListComponent,
        ROperatorComponent,
    ],
    providers: [
        DragulaService,
        MdIconRegistry,
        FormBuilder,
        ProjectService,
        MappingQueryService,
        LayerService,
        LayoutService,
        StorageService,
        RandomColorService,
        MapService,
        NotificationService,
        UserService,
        SidenavRef,
        Config,
        {
            provide: APP_INITIALIZER,
            useFactory: configInitializer,
            deps: [Config],
            multi: true,
        }
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
