import {ComponentFixture, fakeAsync, TestBed} from '@angular/core/testing';

import { CsvDialogComponent } from './csv-dialog.component';
import {CsvPropertiesService} from './csv.properties.service';
import {CsvPropertiesComponent, FormStatus} from '../csv-config/csv-properties/csv-properties.component';
import {CsvTableComponent} from '../csv-config/csv-table/csv-table.component';
import {CsvUploadComponent} from '../csv-upload/csv-upload.component';
import {MaterialModule} from '../../../../material.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatDialogModule, MatDialogRef, MatSlideToggle} from '@angular/material';
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
import {OverlayContainer} from '@angular/cdk/overlay';

class MockUserService {
    getFeatureDBList(): Observable<Array<{ name: string, operator: Operator }>> {
        return of([
            {name: 'name is taken', operator: null}
        ]);
    }
}
class MockProjectService {

}

describe('CsvDialogComponent', () => {
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
    let oce: HTMLElement; // OverlayContainerElement.

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
                BrowserAnimationsModule
            ],
            providers: [
                CsvPropertiesService,
                RandomColorService,
                {provide: ProjectService, useClass: MockProjectService},
                {provide: UserService, useClass: MockUserService},
                {provide: MatDialogRef, useValue: {}}
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(CsvDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        de = fixture.debugElement;
        el = de.nativeElement;
        cd = fixture.componentRef.injector.get(ChangeDetectorRef);
        service = fixture.componentRef.injector.get(CsvPropertiesService);
        oc = fixture.componentRef.injector.get(OverlayContainer);
        oce = oc.getContainerElement();

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

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should detect taken name', (done) => {
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

    it('should disable/enable temporal properties', () => {
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
});
