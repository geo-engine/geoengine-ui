import {async, inject, ComponentFixture, TestBed} from "@angular/core/testing";
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild} from "@angular/core";
import {CsvPropertiesService} from "../../csv-dialog/csv.properties.service";
import {CsvTableComponent} from "./csv-table.component";
import {FormsModule} from "@angular/forms";
import {MaterialModule} from "../../../../../material.module";

describe('CsvTableComponent', () => {
    let component: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                CsvTableComponent,
                TestHostComponent
            ],
            imports: [
                MaterialModule,
                FormsModule
            ],
            providers: [
                CsvPropertiesService,
                ChangeDetectorRef
            ]
        })
            .compileComponents();
    }));

    beforeEach((done) => {
        fixture = TestBed.createComponent(TestHostComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        jasmine.clock().install();
    });

    afterEach(() => {
        jasmine.clock().uninstall();
    });

    it('should parse and update correctly', async(inject([CsvPropertiesService], (propertiesService: CsvPropertiesService) => {
        propertiesService.changeDataProperties({
            delimiter: ',',
            decimalSeparator: '.',
            isTextQualifier: false,
            textQualifier: '"',
            isHeaderRow: true,
            headerRow: 0,
        }).subscribe((result) => {
            expect(result).toBe(true);
            // fixture.detectChanges();
            // component.csvTable._changeDetectorRef.detectChanges();
            // const table_rows = document.getElementsByTagName('tr');
            // expect(table_rows[table_rows.length - 1].getElementsByTagName('td').length).toBe(7);
        });
    })));

    @Component({
        selector: 'wave-table-test-host',
        template: `<wave-csv-table
            #csvTable
            [data]="data"
            [cellSpacing]="10"
            [linesToParse]="15"
        ></wave-csv-table>`,
        providers: [CsvPropertiesService],
        changeDetection: ChangeDetectionStrategy.OnPush
    })
    class TestHostComponent {
        @ViewChild('csvTable') csvTable: CsvTableComponent;
        modifiedDate = new Date();
        data = {
            file: new File(['"a,b",c,d\n"1,2",3,4'], 'test-file.csv', {lastModified : this.modifiedDate.getDate(), type: 'csv'}),
            content: '"a,b",c,d\n"1,2",3,4',
            progress: 100,
            isNull: false
        };
    }
});
