import {NgModule} from '@angular/core';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatButtonModule} from '@angular/material/button';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatCardModule} from '@angular/material/card';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatChipsModule} from '@angular/material/chips';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatDialogModule} from '@angular/material/dialog';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatListModule} from '@angular/material/list';
import {MatMenuModule} from '@angular/material/menu';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatRadioModule} from '@angular/material/radio';
import {MatSelectModule} from '@angular/material/select';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatSliderModule} from '@angular/material/slider';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatStepperModule} from '@angular/material/stepper';
import {MatTableModule} from '@angular/material/table';
import {MatTabsModule} from '@angular/material/tabs';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {ColorPickerModule} from 'ngx-color-picker';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {FlexLayoutModule} from '@angular/flex-layout';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {BoxPlotComponent} from './operators/dialogs/box-plot-operator/box-plot-operator.component';
import {BreakpointToCssStringPipe} from './util/pipes/breakpoint-to-css-string.pipe';
import {ChangeProjectionComponent} from './project/change-projection/change-projection.component';
import {CodeEditorComponent} from './util/components/code-editor.component';
import {ColorBreakpointInputComponent} from './colors/color-breakpoint-component/color-breakpoint.component';
import {ColorizerEditorComponent} from './colors/colorizer-editor/colorizer-editor.component';
import {CountryPolygonSelectionComponent} from './operators/dialogs/country-polygon-selection/country-polygon-selection.component';
import {CssStringToRgbaPipe} from './util/pipes/css-string-to-rgba.pipe';
import {CsvDialogComponent, CsvErrorDialogComponent} from './operators/dialogs/csv/csv-dialog/csv-dialog.component';
import {CsvPropertiesComponent} from './operators/dialogs/csv/csv-config/csv-properties/csv-properties.component';
import {CsvTableComponent} from './operators/dialogs/csv/csv-config/csv-table/csv-table.component';
import {CsvUploadComponent} from './operators/dialogs/csv/csv-upload/csv-upload.component';
import {DataRepositoryComponent} from './operators/dialogs/data-repository/data-repository.component';
import {DialogHeaderComponent} from './dialogs/dialog-header/dialog-header.component';
import {DialogSectionHeadingComponent} from './dialogs/dialog-section-heading/dialog-section-heading.component';
import {ExpressionOperatorComponent} from './operators/dialogs/expression-operator/expression-operator.component';
import {FeaturedbSourceListComponent} from './operators/dialogs/featuredb-source-list/featuredb-source-list.component';
import {HelpFeedbackComponent} from './help/feedback/help-feedback.component';
import {FileNamePipe} from './datatable/mediaview/filename.pipe';
import {GbifOperatorComponent} from './operators/dialogs/gbif-operator/gbif-operator.component';
import {VatLogoComponent} from './logo.component';
import {HeatmapOperatorComponent} from './operators/dialogs/heatmap/heatmap.component';
import {HelpComponent} from './help/help.component';
import {HighlightPipe} from './util/pipes/highlight.pipe';
import {HistogramComponent} from './plots/histogram/histogram.component';
import {HistogramOperatorComponent} from './operators/dialogs/histogram-operator/histogram-operator.component';
import {IfGuestDirective} from './util/directives/if-guest.directive';
import {IfLoggedInDirective} from './util/directives/if-logged-in.directive';
import {LayerExportComponent} from './layers/dialogs/layer-export/layer-export.component';
import {LayerListComponent} from './layers/layer-list/layer-list.component';
import {
    LayerListWorkflowParameterSliderComponent
} from './operators/parameter-options/layer-list-workflow-parameter-slider/layer-list-workflow-parameter-slider.component';
import {LayerSelectionComponent} from './operators/dialogs/helpers/layer-selection/layer-selection.component';
import {NewProjectComponent} from './project/new-project/new-project.component';
import {LoadProjectComponent} from './project/load-project/load-project.component';
import {SaveProjectAsComponent} from './project/save-project-as/save-project-as.component';
import {OperatorListComponent} from './operators/dialogs/operator-list/operator-list.component';
import {SidenavSearchComponent, SidenavSearchRightDirective} from './sidenav/sidenav-search/sidenav-search.component';
import {ROperatorComponent} from './operators/dialogs/r/r-operator/r-operator.component';
import {RScriptSaveComponent} from './operators/dialogs/r/r-script-save/r-script-save.component';
import {RScriptLoadComponent} from './operators/dialogs/r/r-script-load/r-script-load.component';
import {TimeInputComponent} from './time/time-input/time-input.component';
import {PieChartComponent} from './operators/dialogs/pie-chart-operator/pie-chart-operator.component';
import {ScatterPlotComponent} from './operators/dialogs/scatter-plot-operator/scatter-plot-operator.component';
import {TimePlotComponent} from './operators/dialogs/time-plot-operator/time-plot-operator.component';
import {
    WorkflowParameterChoiceDialogComponent
} from './project/workflow-parameter-choice-dialog/workflow-parameter-choice-dialog.component';
import {LayerShareComponent} from './layers/dialogs/layer-share/layer-share.component';
import {MappingRasterLegendComponent} from './layers/legend/legend-raster/mapping-raster-legend.component';
import {PointLegendComponent} from './layers/legend/legend-point/point-legend.component';
import {RasterLegendComponent} from './layers/legend/legend-raster/raster-legend.component';
import {VectorLegendComponent} from './layers/legend/legend-vector/vector-legend.component';
import {LegendComponent} from './layers/legend/legend.component';
import {LineageGraphComponent} from './provenance/lineage-graph/lineage-graph.component';
import {LoginComponent} from './users/login/login.component';
import {MapContainerComponent} from './map/map-container/map-container.component';
import {MappingColorizerToGradientPipe} from './util/pipes/mapping-colorizer-to-gradient.pipe';
import {MappingDataSourceFilter} from './util/pipes/mapping-data-sources.pipe';
import {MediaviewAudioComponent} from './datatable/mediaview/audio/mediaview.audio.component';
import {MediaviewComponent} from './datatable/mediaview/mediaview.component';
import {MediaviewImageComponent} from './datatable/mediaview/image/mediaview.image.component';
import {MediaviewImageDialogComponent} from './datatable/mediaview/image-dialog/mediaview.image-dialog.component';
import {MediaviewPlaylistComponent} from './datatable/mediaview/playlist/mediaview.playlist.component';
import {MediaviewVideoComponent} from './datatable/mediaview/video/mediaview.video.component';
import {MultiLayerSelectionComponent} from './operators/dialogs/helpers/multi-layer-selection/multi-layer-selection.component';
import {Nature40CatalogComponent} from './operators/dialogs/nature40-catalog/nature40-catalog.component';
import {NavigationComponent} from './sidenav/navigation/navigation.component';
import {NbspPipe, ProvenanceListComponent} from './provenance/provenance-list/provenance-list.component';
import {NumericAttributeFilterOperatorComponent} from './operators/dialogs/numeric-attribute-filter/numeric-attribute-filter.component';
import {NumericPipe} from './operators/dialogs/scatter-plot-operator/scatter-plot-operator.pipe';
import {OlDrawFeaturesComponent} from './operators/dialogs/draw-features/ol-draw-features.component';
import {
    OlLineLayerComponent,
    OlPointLayerComponent,
    OlPolygonLayerComponent,
    OlRasterLayerComponent,
} from './map/map-layer.component';
import {OperatorOutputNameComponent} from './operators/dialogs/helpers/operator-output-name/operator-output-name.component';
import {PlotDetailViewComponent} from './plots/plot-detail-view/plot-detail-view.component';
import {PlotListComponent} from './plots/plot-list/plot-list.component';
import {PointInPolygonFilterOperatorComponent} from './operators/dialogs/point-in-polygon-filter/point-in-polygon-filter.component';
import {RasterIconComponent} from './raster-icon/raster-icon.component';
import {RasterPolygonClipOperatorComponent} from './operators/dialogs/raster-polygon-clip/raster-polygon-clip.component';
import {RasterValueExtractionOperatorComponent} from './operators/dialogs/raster-value-extraction/raster-value-extraction.component';
import {RenameLayerComponent} from './layers/dialogs/rename-layer.component';
import {ReprojectionSelectionComponent} from './operators/dialogs/helpers/reprojection-selection/reprojection-selection.component';
import {RgbaToCssStringPipe} from './util/pipes/rgba-to-css-string.pipe';
import {SafeHtmlPipe} from './util/pipes/safe-html.pipe';
import {SafeStylePipe} from './util/pipes/safe-style.pipe';
import {SensorSourceOperatorComponent} from './operators/dialogs/sensor-source-operator/sensor-source-operator.component';
import {SidenavContainerComponent} from './sidenav/sidenav-container/sidenav-container.component';
import {SidenavHeaderComponent} from './sidenav/sidenav-header/sidenav-header.component';
import {SmallTimeInteractionComponent} from './time/small-time-interaction/small-time-interaction.component';
import {SpectralOverviewPlotComponent} from './operators/dialogs/spectral-overview-plot/spectral-overview-plot.component';
import {SourceDatasetComponent} from './operators/dialogs/data-repository/raster/source-dataset.component';
import {SourceOperatorListComponent} from './operators/dialogs/source-operator-list/source-operator-list.component';
import {StatisticsPlotComponent} from './operators/dialogs/statistics-plot/statistics-plot.component';
import {SymbologyRasterComponent} from './layers/symbology/symbology-raster/symbology-raster.component';
import {SymbologyRasterMappingColorizerComponent} from './layers/symbology/symbology-raster/symbology-raster-mapping-colorizer.component';
import {SymbologyVectorComponent} from './layers/symbology/symbology-vectors/symbology-vector.component';
import {TableComponent} from './datatable/table/table.component';
import {TextualAttributeFilterOperatorComponent} from './operators/dialogs/textual-attribute-filter/textual-attribute-filter.component';
import {TickerInteractionComponent} from './time/ticker-interaction/ticker-interaction.component';
import {TimeConfigComponent} from './time/time-config/time-config.component';
import {TrimPipe} from './util/pipes/trim.pipe';
import {VectorSourceDatasetComponent} from './operators/dialogs/data-repository/vector/vector-source-dataset.component';
import {WorkspaceSettingsComponent} from './project/workspace-settings/workspace-settings.component';
import {ZoomHandlesComponent} from './map/zoom-handles/zoom-handles.component';
import {TestIdComponentDirective} from './spec/test-id-component.directive';
import {LayerStatisticsViewComponent} from './plots/layer-statistics-view/layer-statistics-view.component';
import {
    LayerStatisticsNumericDetailsComponent
} from './plots/layer-statistics-view/layer-statistics-numeric-details/layer-statistics-numeric-details.component';
import {
    LayerStatisticsTextualDetailsComponent
} from './plots/layer-statistics-view/layer-statistics-textual-details/layer-statistics-textual-details.component';
import {RgbCompositeComponent} from './operators/dialogs/rgb-composite/rgb-composite.component';
import {ColormapColorizerComponent} from './colors/colormap-colorizer/colormap-colorizer.component';
import {RasterMaskComponent} from './operators/dialogs/raster-mask/raster-mask.component';
import {DialogHelpComponent} from './dialogs/dialog-help/dialog-help.component';
import {ColormapNameToColorizerDataPipe} from './colors/colormap-colorizer/colormap-name-to-colorizer-data.pipe';
import {CommonModule} from '@angular/common';
import {SymbologyEditorComponent} from './layers/symbology/symbology-editor/symbology-editor.component';
import {HelpAboutComponent} from './help/about/help-about.component';
import {HelpGeneralInformationComponent} from './help/general-information/help-general-information.component';
import {HelpQuickDemoComponent} from './help/quick-demo/help-quick-demo.component';
import {HelpOverviewComponent} from './help/overview/help-overview.component';
import {HelpAccountComponent} from './help/account/help-account.component';
import {HelpDataComponent} from './help/data/help-data.component';
import {HelpOperatorsComponent} from './help/operators/help-operators.component';
import {HelpLineageComponent} from './help/lineage/help-lineage.component';
import {HelpExportComponent} from './help/export/help-export.component';

const MATERIAL_MODULES = [
    MatAutocompleteModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDatepickerModule,
    MatDialogModule,
    MatExpansionModule,
    MatExpansionModule,
    MatGridListModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSelectModule,
    MatSidenavModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatStepperModule,
    MatTableModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
];

const WAVE_PIPES = [
    BreakpointToCssStringPipe,
    ColormapNameToColorizerDataPipe,
    CssStringToRgbaPipe,
    FileNamePipe,
    HighlightPipe,
    MappingColorizerToGradientPipe,
    NbspPipe,
    NumericPipe,
    RgbaToCssStringPipe,
    SafeHtmlPipe,
    SafeStylePipe,
    TrimPipe,
];

@NgModule({
    declarations: [
        ...WAVE_PIPES,
        BoxPlotComponent,
        ChangeProjectionComponent,
        CodeEditorComponent,
        ColorBreakpointInputComponent,
        ColorizerEditorComponent,
        ColormapColorizerComponent,
        CountryPolygonSelectionComponent,
        CsvDialogComponent,
        CsvErrorDialogComponent,
        CsvPropertiesComponent,
        CsvTableComponent,
        CsvUploadComponent,
        DataRepositoryComponent,
        DialogHeaderComponent,
        DialogHelpComponent,
        DialogSectionHeadingComponent,
        ExpressionOperatorComponent,
        FeaturedbSourceListComponent,
        GbifOperatorComponent,
        HeatmapOperatorComponent,
        HelpAboutComponent,
        HelpAccountComponent,
        HelpComponent,
        HelpDataComponent,
        HelpExportComponent,
        HelpFeedbackComponent,
        HelpGeneralInformationComponent,
        HelpLineageComponent,
        HelpOperatorsComponent,
        HelpOverviewComponent,
        HelpQuickDemoComponent,
        HistogramComponent,
        HistogramOperatorComponent,
        IfGuestDirective,
        IfLoggedInDirective,
        LayerExportComponent,
        LayerListComponent,
        LayerListWorkflowParameterSliderComponent,
        LayerSelectionComponent,
        LayerShareComponent,
        LayerStatisticsNumericDetailsComponent,
        LayerStatisticsTextualDetailsComponent,
        LayerStatisticsViewComponent,
        LegendComponent,
        LineageGraphComponent,
        LoadProjectComponent,
        LoginComponent,
        MapContainerComponent,
        MappingDataSourceFilter,
        MappingRasterLegendComponent,
        MediaviewAudioComponent,
        MediaviewComponent,
        MediaviewImageComponent,
        MediaviewImageDialogComponent,
        MediaviewPlaylistComponent,
        MediaviewVideoComponent,
        MultiLayerSelectionComponent,
        Nature40CatalogComponent,
        NavigationComponent,
        NewProjectComponent,
        NumericAttributeFilterOperatorComponent,
        OlDrawFeaturesComponent,
        OlLineLayerComponent,
        OlPointLayerComponent,
        OlPolygonLayerComponent,
        OlRasterLayerComponent,
        OperatorListComponent,
        OperatorOutputNameComponent,
        PieChartComponent,
        PlotDetailViewComponent,
        PlotListComponent,
        PointInPolygonFilterOperatorComponent,
        PointLegendComponent,
        ProvenanceListComponent,
        RasterIconComponent,
        RasterLegendComponent,
        RasterMaskComponent,
        RasterPolygonClipOperatorComponent,
        RasterValueExtractionOperatorComponent,
        RenameLayerComponent,
        ReprojectionSelectionComponent,
        RgbCompositeComponent,
        ROperatorComponent,
        RScriptLoadComponent,
        RScriptSaveComponent,
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
        SpectralOverviewPlotComponent,
        StatisticsPlotComponent,
        SymbologyEditorComponent,
        SymbologyRasterComponent,
        SymbologyRasterMappingColorizerComponent,
        SymbologyVectorComponent,
        TableComponent,
        TestIdComponentDirective,
        TextualAttributeFilterOperatorComponent,
        TickerInteractionComponent,
        TimeConfigComponent,
        TimeInputComponent,
        TimePlotComponent,
        VatLogoComponent,
        VectorLegendComponent,
        VectorSourceDatasetComponent,
        WorkflowParameterChoiceDialogComponent,
        WorkspaceSettingsComponent,
        ZoomHandlesComponent,
    ],
    imports: [
        ColorPickerModule,
        CommonModule,
        DragDropModule,
        FlexLayoutModule,
        FormsModule, // TODO: remove?
        HttpClientModule,
        ...MATERIAL_MODULES,
        ReactiveFormsModule,
    ],
    exports: [
        /* re-exports */
        ...MATERIAL_MODULES,
        FlexLayoutModule,
        ReactiveFormsModule,
        /* library exports */
        ...WAVE_PIPES,
        DialogHeaderComponent,
        DialogHelpComponent,
        DialogSectionHeadingComponent,
        GbifOperatorComponent,
        HelpAboutComponent,
        HelpAccountComponent,
        HelpComponent,
        HelpDataComponent,
        HelpExportComponent,
        HelpFeedbackComponent,
        HelpGeneralInformationComponent,
        HelpLineageComponent,
        HelpOperatorsComponent,
        HelpOverviewComponent,
        HelpQuickDemoComponent,
        LayerListComponent,
        LayerSelectionComponent,
        LoginComponent,
        MapContainerComponent,
        MultiLayerSelectionComponent,
        NavigationComponent,
        OlDrawFeaturesComponent,
        OlLineLayerComponent,
        OlPointLayerComponent,
        OlPolygonLayerComponent,
        OlRasterLayerComponent,
        OperatorListComponent,
        OperatorOutputNameComponent,
        PlotListComponent,
        ProvenanceListComponent,
        ReprojectionSelectionComponent,
        SidenavContainerComponent,
        SidenavHeaderComponent,
        SidenavSearchComponent,
        SmallTimeInteractionComponent,
        SourceOperatorListComponent,
        TableComponent,
        TickerInteractionComponent,
        TimeConfigComponent,
        WorkflowParameterChoiceDialogComponent,
        WorkspaceSettingsComponent,
        ZoomHandlesComponent,
    ],
})
export class WaveCoreModule {
}
