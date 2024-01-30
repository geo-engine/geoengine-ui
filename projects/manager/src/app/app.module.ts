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
import {ScrollingModule} from '@angular/cdk/scrolling';
import {DatasetListComponent} from './datasets/dataset-list/dataset-list.component';
import {DatasetEditorComponent} from './datasets/dataset-editor/dataset-editor.component';
import {PermissionsComponent} from './permissions/permissions.component';

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
        DatasetListComponent,
        DatasetEditorComponent,
        PermissionsComponent,
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
    ],
    providers: [
        {provide: AppConfig, useClass: AppConfig},
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
