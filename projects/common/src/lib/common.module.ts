import {NgModule} from '@angular/core';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonComponent} from './common/common.component';
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
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatSliderModule} from '@angular/material/slider';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatStepperModule} from '@angular/material/stepper';
import {MatTableModule} from '@angular/material/table';
import {MatTabsModule} from '@angular/material/tabs';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ScrollingModule} from '@angular/cdk/scrolling';
import {ColorPickerModule} from 'ngx-color-picker';
import {AsyncValueDefault} from './util/pipes/async-converters.pipe';
import {ColorAttributeInputComponent} from './colors/color-attribute-input/color-attribute-input.component';
import {ColorBreakpointInputComponent} from './colors/color-breakpoint-input/color-breakpoint-input.component';
import {ColorMapSelectorComponent} from './colors/color-map-selector/color-map-selector.component';
import {ColorTableEditorComponent} from './colors/color-table-editor/color-table-editor.component';
import {ColorParamEditorComponent} from './symbology/color-param-editor/color-param-editor.component';
import {RasterGradientSymbologyEditorComponent} from './symbology/raster-gradient-symbology-editor/raster-gradient-symbology-editor.component';
import {RasterPaletteSymbologyEditorComponent} from './symbology/raster-palette-symbology-editor/raster-palette-symbology-editor.component';
import {RasterSymbologyEditorComponent} from './symbology/raster-symbology-editor/raster-symbology-editor.component';
import {SymbologyCreatorComponent} from './symbology/symbology-creator/symbology-creator.component';
import {VectorSymbologyEditorComponent} from './symbology/vector-symbology-editor/vector-symbology-editor.component';
import {NumberParamEditorComponent} from './symbology/number-param-editor/number-param-editor.component';
import {ColorizerCssGradientPipe} from './util/pipes/color-gradients.pipe';

export const MATERIAL_MODULES = [
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
    MatSlideToggleModule,
    MatSliderModule,
    MatSnackBarModule,
    MatStepperModule,
    MatTableModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
];

const COMMON_COMPONENTS = [
    ColorAttributeInputComponent,
    ColorBreakpointInputComponent,
    ColorMapSelectorComponent,
    ColorTableEditorComponent,
    ColorParamEditorComponent,
    RasterGradientSymbologyEditorComponent,
    RasterPaletteSymbologyEditorComponent,
    RasterSymbologyEditorComponent,
    SymbologyCreatorComponent,
    VectorSymbologyEditorComponent,
    NumberParamEditorComponent,
];

const COMMON_PIPES = [AsyncValueDefault, ColorizerCssGradientPipe];

// const FXFLEX_LEGACY_DIRECTIVES = [FxFlexDirective, FxLayoutDirective, FxLayoutGapDirective, FxLayoutAlignDirective];

@NgModule({
    declarations: [...COMMON_COMPONENTS, ...COMMON_PIPES],
    imports: [...MATERIAL_MODULES, ColorPickerModule, FormsModule, ReactiveFormsModule, AngularCommonModule, ScrollingModule],
    exports: [...COMMON_COMPONENTS, ...COMMON_PIPES],
})
export class CommonModule {}
