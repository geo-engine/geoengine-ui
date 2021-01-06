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
    CssStringToRgbaPipe,
    HighlightPipe,
    MappingColorizerToGradientPipe,
    RgbaToCssStringPipe,
    SafeHtmlPipe,
    TrimPipe,
];

const WAVE_COMPONENTS = [
    DialogHeaderComponent,
    DialogHelpComponent,
    DialogSectionHeadingComponent,
    LoginComponent,
    SidenavContainerComponent,
    SidenavHeaderComponent,
    SidenavSearchComponent,
    SidenavSearchRightDirective,
    VatLogoComponent,
    NavigationComponent,
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
