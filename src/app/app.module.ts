///<reference path="../symbology/legendary.component.ts"/>
import {BrowserModule} from '@angular/platform-browser';
import {NgModule, ComponentFactoryResolver} from '@angular/core';
import {FormsModule, FormBuilder, ReactiveFormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {MaterialModule, MdIconRegistry} from '@angular/material';
import 'hammerjs';

import {AppComponent} from './app.component';
import {InfoAreaComponent} from "../components/info-area.component";
import {RibbonsComponent} from "../ribbons/ribbons.component";
import {LayerListComponent} from "../layers/layer-list.component";
import {InfoBarComponent} from "../components/info-bar.component";
// import {DataTableComponent} from "../components/data-table.component";
import {RasterRepositoryComponent} from "../components/raster-repository.component";
import {PlotListComponent} from "../plots/plot-list.component";
import {MapComponent} from "../map/map.component";
import {
    OlPointLayerComponent, OlLineLayerComponent, OlRasterLayerComponent,
    OlPolygonLayerComponent
} from "../map/map-layer.component";
import {ProvenanceListComponent, NbspPipe} from "../provenance/provenance.component";
import {SidenavContainerComponent} from "./sidenav-container.component";
import {AbcdRepositoryComponent} from "../components/abcd-repository.component";
import {CsvRepositoryComponent} from "../components/csv-repository.component";
import {CssStringToRgbaPipe} from "../pipes/css-string-to-rgba.pipe";
import {RgbaToCssStringPipe} from "../pipes/rgba-to-css-string.pipe";
import {SymbologyPointsComponent, SymbologyVectorComponent} from "../symbology/symbology-points.component";
import {SymbologyRasterComponent} from "../symbology/symbology-raster.component";
import {TimeRibbonComponent} from "../ribbons/time-ribbon.component";
import {DialogLoaderComponent} from "../dialogs/dialog-loader.component";
import {StartTabComponent} from "../ribbons/start-tab.component";
import {OperatorsTabComponent} from "../ribbons/operators-tab.component";
import {ProjectTabComponent} from "../ribbons/project-tab.component";
import {DebugTabComponent} from "../ribbons/debug-tab.component";
import {OperatorSelectionGroupComponent, OperatorButtonComponent} from "../ribbons/operator-selection-group.component";
//import {HistogramComponent} from "../plots/histogram.component";
import {
    OperatorOutputNameComponent, LayerMultiSelectComponent,
    ReprojectionSelectionComponent, LayerSelectionComponent
} from "../operators/dialogs/operator.component";
import {CodeEditorComponent} from "../components/code-editor.component";
import {DragulaService} from "ng2-dragula/components/dragula.provider";
import {DragulaModule} from "ng2-dragula/ng2-dragula";
import {
    LegendaryPointComponent, LegendaryRasterComponent,
    LegendaryVectorComponent, LegendaryMappingColorizerRasterComponent, LegendaryClusteredPointComponent,
    LegendaryComponent
} from "../symbology/legendary.component";
import {MappingQueryService} from "../queries/mapping-query.service";
import {UserService} from "../users/user.service";
import {VatLogoComponent, IdessaLogoComponent} from "./logo.component";
import {MappingDataSourceFilter} from "../pipes/mapping-data-sources.pipe";
import {HighlightPipe} from "../pipes/highlight.pipe";
import {BasketResultGroupByDatasetPipe} from "../baskets/gfbio-basket.pipe";
import {TrimPipe} from "../pipes/trim.pipe";
import {GroupedAbcdBasketResultComponent, PangaeaBasketResultComponent} from "../baskets/gfbio-basket-result.component";
import {SafeStylePipe} from "../pipes/safe-style.pipe";
import {MappingColorizerToGradientPipe} from "../symbology/mapping-colorizer-to-gradient.pipe";
import {IntroductionDialogComponent} from "../components/introduction-dialog.component";
import {LoginDialogComponent} from "../users/login-dialog.component";
import {ProjectService} from "../project/project.service";
import {LayerService} from "../layers/layer.service";
import {LayoutService} from "./layout.service";
import {StorageService} from "../storage/storage.service";
import {RandomColorService} from "../services/random-color.service";
import {MapService} from "../map/map.service";
import {NotificationService} from "./notification.service";
import {PlotService} from "../plots/plot.service";
import {ColorPickerService} from "ct-angular2-color-picker/lib/color-picker.service";
import {GfbioBasketsComponent} from "../baskets/gfbio-baskets.component";
import {GBIFOperatorComponent} from "../operators/dialogs/gbif.component";
import {PointInPolygonFilterOperatorComponent} from "../operators/dialogs/point-in-polygon-filter/point-in-polygon-filter.component";
import {DialogHeaderComponent} from "../dialogs/wave-dialog-header/dialog-header.component";
import {NumericAttributeFilterOperatorComponent} from "../operators/dialogs/numeric-attribute-filter/numeric-attribute-filter.component";
import {HistogramComponent} from '../plots/histogram.component';
import {DialogSectionHeadingComponent} from '../dialogs/dialog-section-heading/dialog-section-heading.component';
import {FlexLayoutModule} from '@angular/flex-layout';

@NgModule({
    declarations: [
        AppComponent,
        InfoAreaComponent, RibbonsComponent, LayerListComponent, InfoBarComponent,
        /*DataTableComponent,*/ RasterRepositoryComponent, PlotListComponent,
        MapComponent, OlPointLayerComponent, OlLineLayerComponent, OlRasterLayerComponent,
        OlPolygonLayerComponent, ProvenanceListComponent, SidenavContainerComponent,
        AbcdRepositoryComponent, CsvRepositoryComponent, RgbaToCssStringPipe, CssStringToRgbaPipe, SymbologyPointsComponent, SymbologyRasterComponent, SymbologyVectorComponent,
        TimeRibbonComponent,
        StartTabComponent, OperatorsTabComponent, ProjectTabComponent, DebugTabComponent,
        OperatorSelectionGroupComponent, OperatorButtonComponent, NbspPipe, LayerMultiSelectComponent, ReprojectionSelectionComponent, OperatorOutputNameComponent, CodeEditorComponent,
        LayerSelectionComponent, LegendaryComponent, LegendaryPointComponent, LegendaryRasterComponent, LegendaryVectorComponent,
        LegendaryMappingColorizerRasterComponent, LegendaryClusteredPointComponent, VatLogoComponent,
        IdessaLogoComponent, MappingDataSourceFilter, HighlightPipe, BasketResultGroupByDatasetPipe, TrimPipe, PangaeaBasketResultComponent, GroupedAbcdBasketResultComponent, SafeStylePipe, MappingColorizerToGradientPipe,
        IntroductionDialogComponent, LoginDialogComponent, GfbioBasketsComponent,
        HistogramComponent,
        PointInPolygonFilterOperatorComponent, NumericAttributeFilterOperatorComponent,
        DialogHeaderComponent,
        DialogSectionHeadingComponent,
    ],
    imports: [
        BrowserModule,
        FormsModule,
        HttpModule,
        MaterialModule.forRoot(),
        FlexLayoutModule.forRoot(),
        DragulaModule,
        ReactiveFormsModule,
    ],
    entryComponents: [
        IntroductionDialogComponent, LoginDialogComponent,
        RasterRepositoryComponent, AbcdRepositoryComponent, CsvRepositoryComponent, GfbioBasketsComponent,
        PointInPolygonFilterOperatorComponent, NumericAttributeFilterOperatorComponent,
    ],
    providers: [DragulaService, MdIconRegistry, FormBuilder,
        ProjectService, MappingQueryService, LayerService, PlotService, LayoutService,
        StorageService, RandomColorService, ColorPickerService, MapService, NotificationService, UserService],
    bootstrap: [AppComponent]
})
export class AppModule {
}
