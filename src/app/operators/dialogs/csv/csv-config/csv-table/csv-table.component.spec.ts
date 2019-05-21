import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ChangeDetectorRef, Component, ViewChild} from '@angular/core';
import {CsvPropertiesService} from '../../csv-dialog/csv.properties.service';
import {CsvTableComponent} from './csv-table.component';
import {FormsModule} from '@angular/forms';
import {MaterialModule} from '../../../../../material.module';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ComponentFixtureSpecHelper} from '../../../../../spec/component-fixture-spec.helper';
import {IntervalFormat} from '../../interval.enum';
import {FormStatus} from '../csv-properties/csv-properties.component';

describe('Component: CsvTableComponent', () => {
    let service: CsvPropertiesService;
    let fixture: ComponentFixtureSpecHelper<TestHostComponent>;
    let component: CsvTableComponent;

    beforeEach(() => {
        fixture = new ComponentFixtureSpecHelper({
            declarations: [
                CsvTableComponent,
                TestHostComponent
            ],
            imports: [
                MaterialModule,
                FormsModule,
                BrowserAnimationsModule
            ],
            providers: [
                CsvPropertiesService,
                ChangeDetectorRef
            ]
        }, TestHostComponent);

        component = fixture.getComponentInstance().csvTable;
        service = fixture.getInjected(CsvPropertiesService);
    });

    it('should parse and update correctly', () => {
        service.changeDataProperties({
            delimiter: ',',
            decimalSeparator: '.',
            isTextQualifier: false,
            textQualifier: '"',
            isHeaderRow: true,
            headerRow: 0,
        });
        fixture.detectChanges();
        expect(getHeader().length).toBe(4);
        expect(numberOfTableColumns()).toBe(4);
        service.changeDataProperties({
            delimiter: ',',
            decimalSeparator: '.',
            isTextQualifier: true,
            textQualifier: '"',
            isHeaderRow: true,
            headerRow: 0,
        });
        fixture.detectChanges();
        expect(getHeader().length).toBe(3);
        expect(numberOfTableColumns()).toBe(3);
    });

    it('resizes table columns and synchronizes header and body widths when using custom headers', async () => {
        component.data.content = '"a,b",c,dddddddddddddd\n"1,2",3,4';
        const TABLE_WIDTH = 4;
        service.changeDataProperties({
            delimiter: ',',
            decimalSeparator: '.',
            isTextQualifier: false,
            textQualifier: '"',
            isHeaderRow: false,
            headerRow: 0,
        });
        fixture.detectChanges();
        let header_row = headerRow();
        let body_row = bodyRow();
        expect(tableWidthWithoutSpacers(header_row)).toBe(TABLE_WIDTH);
        expect(tableWidthWithoutSpacers(body_row)).toBe(TABLE_WIDTH);
        fixture.whenStable().then(() => {
            for (let i = 0; i < header_row.length; i++) {
                expect(clientWidth(header_row[i])).toBe(
                    i % 2 === 0 ?
                        component.cellSizes[i / 2] :
                        component.cellSpacing
                ); // Test whether or not the table resizes to the given values.
                expect(clientWidth(header_row[i])).toBe(clientWidth(body_row[i]));
                // Test if body and header have synchronized cell widths.
            }
        });
    });

    @Component({
        selector: 'wave-table-test-host',
        template: `<wave-csv-table
            #csvTable
            [data]="data"
            [cellSpacing]="10"
            [linesToParse]="15"
        ></wave-csv-table>`,
        providers: [CsvPropertiesService]
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

    /**=====================================================================================================================================
     * Method section for improving readability.
     * =====================================================================================================================================
     **/

    /**Setters
     */


    /**Getters
     */

    let getHeader = function(): {value: string}[] {
        return component.header;
    };

    /**Logic
     */

    let numberOfTableColumns = function(): number {
        const table_rows = fixture.getElementsByTagName('tr');
        if (table_rows.length === 0) {
            return 0;
        }
        return tableWidthWithoutSpacers(table_rows[table_rows.length - 1].getElementsByTagName('td'));
    };

    let headerRow = function(): HTMLCollectionOf<HTMLTableCellElement> {
        let tables = fixture.getElementsByTagName('table');
        let header_table = null;
        for (let i = 0; i < tables.length; i++) {
            if (tables[i].id === 'headertable') {
                header_table = tables[i];
            }
        }
        return header_table.getElementsByTagName('tr')[0].getElementsByTagName('td');
    };

    let bodyRow = function(): HTMLCollectionOf<HTMLTableCellElement> {
        let tables = fixture.getElementsByTagName('table');
        let body_table = null;
        for (let i = 0; i < tables.length; i++) {
            if (tables[i].id === 'bodytable') {
                body_table = tables[i];
            }
        }
        return body_table.getElementsByTagName('tr')[0].getElementsByTagName('td');
    };

    let clientWidth = function(element: HTMLElement): number {
        return element.getBoundingClientRect().width;
    };

    let tableWidthWithoutSpacers = function(row: HTMLCollectionOf<HTMLTableCellElement>): number {
        return (row.length + 1) / 2
    }
});
