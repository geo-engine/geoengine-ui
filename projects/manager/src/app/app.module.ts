import {APP_INITIALIZER, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatToolbarModule} from '@angular/material/toolbar';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {LoginComponent} from './login/login.component';
import {NavigationComponent} from './navigation/navigation.component';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MAT_CARD_CONFIG, MatCardModule} from '@angular/material/card';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatChipsModule} from '@angular/material/chips';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatDialogModule} from '@angular/material/dialog';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatInputModule} from '@angular/material/input';
import {MatMenuModule} from '@angular/material/menu';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatRadioModule} from '@angular/material/radio';
import {MatSelectModule} from '@angular/material/select';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatSliderModule} from '@angular/material/slider';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatStepperModule} from '@angular/material/stepper';
import {MatTableModule} from '@angular/material/table';
import {MatTabsModule} from '@angular/material/tabs';
import {MatTooltipModule} from '@angular/material/tooltip';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AppConfig} from './app-config.service';
import {DatasetsComponent} from './datasets/datasets.component';
import {LayersComponent} from './layers/layers.component';
import {LayerEditorComponent} from './layers/layer-editor/layer-editor.component';
import {ScrollingModule} from '@angular/cdk/scrolling';
import {DatasetListComponent} from './datasets/dataset-list/dataset-list.component';
import {DatasetEditorComponent} from './datasets/dataset-editor/dataset-editor.component';
import {PermissionsComponent} from './permissions/permissions.component';
import {RasterResultDescriptorComponent} from './result-descriptors/raster-result-descriptor/raster-result-descriptor.component';
import {VectorResultDescriptorComponent} from './result-descriptors/vector-result-descriptor/vector-result-descriptor.component';
import {CommonConfig, CommonModule, RandomColorService} from '@geoengine/common';
import {SymbologyEditorComponent} from './symbology/symbology-editor/symbology-editor.component';
import {ProvenanceComponent} from './provenance/provenance.component';
import {AddDatasetComponent} from './datasets/add-dataset/add-dataset.component';
import {GdalMetadataListComponent} from './datasets/loading-info/gdal-metadata-list/gdal-metadata-list.component';
import {GdalDatasetParametersComponent} from './datasets/loading-info/gdal-dataset-parameters/gdal-dataset-parameters.component';

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

@NgModule({
    declarations: [
        AppComponent,
        NavigationComponent,
        LoginComponent,
        DatasetsComponent,
        LayersComponent,
        LayerEditorComponent,
        DatasetListComponent,
        DatasetEditorComponent,
        PermissionsComponent,
        RasterResultDescriptorComponent,
        VectorResultDescriptorComponent,
        SymbologyEditorComponent,
        ProvenanceComponent,
        AddDatasetComponent,
        GdalMetadataListComponent,
        GdalDatasetParametersComponent,
    ],
    imports: [
        ...MATERIAL_MODULES,
        FormsModule,
        ReactiveFormsModule,
        BrowserModule,
        AppRoutingModule,
        MatToolbarModule,
        MatButtonModule,
        MatSidenavModule,
        MatIconModule,
        MatListModule,
        BrowserAnimationsModule,
        ScrollingModule,
        CommonModule,
    ],
    providers: [
        {provide: AppConfig, useClass: AppConfig},
        CommonConfig,
        RandomColorService,
        {
            provide: APP_INITIALIZER,
            useFactory: (config: AppConfig) => (): Promise<void> => config.load(),
            deps: [AppConfig],
            multi: true,
        },
        {provide: MAT_CARD_CONFIG, useValue: {appearance: 'outlined'}},
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
