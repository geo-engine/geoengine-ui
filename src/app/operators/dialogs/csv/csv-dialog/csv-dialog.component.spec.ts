import {ComponentFixture, fakeAsync, inject, TestBed, flush, async} from '@angular/core/testing';

import { CsvDialogComponent } from './csv-dialog.component';
import {CsvPropertiesService} from './csv.properties.service';
import {CsvPropertiesComponent, FormStatus} from '../csv-config/csv-properties/csv-properties.component';
import {CsvTableComponent} from '../csv-config/csv-table/csv-table.component';
import {CsvUploadComponent} from '../csv-upload/csv-upload.component';
import {MaterialModule} from '../../../../material.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatDialogModule, MatDialogRef, MatOption, MatSelect, MatSelectModule, MatSlideToggle} from '@angular/material';
import {DialogSectionHeadingComponent} from '../../../../dialogs/dialog-section-heading/dialog-section-heading.component';
import {DialogHeaderComponent} from '../../../../dialogs/dialog-header/dialog-header.component';
import {UserService} from '../../../../users/user.service';
import {RandomColorService} from '../../../../util/services/random-color.service';
import {ProjectService} from '../../../../project/project.service';
import {Operator} from '../../../operator.model';
import {Observable} from 'rxjs/index';
import {of} from 'rxjs';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ChangeDetectorRef, DebugElement} from '@angular/core';
import {By} from '@angular/platform-browser';
import {OverlayContainer, OverlayModule} from '@angular/cdk/overlay';
import {SelectSpecHelper} from '../../../../spec/select-spec.helper';

class MockUserService {
    getFeatureDBList(): Observable<Array<{ name: string, operator: Operator }>> {
        return of([
            {name: 'name is taken', operator: null}
        ]);
    }
}
class MockProjectService {

}

describe('Component: CsvDialogComponent', () => {
    let component: CsvDialogComponent;
    let fixture: ComponentFixture<CsvDialogComponent>;
    let service: CsvPropertiesService;
    let cd: ChangeDetectorRef;
    let propertiesComponent: CsvPropertiesComponent;
    let tableComponent: CsvTableComponent;
    let el: any;
    let de: DebugElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                CsvDialogComponent,
                CsvPropertiesComponent,
                CsvTableComponent,
                CsvUploadComponent,
                DialogSectionHeadingComponent,
                DialogHeaderComponent
            ],
            imports: [
                MaterialModule,
                FormsModule,
                ReactiveFormsModule,
                BrowserAnimationsModule
            ],
            providers: [
                CsvPropertiesService,
                RandomColorService,
                {provide: ProjectService, useClass: MockProjectService},
                {provide: UserService, useClass: MockUserService},
                {provide: MatDialogRef, useValue: {}},
                // {provide: OverlayContainer, useFactory: () => {
                //     return { getContainerElement: () => oce };
                // }}
            ]
        }).compileComponents();
    });

    beforeEach(async(() => {
        fixture = TestBed.createComponent(CsvDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        de = fixture.debugElement;
        el = de.nativeElement;
        cd = fixture.componentRef.injector.get(ChangeDetectorRef);
        service = fixture.componentRef.injector.get(CsvPropertiesService);
        // oc = fixture.componentRef.injector.get(OverlayContainer);
        // oce = oc.getContainerElement();

        const modifiedDate = new Date();
        component.data = {
            file: new File(['"a,b",c\n"1,2",3'], 'test-file.csv', {lastModified : modifiedDate.getDate(), type: 'csv'}),
            content: '"a,b",c\n"1,2",3',
            progress: 100,
            isNull: false
        };
        component.uploading$.next(false);
        cd.detectChanges();

        propertiesComponent = component.csvProperties;
        tableComponent = component.csvTable;
    }));

    /** Section for data properties card.
     * */
    describe('Data Properties', () => {
        /** If the user corrects data properties settings as text qualifiers, resulting in the csv resizing such that either
         * spatial or temporal properties are no longer in bounds we want to reset them to default values, i.e.
         * x = 0
         * y = 1
         * start = 2
         * end = 3.
         * */
        it('resets column selection', () => {
            component.csvProperties.dataProperties.patchValue({isTextQualifier: false, xColumn: 2});
            cd.detectChanges();
            expect(component.csvTable.header.length).toBe(3);
            component.csvProperties.dataProperties.patchValue({isTextQualifier: true});
            cd.detectChanges();
            expect(component.csvProperties.spatialProperties.controls['xColumn'].value).toBe(0);
            expect(component.csvProperties.spatialProperties.controls['yColumn'].value).toBe(1);
            expect(component.csvProperties.temporalProperties.controls['startColumn'].value).toBe(2);
            expect(component.csvProperties.temporalProperties.controls['endColumn'].value).toBe(3);
        });
    });

    /** Section for testing spatial Properties card.
     * */
    describe('Spatial Properties', () => {
        /** When using (x,y)-Coordinate selection and setting the x column to be the same as the y column, we want
         * to respect the user choice and set it there. Since the x column can't have the same value as the y column we need
         * to move y. This moving is w.r.t. the csv table width, i.e. incrementing by 1 if possible, otherwise decrease by 1.
         * */
        it('the overwritten spatial column shows subordinate behavior (with respect to csv table width)', () => {
            // Set x Column to be y Column.
            component.csvProperties.spatialProperties.patchValue({xColumn: 1}); // swap x and y columns (move modulo 2)
            cd.detectChanges();
            expect(component.csvProperties.spatialProperties.controls['yColumn'].value).toBe(0); // x and y columns were swapped
            // Make CSV 3 Columns wide
            component.csvProperties.dataProperties.patchValue({isTextQualifier: false}); // now make csv 3 columns wide
            expect(component.csvProperties.temporalProperties.controls['isTime'].disabled).toBeFalsy();
            component.csvProperties.temporalProperties.patchValue({isTime: true}); // enable time
            cd.detectChanges();
            expect(component.csvProperties.temporalProperties.controls['startColumn'].value).toBe(2); // time gets initialized into
            // free space
            component.csvProperties.spatialProperties.patchValue({yColumn: 1}); // now move y up
            cd.detectChanges();
            expect(component.csvProperties.spatialProperties.controls['xColumn'].value).toBe(2); // x gets moved up too
            expect(component.csvProperties.temporalProperties.controls['startColumn'].value).toBe(0); // start column is now moved
            // to 0, since there is free space.
            component.csvProperties.spatialProperties.patchValue({yColumn: 2}); // set the y column to the last
            cd.detectChanges();
            expect(component.csvProperties.spatialProperties.controls['xColumn'].value).toBe(1); // x column is moved modulo 3.
            expect(component.csvProperties.temporalProperties.controls['startColumn'].value).toBe(0); // time hasn't changed
        });

        /** When setting wkt to true the y-column selection vanishes. We want to the selection to be
         * subordinate to the chosen value of x while wkt is used. When turning wkt off again, x should stay as is and y should
         * move to a valid value.
         * */
        it('reserves x Column when moving to wkt', () => {
            component.csvProperties.dataProperties.patchValue({textQualifier: false}); // 3 column table
            component.csvProperties.temporalProperties.patchValue({isTime: true});
            component.csvProperties.spatialProperties.patchValue({yColumn: 2});
            cd.detectChanges();
            component.csvProperties.spatialProperties.patchValue({isWkt: true});
            cd.detectChanges();
            component.csvProperties.spatialProperties.patchValue({xColumn: 2});
            cd.detectChanges();
            expect(component.csvProperties.spatialProperties.controls['yColumn'].value).toBe(2);
            component.csvProperties.spatialProperties.patchValue({isWkt: false});
            expect(component.csvProperties.spatialProperties.controls['xColumn'].value).toBe(2);
            expect(component.csvProperties.spatialProperties.controls['yColumn'].value).toBe(1);
            expect(component.csvProperties.temporalProperties.controls['startColumn'].value).toBe(0);
        });
    });

    /** Section for temporal Properties card.
     * */
    describe('Temporal Properties', () => {
        /** Interval type select; this is not working right now since there is no (functioning) workaround for mat-select testing.
         * */
        describe('MatSelect: Interval Type Select', () => {
            let selectHelper: SelectSpecHelper;

            beforeEach(() => {
                // Make sure select is shown in DOM and is enabled.
                component.csvProperties.dataProperties.patchValue({isTextQualifier: false});
                cd.detectChanges();
                component.csvProperties.temporalProperties.patchValue({isTime: true});
                component.csvProperties.formStatus$.next(FormStatus.TemporalProperties);
                cd.detectChanges();
                // Create select helper.
                selectHelper = new SelectSpecHelper(de, cd, 'intervalTypeSelect');
            });

            it('disables interval type options that are non-applicable', () => {
                selectHelper.open();
                const options = selectHelper.getOptions();
                // There is a mat-option for each interval type and vice versa.
                expect(options.length).toBe(component.csvProperties.intervalTypes.length);
                // The non-fitting options are disabled
                for (let i = 0; i < component.csvProperties.intervalTypes.length; i++) {
                    let it = component.csvProperties.intervalTypes[i];
                    // TODO: expect non fitting types to be disabled
                }
            });

            afterEach(() => {
                selectHelper.destroy();
            });
        });
    });

    /** Subsection for testing the inter-card behavior of spatial and temporal properties.
     * */
    describe('Correlations of Spatial and Temporal Properties', () => {
        /** When using (x,y)-Coordinate selection there are atleast 2 columns used. Therefore we need to check if the table
         * does even offer more than 2 columns to enable the one-column time selection (i.e. [Start, inf) and [Start, Start + const)
         * interval types). If it doesn't we expect temporal properties to be disabled completely.
         * */
        it('disables or enables temporal on (x,y)-Coordinate selection with 2 or 3 column table respectively', () => {
            expect(component.csvProperties.temporalProperties.controls['isTime'].disabled).toBeTruthy();
            component.csvProperties.dataProperties.patchValue({isTextQualifier: false});
            cd.detectChanges();
            expect(component.csvProperties.temporalProperties.controls['isTime'].disabled).toBeFalsy();
        });

        /** Analogous test for WKT-selection. Only one column is used for spatial dimensions, therefore we can now have one column time
         * selection with 2 column csvs already.
         * */
        it('enables temporal when using WKT on 2 column table', () => {
            expect(component.csvProperties.temporalProperties.controls['isTime'].value).toBeFalsy();
            expect(component.csvProperties.temporalProperties.controls['isTime'].disabled).toBeTruthy();
            component.csvProperties.spatialProperties.patchValue({isWkt: true});
            cd.detectChanges();
            expect(component.csvProperties.temporalProperties.controls['isTime'].disabled).toBeFalsy();
            // TODO: DOM HERE TOO
        });

        /** As stated documentation of test routine "Data Properties" -> "resets column selection" the default values for column selections
         * might not be valid for small CSVs, i.e. temporal columns might be out of bounds (that is not really a problem for validity since
         * we disable temporal properties then). They are just not proposed then. But when changing to wkt the y column vanishes making room
         * for a start column proposition.
         * */
        it('proposes start column when changing selection to wkt', () => {
            expect(component.csvProperties.temporalProperties.controls['startColumn'].value).toBe(2);
            component.csvProperties.spatialProperties.patchValue({isWkt: true});
            cd.detectChanges();
            expect(component.csvProperties.temporalProperties.controls['startColumn'].value).toBe(1); // start column takes former
            // place of y column.
        });
    });

    /** Section for layer properties card.
     * */
    describe('Layer Properties', () => {
        /** Mocked the UserService: the function getFeatureDBList now returns a 1-element array containing a dummy operator named
         * "name is taken". Therefore we would expect this name to be taken leaving the layer properties with invalid status, setting
         * layername to be "name is taken".
         * */
        it('should detect taken name', () => {
            component.csvProperties.formStatus$.next(FormStatus.LayerProperties);
            cd.detectChanges();
            component.csvProperties.layerProperties.patchValue({layerName: 'name is taken'});
            cd.detectChanges();
            let layerNameInput = de.query(By.css('#layerNameComponent')).nativeElement;
            // let submit = de.query(By.css('#submit_btn')).nativeElement;
            expect(layerNameInput.value).toBe('name is taken');
            expect(propertiesComponent.reservedNames$.getValue()[0]).toBe(layerNameInput.value);
            expect(propertiesComponent.layerProperties.valid).toBeFalsy();
        });
    });

    /**If this test fails every other test fails by the very nature of themselves.
     * Therefore it is not a problem with the component itself, if this doesn't pass.
     * */
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
