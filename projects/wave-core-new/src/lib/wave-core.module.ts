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
import {DialogHeaderComponent} from './dialogs/dialog-header/dialog-header.component';
import {DialogSectionHeadingComponent} from './dialogs/dialog-section-heading/dialog-section-heading.component';
import {VatLogoComponent} from './logo.component';
import {LoginComponent} from './users/login/login.component';
import {BreakpointToCssStringPipe} from './util/pipes/breakpoint-to-css-string.pipe';
import {SafeHtmlPipe} from './util/pipes/safe-html.pipe';
import {TrimPipe} from './util/pipes/trim.pipe';
import {CssStringToRgbaPipe} from './util/pipes/css-string-to-rgba.pipe';
import {HighlightPipe} from './util/pipes/highlight.pipe';
import {MappingColorizerToGradientPipe} from './util/pipes/mapping-colorizer-to-gradient.pipe';
import {RgbaToCssStringPipe} from './util/pipes/rgba-to-css-string.pipe';
import {CommonModule} from '@angular/common';
import {DialogHelpComponent} from './dialogs/dialog-help/dialog-help.component';
import {SidenavHeaderComponent} from './sidenav/sidenav-header/sidenav-header.component';
import {SidenavContainerComponent} from './sidenav/sidenav-container/sidenav-container.component';
import {NavigationComponent} from './sidenav/navigation/navigation.component';
import {
    SidenavSearchComponent,
    SidenavSearchRightDirective
} from './sidenav/sidenav-search/sidenav-search.component';
import {ZoomHandlesComponent} from './map/zoom-handles/zoom-handles.component';
import {MapContainerComponent} from './map/map-container/map-container.component';
import {
    OlLineLayerComponent,
    OlPointLayerComponent,
    OlPolygonLayerComponent,
    OlRasterLayerComponent,
} from './map/map-layer.component';
import {RenameLayerComponent} from './layers/rename-layer/rename-layer.component';
import {LegendComponent} from './layers/legend/legend.component';
import {VectorLegendComponent} from './layers/legend/legend-vector/vector-legend.component';
import {RasterLegendComponent} from './layers/legend/legend-raster/raster-legend.component';
import {LayerListComponent} from './layers/layer-list/layer-list.component';
import {PointIconComponent} from './layers/layer-icons/point-icon/point-icon.component';
import {LineIconComponent} from './layers/layer-icons/line-icon/line-icon.component';
import {RasterIconComponent} from './layers/layer-icons/raster-icon/raster-icon.component';
import {PolygonIconComponent} from './layers/layer-icons/polygon-icon/polygon-icon.component';
import {SymbologyEditorComponent} from './layers/symbology/symbology-editor/symbology-editor.component';
import {MappingRasterLegendComponent} from './layers/legend/legend-raster/mapping-raster-legend.component';
import {SymbologyVectorComponent} from './layers/symbology/symbology-vectors/symbology-vector.component';
import {SymbologyRasterComponent} from './layers/symbology/symbology-raster/symbology-raster.component';
import {ColorBreakpointInputComponent} from './colors/color-breakpoint-component/color-breakpoint.component';
import {ColorizerEditorComponent} from './colors/colorizer-editor/colorizer-editor.component';
import {StrokeDashSelectComponent} from './layers/symbology/stroke-dash-select/stroke-dash-select.component';
import {SymbologyRasterMappingColorizerComponent} from './layers/symbology/symbology-raster/symbology-raster-mapping-colorizer.component';
import {ColormapColorizerComponent} from './colors/colormap-colorizer/colormap-colorizer.component';
import {SafeStylePipe} from './util/pipes/safe-style.pipe';
import {ColormapNameToColorizerDataPipe} from './colors/colormap-colorizer/colormap-name-to-colorizer-data.pipe';

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
    HighlightPipe,
    MappingColorizerToGradientPipe,
    RgbaToCssStringPipe,
    SafeHtmlPipe,
    SafeStylePipe,
    TrimPipe,
];

const WAVE_COMPONENTS = [
    ColorBreakpointInputComponent,
    ColormapColorizerComponent,
    ColorizerEditorComponent,
    DialogHeaderComponent,
    DialogHelpComponent,
    DialogSectionHeadingComponent,
    LayerListComponent,
    LegendComponent,
    LineIconComponent,
    LoginComponent,
    MapContainerComponent,
    MappingRasterLegendComponent,
    NavigationComponent,
    OlLineLayerComponent,
    OlPointLayerComponent,
    OlPolygonLayerComponent,
    OlRasterLayerComponent,
    PointIconComponent,
    PolygonIconComponent,
    RasterIconComponent,
    RasterLegendComponent,
    RenameLayerComponent,
    SidenavContainerComponent,
    SidenavHeaderComponent,
    SidenavSearchComponent,
    SidenavSearchRightDirective,
    StrokeDashSelectComponent,
    SymbologyEditorComponent,
    SymbologyVectorComponent,
    SymbologyRasterComponent,
    SymbologyRasterMappingColorizerComponent,
    VatLogoComponent,
    VectorLegendComponent,
    ZoomHandlesComponent,
];

@NgModule({
    declarations: [
        ...WAVE_PIPES,
        ...WAVE_COMPONENTS,
    ],
    imports: [
        ...MATERIAL_MODULES,
        ColorPickerModule,
        CommonModule,
        DragDropModule,
        FlexLayoutModule,
        FormsModule,
        HttpClientModule,
        ReactiveFormsModule,
    ],
    exports: [
        /* re-exports */
        ...MATERIAL_MODULES,
        FlexLayoutModule,
        ReactiveFormsModule,
        /* library exports */
        ...WAVE_PIPES,
        ...WAVE_COMPONENTS,
    ],
})
export class WaveCoreModule {
}
