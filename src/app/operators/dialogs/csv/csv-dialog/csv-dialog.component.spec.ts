import {ComponentFixture, fakeAsync, inject, TestBed, flush} from '@angular/core/testing';

import { CsvDialogComponent } from './csv-dialog.component';
import {CsvPropertiesService} from './csv.properties.service';
import {CsvPropertiesComponent, FormStatus} from '../csv-config/csv-properties/csv-properties.component';
import {CsvTableComponent} from '../csv-config/csv-table/csv-table.component';
import {CsvUploadComponent} from '../csv-upload/csv-upload.component';
import {MaterialModule} from '../../../../material.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatDialogModule, MatDialogRef, MatSelect, MatSelectModule, MatSlideToggle} from '@angular/material';
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
    let oc: OverlayContainer; // Contains the overlay components, e.g. the mat-options for an unfolded mat-select.
    // (compare: "should disable/enable temporal properties")
    let oce: HTMLElement;

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
                MatDialogModule,
                ReactiveFormsModule,
                BrowserAnimationsModule,
                MatSelectModule,
                OverlayModule
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
    });

    describe('Data Properties', () => {
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

    describe('Spatial Properties', () => {
        it('the overwritten spatial column shows subordinate behavior (modulo csv table width)', () => {
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
    });

    describe('Temporal Properties', () => {
        describe('Select', () => {
            let intervalSelect: MatSelect;
            let options: HTMLElement[];
            let helper: SelectSpecHelper;

            beforeEach(async () => {
                component.csvProperties.formStatus$.next(FormStatus.TemporalProperties);
                cd.detectChanges();
                helper = new SelectSpecHelper(fixture, cd, 'intervalTypeSelect');
                helper.open();
                options = helper.getOptions();
            });

            // beforeEach(inject([OverlayContainer], (ov: OverlayContainer) => {
            //     oc = ov;
            //     oce = ov.getContainerElement();
            // }));

            it('disables interval options not applicable', () => {
                // this.select = fixture.debugElement.query(By.css('#intervalTypeSelect')).componentInstance as MatSelect;
                // this.select.open();
                // cd.detectChanges();
                // expect(fixture.debugElement.queryAll(By.css('.mat-option')).length).toBe(component.csvProperties.intervalTypes.length);

                // intervalSelect = fixture.debugElement.query(By.css('#intervalTypeSelect')).componentInstance as MatSelect;
                // intervalSelect.open();
                // cd.detectChanges();
                // flush();
                // cd.detectChanges();
                // options = Array.from(oce.querySelectorAll('mat-option'));
                // console.log(oc.getContainerElement(), options, intervalSelect);
                // expect(options.length).toBe(component.csvProperties.intervalTypes.length);
            });

            afterEach(() => {
                helper.destroy();
            });
        });

        describe('should disable/enable temporal properties', () => {
            it('disables or enables on (x,y)-Coordinate selection with 2 or 3 column table respectively', () => {
                expect(component.csvProperties.temporalProperties.get('isTime').disabled).toBeTruthy();
                component.csvProperties.dataProperties.patchValue({isTextQualifier: false});
                cd.detectChanges();
                expect(component.csvProperties.temporalProperties.get('isTime').disabled).toBeFalsy();

                // TODO: Find out how to get DOM Elements that are in the overlay. (First step: Inject OverlayContainer).

                // propertiesComponent.formStatus$.next(FormStatus.TemporalProperties);
                // cd.detectChanges();
                // let intervalTypeSelect = de.query(By.css('#intervalTypeSelect'));
                // intervalTypeSelect.query(By.css('.mat-select-trigger')).nativeElement.click();
                // cd.detectChanges();
                // const options = oce.querySelectorAll('mat-option');
                // expect(options.length).toBeGreaterThanOrEqual(propertiesComponent.intervalTypes.length);
                // for (let i = 0; i < options.length; i++) {
                //     if (options[i].id.startsWith('intervalType')) {
                //         let j = parseInt(options[i].id.replace(/[^0-9]/g, ''), 10);
                //         expect((<HTMLInputElement>options[i]).disabled).toBe(3 > propertiesComponent.intervalTypes[j].columns + 2);
                //     }
                // }
            });

            it('enables when using WKT on 2 column table', () => {
                expect(component.csvProperties.temporalProperties.controls['isTime'].value).toBeFalsy();
                expect(component.csvProperties.temporalProperties.controls['isTime'].disabled).toBeTruthy();
                component.csvProperties.spatialProperties.patchValue({isWkt: true});
                cd.detectChanges();
                expect(component.csvProperties.temporalProperties.controls['isTime'].disabled).toBeFalsy();
                // TODO: DOM HERE TOO
            });
        });
    });

    describe('Layer Properties', () => {
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

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
