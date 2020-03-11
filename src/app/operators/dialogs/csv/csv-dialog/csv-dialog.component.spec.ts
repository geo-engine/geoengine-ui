import { CsvDialogComponent } from './csv-dialog.component';
import {CsvPropertiesService} from './csv.properties.service';
import {
    CsvPropertiesComponent, FormStatus,
    INTERVAL_TYPE_SELECT_ID, LAYER_NAME_INPUT_ID
} from '../csv-config/csv-properties/csv-properties.component';
import {CsvTableComponent} from '../csv-config/csv-table/csv-table.component';
import {CsvUploadComponent} from '../csv-upload/csv-upload.component';
import {MaterialModule} from '../../../../material.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {DialogSectionHeadingComponent} from '../../../../dialogs/dialog-section-heading/dialog-section-heading.component';
import {DialogHeaderComponent} from '../../../../dialogs/dialog-header/dialog-header.component';
import {UserService} from '../../../../users/user.service';
import {RandomColorService} from '../../../../util/services/random-color.service';
import {ProjectService} from '../../../../project/project.service';
import {Operator} from '../../../operator.model';
import {Observable} from 'rxjs';
import {of} from 'rxjs';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SelectSpecHelper} from '../../../../spec/select-spec.helper';
import {ComponentFixtureSpecHelper} from '../../../../spec/component-fixture-spec.helper';
import {IntervalType} from '../csv-config/csv-properties/csv-properties.component';
import 'hammerjs';
import {TestIdComponentDirective} from '../../../../spec/test-id-component.directive';
import {configureWaveTesting} from '../../../../spec/wave-testing.configuration';

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

    let service: CsvPropertiesService;
    let propertiesComponent: CsvPropertiesComponent;
    let tableComponent: CsvTableComponent;
    let fixture: ComponentFixtureSpecHelper<CsvDialogComponent>;

    /**
     * Technical preparation.
     */
    configureWaveTesting(() => {
        fixture = new ComponentFixtureSpecHelper<CsvDialogComponent>({
            declarations: [
                CsvDialogComponent,
                CsvPropertiesComponent,
                CsvTableComponent,
                CsvUploadComponent,
                DialogSectionHeadingComponent,
                DialogHeaderComponent,
                TestIdComponentDirective
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
                {provide: MatDialogRef, useValue: {}}
                // {provide: OverlayContainer, useFactory: () => {
                //     return { getContainerElement: () => oce };
                // }}
            ]
        }, CsvDialogComponent);
        service = fixture.getInjected(CsvPropertiesService);
    });

    /**
     * Individual preparation.
     */
    beforeEach(() => {
        const modifiedDate = new Date();
        fixture.getComponentInstance().data = {
            file: new File(['"a,b",c\n"1,2",3'], 'test-file.csv', {lastModified : modifiedDate.getDate(), type: 'csv'}),
            content: '"a,b",c\n"1,2",3',
            progress: 100,
            isNull: false
        };
        fixture.getComponentInstance().uploading$.next(false);
        fixture.detectChanges();

        propertiesComponent = fixture.getComponentInstance().csvProperties;
        tableComponent = fixture.getComponentInstance().csvTable;
    });

    /** Section for data properties card.
     * */
    describe('Data Properties', () => {


        beforeEach(() => {
            setFormStatus(FormStatus.DataProperties);
            fixture.detectChanges();
        });

        /** If the user corrects data properties settings as text qualifiers, resulting in the csv resizing such that either
         * spatial or temporal properties are no longer in bounds we want to reset them to default values, i.e.
         * x = 0
         * y = 1
         * start = 2
         * end = 3.
         * */
        it('resets column selection', () => {
            setIsTextQualifier(false);
            setXColumnIndex(2);
            fixture.detectChanges();
            expect(tableComponent.header.length).toBe(3);
            setIsTextQualifier(true);
            fixture.detectChanges();
            expect(getXColumnIndex()).toBe(0);
            expect(getYColumnIndex()).toBe(1);
            expect(getStartColumnIndex()).toBe(2);
            expect(getEndColumnIndex()).toBe(3);
        });
    });

    /** Section for testing spatial Properties card.
     * */
    describe('Spatial Properties', () => {


        beforeEach(() => {
            setFormStatus(FormStatus.SpatialProperties);
            fixture.detectChanges();
        });

        /** When using (x,y)-Coordinate selection and setting the x column to be the same as the y column, we want
         * to respect the user choice and set it there. Since the x column can't have the same value as the y column we need
         * to move y. This moving is w.r.t. the csv table width, i.e. incrementing by 1 if possible, otherwise decrease by 1.
         * */
        it('the overwritten spatial column shows subordinate behavior (with respect to csv table width)', () => {
            setXColumnIndex(1);
            fixture.detectChanges();
            expect(getYColumnIndex()).toBe(0);
            setIsTextQualifier(false);
            expect(isTimeSelectionDisabled()).toBeFalsy();
            setIsTime(true);
            fixture.detectChanges();
            expect(getStartColumnIndex()).toBe(2);
            setYColumnIndex(1);
            fixture.detectChanges();
            expect(getXColumnIndex()).toBe(2);
            expect(getStartColumnIndex()).toBe(0);
            setYColumnIndex(2);
            fixture.detectChanges();
            expect(getXColumnIndex()).toBe(1);
            expect(getStartColumnIndex()).toBe(0);
        });

        /** When setting wkt to true the y-column selection vanishes. We want to the selection to be
         * subordinate to the chosen value of x while wkt is used. When turning wkt off again, x should stay as is and y should
         * move to a valid value.
         * */
        it('reserves x Column when moving to wkt', () => {
            setIsTextQualifier(false);
            setIsTime(true);
            setYColumnIndex(2);
            fixture.detectChanges();
            setIsWkt(true);
            fixture.detectChanges();
            setXColumnIndex(2);
            fixture.detectChanges();
            expect(getYColumnIndex()).toBe(2);
            setIsWkt(false);
            expect(getXColumnIndex()).toBe(2);
            expect(getYColumnIndex()).toBe(1);
            expect(getStartColumnIndex()).toBe(0);
        });
    });

    /** Section for temporal Properties card.
     * */
    describe('Temporal Properties', () => {


        beforeEach(() => {
            setFormStatus(FormStatus.TemporalProperties);
            fixture.detectChanges();
        });

        /** Interval type select; this is not working right now since there is no (functioning) workaround for mat-select testing.
         * */
        describe('MatSelect: Interval Type Select', () => {
            let selectHelper: SelectSpecHelper;

            beforeEach(() => {
                setIsTextQualifier(false);
                fixture.detectChanges();
                setIsTime(true);
                fixture.detectChanges();
                selectHelper = fixture.getSelectHelper(fixture.getElementByTestId(INTERVAL_TYPE_SELECT_ID));
            });

            it('disables/enables interval type options that are non-applicable', () => {
                selectHelper.open();
                const options = selectHelper.getOptions();
                const intervalTypes = getIntervalTypes();
                // There is a mat-option for each interval type and vice versa.
                expect(options.length).toBe(intervalTypes.length);
                // The non-fitting options are disabled
                for (let i = 0; i < intervalTypes.length; i++) {
                    let it = intervalTypes[i];
                    expect(options[i].getAttribute('aria-disabled') === 'true').toBe(
                        getHeader().length - numberOfSpatialColumns() < it.requiredColumns
                    );
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
            expect(isTimeSelectionDisabled()).toBeTruthy();
            setIsTextQualifier(false);
            fixture.detectChanges();
            expect(isTimeSelectionDisabled()).toBeFalsy();
        });

        /** Analogous test for WKT-selection. Only one column is used for spatial dimensions, therefore we can now have one column time
         * selection with 2 column csvs already.
         * */
        it('enables temporal when using WKT on 2 column table', () => {
            expect(getIsTime()).toBeFalsy();
            expect(isTimeSelectionDisabled()).toBeTruthy();
            setIsWkt(true);
            fixture.detectChanges();
            expect(isTimeSelectionDisabled()).toBeFalsy();
        });

        /** As stated documentation of test routine "Data Properties" -> "resets column selection" the default values for column selections
         * might not be valid for small CSVs, i.e. temporal columns might be out of bounds (that is not really a problem for validity since
         * we disable temporal properties then). They are just not proposed then. But when changing to wkt the y column vanishes making room
         * for a start column proposition.
         * */
        it('proposes start column when changing selection to wkt', () => {
            expect(getStartColumnIndex()).toBe(2);
            setIsWkt(true);
            fixture.detectChanges();
            expect(getStartColumnIndex()).toBe(1); // start column takes former
            // place of y column.
        });
    });

    /** Section for layer properties card.
     * */
    describe('Layer Properties', () => {


        beforeEach(() => {
            setFormStatus(FormStatus.LayerProperties);
            fixture.detectChanges();
        });

        /** Mocked the UserService: the function getFeatureDBList now returns a 1-element array containing a dummy operator named
         * "name is taken". Therefore we would expect this name to be taken leaving the layer properties with invalid status, setting
         * layername to be "name is taken".
         * */
        it('should detect taken name', () => {
            setLayerName('name is taken');
            fixture.detectChanges();
            let layerNameValueDOM = fixture.getElementByTestId(LAYER_NAME_INPUT_ID).nativeElement.value;
            // let submit = de.query(By.css('#submit_btn')).nativeElement;
            expect(layerNameValueDOM).toBe('name is taken');
            expect(getReservedNames()[0]).toBe(layerNameValueDOM);
            expect(isValid()).toBeFalsy();
        });
    });

    /**If this test fails every other test fails by the very nature of themselves.
     * Therefore it is not a problem with the component itself, if this doesn't pass.
     * */
    it('should create', () => {
        expect(fixture.getComponentInstance()).toBeTruthy();
    });

    function setIsTextQualifier(isTextQualifier: boolean): void {
        propertiesComponent.dataProperties.patchValue({isTextQualifier: isTextQualifier});
    }

    function setXColumnIndex(x: number) {
        propertiesComponent.spatialProperties.patchValue({xColumn: x});
    }

    function setYColumnIndex(y: number) {
        propertiesComponent.spatialProperties.patchValue({yColumn: y});
    }

    function setIsTime(isTime: boolean) {
        propertiesComponent.temporalProperties.patchValue({isTime: isTime});
    }

    function setIsWkt(isWkt: boolean) {
        propertiesComponent.spatialProperties.patchValue({isWkt: isWkt});
    }

    function setFormStatus(formStatus: FormStatus) {
        propertiesComponent.formStatus$.next(formStatus);
    }

    function setLayerName(layerName: string) {
        propertiesComponent.layerProperties.patchValue({layerName: layerName});
    }

    function getHeader(): {value: string}[] {
        return tableComponent.header;
    }

    function getIntervalTypes(): IntervalType[] {
        return propertiesComponent.intervalTypes;
    }

    function getXColumnIndex(): number {
        return propertiesComponent.spatialProperties.controls['xColumn'].value;
    }

    function getYColumnIndex(): number {
        return propertiesComponent.spatialProperties.controls['yColumn'].value;
    }

    function getStartColumnIndex(): number {
        return propertiesComponent.temporalProperties.controls['startColumn'].value;
    }

    function getEndColumnIndex(): number {
        return propertiesComponent.temporalProperties.controls['endColumn'].value;
    }

    function getIsWkt(): boolean {
        return propertiesComponent.spatialProperties.controls['isWkt'].value;
    }

    function getIsTime(): boolean {
        return propertiesComponent.temporalProperties.controls['isTime'].value;
    }

    function getReservedNames(): string[] {
        return propertiesComponent.reservedNames$.getValue();
    }

    function isTimeSelectionDisabled(): boolean {
        return propertiesComponent.temporalProperties.controls['isTime'].disabled;
    }

    function numberOfSpatialColumns(): number {
        return (getIsWkt() ? 1 : 2);
    }

    function isValid(): boolean {
        return propertiesComponent.isValid;
    }
});
