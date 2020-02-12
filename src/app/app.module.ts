///<reference path="operators/dialogs/terminology-lookup/terminology-lookup.component.ts"/>
import {BrowserModule} from '@angular/platform-browser';
import {APP_INITIALIZER, NgModule} from '@angular/core';
import {FormBuilder, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MaterialModule} from './material.module';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {HttpClientModule} from '@angular/common/http';
import 'hammerjs';

import {AppComponent} from './app.component';
import {DataRepositoryComponent} from './operators/dialogs/data-repository/data-repository.component';
import {MapContainerComponent} from './map/map-container/map-container.component';
import {
    OlLineLayerComponent,
    OlPointLayerComponent,
    OlPolygonLayerComponent,
    OlRasterLayerComponent,
} from './map/map-layer.component';
import {NbspPipe, ProvenanceListComponent} from './provenance/provenance-list/provenance-list.component';
import {SidenavContainerComponent} from './sidenav/sidenav-container/sidenav-container.component';
import {AbcdRepositoryComponent} from './operators/dialogs/abcd-repository/abcd-repository.component';
import {CssStringToRgbaPipe} from './util/pipes/css-string-to-rgba.pipe';
import {RgbaToCssStringPipe} from './util/pipes/rgba-to-css-string.pipe';
import {BreakpointToCssStringPipe} from './util/pipes/breakpoint-to-css-string.pipe';
import {SymbologyVectorComponent} from './layers/symbology/symbology-vectors/symbology-vector.component';
import {SymbologyRasterComponent} from './layers/symbology/symbology-raster/symbology-raster.component';
import {CodeEditorComponent} from './util/components/code-editor.component';
import {LegendComponent} from './layers/legend/legend.component';
import {PointLegendComponent} from './layers/legend/legend-point/point-legend.component';
import {RasterLegendComponent} from './layers/legend/legend-raster/raster-legend.component';
import {MappingRasterLegendComponent} from './layers/legend/legend-raster/mapping-raster-legend.component';
import {VectorLegendComponent} from './layers/legend/legend-vector/vector-legend.component';
import {MappingQueryService} from './queries/mapping-query.service';
import {UserService} from './users/user.service';
import {GFBioLogoComponent, IdessaLogoComponent, VatLogoComponent} from './logo.component';
import {MappingDataSourceFilter} from './util/pipes/mapping-data-sources.pipe';
import {HighlightPipe} from './util/pipes/highlight.pipe';
import {BasketResultGroupByDatasetPipe} from './operators/dialogs/baskets/gfbio-basket.pipe';
import {TrimPipe} from './util/pipes/trim.pipe';
import {SafeStylePipe} from './util/pipes/safe-style.pipe';
import {SafeHtmlPipe} from './util/pipes/safe-html.pipe';
import {MappingColorizerToGradientPipe} from './util/pipes/mapping-colorizer-to-gradient.pipe';
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
import {HistogramComponent} from './plots/histogram/histogram.component';
import {DialogSectionHeadingComponent} from './dialogs/dialog-section-heading/dialog-section-heading.component';
import {FlexLayoutModule} from '@angular/flex-layout';
import {RenameLayerComponent} from './layers/dialogs/rename-layer.component';
import {LayerSelectionComponent} from './operators/dialogs/helpers/layer-selection/layer-selection.component';
import {OperatorOutputNameComponent} from './operators/dialogs/helpers/operator-output-name/operator-output-name.component';
import {MultiLayerSelectionComponent} from './operators/dialogs/helpers/multi-layer-selection/multi-layer-selection.component';
import {ReprojectionSelectionComponent} from './operators/dialogs/helpers/reprojection-selection/reprojection-selection.component';
import {RasterValueExtractionOperatorComponent} from './operators/dialogs/raster-value-extraction/raster-value-extraction.component';
import {LayerListComponent} from './layers/layer-list/layer-list.component';
import {SmallTimeInteractionComponent} from './time/small-time-interaction/small-time-interaction.component';
import {TimeConfigComponent} from './time/time-config/time-config.component';
import {ExpressionOperatorComponent} from './operators/dialogs/expression-operator/expression-operator.component';
import {HistogramOperatorComponent} from './operators/dialogs/histogram-operator/histogram-operator.component';
import {GbifOperatorComponent} from './operators/dialogs/gbif-operator/gbif-operator.component';
import {Config} from './config.service';
import {SidenavRef} from './sidenav/sidenav-ref.service';
import {SidenavHeaderComponent} from './sidenav/sidenav-header/sidenav-header.component';
import {NavigationComponent} from './sidenav/navigation/navigation.component';
import {SourceOperatorListComponent} from './operators/dialogs/source-operator-list/source-operator-list.component';
import {IfGfbioDirective} from './util/directives/if-gfbio.directive';
import {IfGfbioLoggedInDirective} from './util/directives/if-gfbio-logged-in.directive';
import {IfLoggedInDirective} from './util/directives/if-logged-in.directive';
import {IfGuestDirective} from './util/directives/if-guest.directive';
import {LoginComponent} from './users/login/login.component';
import {PlotListComponent} from './plots/plot-list/plot-list.component';
import {SplashDialogComponent} from './dialogs/splash-dialog/splash-dialog.component';
import {HelpComponent} from './help/help.component';
import {PlotDetailViewComponent} from './plots/plot-detail-view/plot-detail-view.component';
import {CsvPropertiesService} from './operators/dialogs/csv/csv-dialog/csv.properties.service';
import {CsvUploadComponent} from './operators/dialogs/csv/csv-upload/csv-upload.component';
import {
    CsvDialogComponent,
    CsvErrorDialog
} from './operators/dialogs/csv/csv-dialog/csv-dialog.component';
import {FeaturedbSourceListComponent} from './operators/dialogs/featuredb-source-list/featuredb-source-list.component';
import {WorkspaceSettingsComponent} from './project/workspace-settings/workspace-settings.component';
import {RasterIconComponent} from './raster-icon/raster-icon.component';
import {LineageGraphComponent} from './provenance/lineage-graph/lineage-graph.component';
import {LayerExportComponent} from './layers/dialogs/layer-export/layer-export.component';
import {ChangeProjectionComponent} from './project/change-projection/change-projection.component';
import {NewProjectComponent} from './project/new-project/new-project.component';
import {LoadProjectComponent} from './project/load-project/load-project.component';
import {SaveProjectAsComponent} from './project/save-project-as/save-project-as.component';
import {ColorPickerModule} from 'ngx-color-picker';
import {OperatorListComponent} from './operators/dialogs/operator-list/operator-list.component';
import {SidenavSearchComponent, SidenavSearchRightDirective} from './sidenav/sidenav-search/sidenav-search.component';
import {ROperatorComponent} from './operators/dialogs/r/r-operator/r-operator.component';
import {TimeInputComponent} from './time/time-input/time-input.component';
import {RScriptSaveComponent} from './operators/dialogs/r/r-script-save/r-script-save.component';
import {RScriptLoadComponent} from './operators/dialogs/r/r-script-load/r-script-load.component';
import {CsvPropertiesComponent} from './operators/dialogs/csv/csv-config/csv-properties/csv-properties.component';
import {CsvTableComponent} from './operators/dialogs/csv/csv-config/csv-table/csv-table.component';
import {PieChartComponent} from './operators/dialogs/pie-chart-operator/pie-chart-operator.component';
import {ScatterPlotComponent} from './operators/dialogs/scatter-plot-operator/scatter-plot-operator.component';
import {RouterModule} from '@angular/router';
import {
    WorkflowParameterChoiceDialogComponent
} from './project/workflow-parameter-choice-dialog/workflow-parameter-choice-dialog.component';
import {LayerShareComponent} from './layers/dialogs/layer-share/layer-share.component';
import {TableComponent} from './datatable/table/table.component';
import {MediaviewComponent} from './datatable/mediaview/mediaview.component';
import {MediaviewImageComponent} from './datatable/mediaview/image/mediaview.image.component';
import {MediaviewImageDialogComponent} from './datatable/mediaview/image-dialog/mediaview.image-dialog.component';
import {MediaviewAudioComponent} from './datatable/mediaview/audio/mediaview.audio.component';
import {MediaviewVideoComponent} from './datatable/mediaview/video/mediaview.video.component';
import {MediaviewPlaylistComponent} from './datatable/mediaview/playlist/mediaview.playlist.component';
import {FileNamePipe} from './datatable/mediaview/filename.pipe';
import {TextualAttributeFilterOperatorComponent} from './operators/dialogs/textual-attribute-filter/textual-attribute-filter.component';
import {NumericPipe} from './operators/dialogs/scatter-plot-operator/scatter-plot-operator.pipe';
import {
    GroupedAbcdBasketResultComponent
} from './operators/dialogs/baskets/grouped-abcd-basket-result/grouped-abcd-basket-result.component';
import {PangaeaBasketResultComponent} from './operators/dialogs/baskets/pangaea-basket-result/pangaea-basket-result.component';
import {MatIconRegistry} from '@angular/material';
import {SourceDatasetComponent} from './operators/dialogs/data-repository/raster/source-dataset.component';
import {FeedbackComponent} from './help/feedback/feedback.component';
import {BoxPlotComponent} from './operators/dialogs/box-plot-operator/box-plot-operator.component';
import {RasterPolygonClipOperatorComponent} from './operators/dialogs/raster-polygon-clip/raster-polygon-clip.component';
import {IfGeoBonDirective} from './util/directives/if-geobon.directive';
import {OlDrawFeaturesComponent} from './operators/dialogs/draw-features/ol-draw-features.component';
import {CountryPolygonSelectionComponent} from './operators/dialogs/country-polygon-selection/country-polygon-selection.component';
import {ZoomHandlesComponent} from './map/zoom-handles/zoom-handles.component';
import {SymbologyEditorComponent} from './layers/symbology/symbology-editor/symbology-editor.component';
import {SymbologyRasterMappingColorizerComponent} from './layers/symbology/symbology-raster/symbology-raster-mapping-colorizer.component';
import {ColorizerEditorComponent} from './colors/colorizer-editor/colorizer-editor.component';
import {HeatmapOperatorComponent} from './operators/dialogs/heatmap/heatmap.component';
import {SensorSourceOperatorComponent} from './operators/dialogs/sensor-source-operator/sensor-source-operator.component';
import {ColorBreakpointInputComponent} from './colors/color-breakpoint-component/color-breakpoint.component';
import {TimePlotComponent} from './operators/dialogs/time-plot-operator/time-plot-operator.component';
import {TerminologyLookupOperatorComponent} from './operators/dialogs/terminology-lookup/terminology-lookup.component';
import {VectorSourceDatasetComponent} from './operators/dialogs/data-repository/vector/vector-source-dataset.component';
import {TickerInteractionComponent} from './time/ticker-interaction/ticker-interaction.component';
import {StatisticsPlotComponent} from './operators/dialogs/statistics-plot/statistics-plot.component';
import {TestIdComponentDirective} from './spec/test-id-component.directive';
import {LayerStatisticsViewComponent} from './plots/layer-statistics-view/layer-statistics-view.component';
import {
    LayerStatisticsNumericDetailsComponent
} from './plots/layer-statistics-view/layer-statistics-numeric-details/layer-statistics-numeric-details.component';
import {
    LayerStatisticsTextualDetailsComponent
} from './plots/layer-statistics-view/layer-statistics-textual-details/layer-statistics-textual-details.component';
import {CreateRgbCompositeComponent} from './operators/dialogs/create-rgb/create-rgb-composite.component';
import {
    LayerListWorkflowParameterSliderComponent
} from './operators/parameter-options/layer-list-workflow-parameter-slider/layer-list-workflow-parameter-slider.component';
import {IfEUMETSATDirective} from './util/directives/if-eumetsat.directive';

export function configInitializer(config: Config) {
    return () => config.load();
}

@NgModule({
    declarations: [
        AbcdRepositoryComponent,
        AppComponent,
        BasketResultGroupByDatasetPipe,
        BoxPlotComponent,
        BreakpointToCssStringPipe,
        ChangeProjectionComponent,
        CodeEditorComponent,
        ColorBreakpointInputComponent,
        ColorizerEditorComponent,
        CountryPolygonSelectionComponent,
        CountryPolygonSelectionComponent,
        CssStringToRgbaPipe,
        CsvDialogComponent,
        CsvErrorDialog,
        CsvPropertiesComponent,
        CsvTableComponent,
        CsvUploadComponent,
        DataRepositoryComponent,
        DialogHeaderComponent,
        DialogSectionHeadingComponent,
        ExpressionOperatorComponent,
        FeaturedbSourceListComponent,
        FeedbackComponent,
        FeedbackComponent,
        FileNamePipe,
        GbifOperatorComponent,
        GfbioBasketsComponent,
        GFBioLogoComponent,
        GroupedAbcdBasketResultComponent,
        HeatmapOperatorComponent,
        HelpComponent,
        HighlightPipe,
        HistogramComponent,
        HistogramOperatorComponent,
        IdessaLogoComponent,
        IfEUMETSATDirective,
        IfGeoBonDirective,
        IfGfbioDirective,
        IfGfbioLoggedInDirective,
        IfGuestDirective,
        IfLoggedInDirective,
        LayerExportComponent,
        LayerListComponent,
        LayerListWorkflowParameterSliderComponent,
        LayerSelectionComponent,
        ChangeProjectionComponent,
        NewProjectComponent,
        LoadProjectComponent,
        SaveProjectAsComponent,
        OperatorListComponent,
        SidenavSearchComponent,
        SidenavSearchRightDirective,
        ROperatorComponent,
        RScriptSaveComponent,
        RScriptLoadComponent,
        TimeInputComponent,
        CsvPropertiesComponent,
        CsvTableComponent,
        PieChartComponent,
        BoxPlotComponent,
        ScatterPlotComponent,
        TimePlotComponent,
        WorkflowParameterChoiceDialogComponent,
        LayerShareComponent,
        MappingRasterLegendComponent,
        PointLegendComponent,
        RasterLegendComponent,
        VectorLegendComponent,
        LegendComponent,
        LineageGraphComponent,
        LoadProjectComponent,
        LoginComponent,
        MapContainerComponent,
        MappingColorizerToGradientPipe,
        MappingDataSourceFilter,
        MediaviewAudioComponent,
        MediaviewComponent,
        MediaviewImageComponent,
        MediaviewImageDialogComponent,
        MediaviewPlaylistComponent,
        MediaviewVideoComponent,
        MultiLayerSelectionComponent,
        NavigationComponent,
        NbspPipe,
        NewProjectComponent,
        NumericAttributeFilterOperatorComponent,
        NumericPipe,
        OlDrawFeaturesComponent,
        OlLineLayerComponent,
        OlPointLayerComponent,
        OlPolygonLayerComponent,
        OlRasterLayerComponent,
        OperatorListComponent,
        OperatorOutputNameComponent,
        OperatorOutputNameComponent,
        PangaeaBasketResultComponent,
        PieChartComponent,
        PlotDetailViewComponent,
        PlotListComponent,
        PointInPolygonFilterOperatorComponent,
        ProvenanceListComponent,
        RasterIconComponent,
        RasterPolygonClipOperatorComponent,
        RasterValueExtractionOperatorComponent,
        RenameLayerComponent,
        ReprojectionSelectionComponent,
        ReprojectionSelectionComponent,
        RgbaToCssStringPipe,
        ROperatorComponent,
        RScriptLoadComponent,
        RScriptSaveComponent,
        SafeHtmlPipe,
        SafeStylePipe,
        SaveProjectAsComponent,
        ScatterPlotComponent,
        SensorSourceOperatorComponent,
        SidenavContainerComponent,
        SidenavHeaderComponent,
        SidenavSearchComponent,
        SidenavSearchRightDirective,
        SmallTimeInteractionComponent,
        SourceDatasetComponent,
        SourceOperatorListComponent,
        SplashDialogComponent,
        StatisticsPlotComponent,
        SymbologyEditorComponent,
        SymbologyRasterComponent,
        SymbologyRasterMappingColorizerComponent,
        SymbologyVectorComponent,
        TableComponent,
        TerminologyLookupOperatorComponent,
        TextualAttributeFilterOperatorComponent,
        TickerInteractionComponent,
        TimeConfigComponent,
        TimeInputComponent,
        TrimPipe,
        VatLogoComponent,
        VectorSourceDatasetComponent,
        WorkflowParameterChoiceDialogComponent,
        WorkspaceSettingsComponent,
        ZoomHandlesComponent,
        TestIdComponentDirective,
        LayerStatisticsViewComponent,
        LayerStatisticsNumericDetailsComponent,
        LayerStatisticsTextualDetailsComponent,
        CreateRgbCompositeComponent,
    ],
    imports: [
        BrowserAnimationsModule,
        BrowserModule,
        ColorPickerModule,
        DragDropModule,
        FlexLayoutModule,
        FormsModule,
        HttpClientModule,
        MaterialModule,
        ReactiveFormsModule,
        RouterModule.forRoot([{path: '**', component: AppComponent}], {useHash: true}),
    ],
    entryComponents: [
        AbcdRepositoryComponent,
        BoxPlotComponent,
        ChangeProjectionComponent,
        ColorizerEditorComponent,
        CountryPolygonSelectionComponent,
        CreateRgbCompositeComponent,
        CsvDialogComponent,
        CsvErrorDialog,
        DataRepositoryComponent,
        ExpressionOperatorComponent,
        FeaturedbSourceListComponent,
        GbifOperatorComponent,
        GfbioBasketsComponent,
        HeatmapOperatorComponent,
        HelpComponent,
        HistogramOperatorComponent,
        LayerExportComponent,
        LayerShareComponent,
        LineageGraphComponent,
        LoadProjectComponent,
        LoginComponent,
        MediaviewAudioComponent,
        MediaviewImageComponent,
        MediaviewImageDialogComponent,
        MediaviewVideoComponent,
        NewProjectComponent,
        NumericAttributeFilterOperatorComponent,
        OlDrawFeaturesComponent,
        OperatorListComponent,
        PieChartComponent,
        PlotDetailViewComponent,
        PlotListComponent,
        PointInPolygonFilterOperatorComponent,
        RasterPolygonClipOperatorComponent,
        RasterValueExtractionOperatorComponent,
        RenameLayerComponent,
        ROperatorComponent,
        RScriptLoadComponent,
        RScriptSaveComponent,
        SaveProjectAsComponent,
        ScatterPlotComponent,
        SensorSourceOperatorComponent,
        SourceOperatorListComponent,
        StatisticsPlotComponent,
        SplashDialogComponent,
        SymbologyEditorComponent,
        TerminologyLookupOperatorComponent,
        TextualAttributeFilterOperatorComponent,
        TimeConfigComponent,
        BoxPlotComponent,
        TimePlotComponent,
        WorkflowParameterChoiceDialogComponent,
        WorkspaceSettingsComponent,
    ],
    providers: [
        {
            provide: APP_INITIALIZER,
            useFactory: configInitializer,
            deps: [Config],
            multi: true,
        },
        Config,
        CsvPropertiesService,
        FormBuilder,
        LayerService,
        LayoutService,
        MappingQueryService,
        MapService,
        MatIconRegistry,
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
