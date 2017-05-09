/**
 * Created by Julian on 09/05/2017.
 */
import {IntervalFormat} from '../../interval.enum';
import {Component, ChangeDetectionStrategy, Input, ViewChild, ElementRef, OnInit, AfterViewInit} from '@angular/core';
import {CsvPropertiesComponent, FormStatus} from '../csv-properties/csv-properties.component';
import * as Papa from 'papaparse';

@Component({
    selector: 'wave-csv-table',
    templateUrl: './csv-table-template.component.html',
    styleUrls: ['./csv-table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CsvTableComponent implements OnInit, AfterViewInit {

    @Input('properties') csvProperty: CsvPropertiesComponent;
    @Input() data: {file: File, content: string, progress: number, configured: boolean, isNumberArray: boolean[]};
    @Input() cellSpacing: number;
    @Input() linesToParse: number;

    IntervalFormat = IntervalFormat;

    @ViewChild('headerdiv') headerDiv: ElementRef;
    @ViewChild('bodydiv') bodyDiv: ElementRef;
    @ViewChild('typingdiv') typingDiv: ElementRef;
    @ViewChild('headertable') headerTable: ElementRef;
    @ViewChild('bodytable') bodyTable: ElementRef;
    @ViewChild('typingtable') typingTable: ElementRef;
    @ViewChild('tableframe') tableFrame: ElementRef;

    parsedData: Array<Array<string>>;
    header: string[] = [];
    elements: string[][] = [];

    ngOnInit() {
        console.log('Init table with properties ' + this.csvProperty);
        this.parse();
    }

    ngAfterViewInit() {
        this.resetTableSize();
        setTimeout(() => this.resizeTable());
    }

    parse() {
        if(!!this.csvProperty) {
            let textQualifier: string = this.csvProperty.dataProperties.get('isTextQualifier').value ? this.csvProperty.dataProperties.get('textQualifier').value : null;
            let prev: number = this.csvProperty.dataProperties.get('isHeaderRow').value ? this.csvProperty.dataProperties.get('headerRow').value + this.linesToParse + 1 : this.linesToParse;
            this.parsedData = Papa.parse(this.data.content as string, {
                delimiter: this.csvProperty.dataProperties.get('delimiter').value,
                newline: '',
                quoteChar: textQualifier,
                header: false,
                skipEmptyLines: true,
                preview: prev,
            } as any).data;
            if (this.csvProperty.dataProperties.get('isHeaderRow').value) {
                this.header = this.parsedData[this.csvProperty.dataProperties.get('headerRow').value];
                this.elements = this.parsedData.slice(this.csvProperty.dataProperties.get('headerRow').value + 1,
                    this.csvProperty.dataProperties.get('headerRow').value + this.linesToParse + 1);
            } else {
                this.elements = this.parsedData;
            }
            if (!this.header || !this.elements) {
                console.log('to large data');
            }
            this.resetNumberArr();
        }
        this.resetTableSize();
        setTimeout(() => this.resizeTable());
    }

    resetNumberArr() {
        this.data.isNumberArray = [];
        for (let i = 0; i < this.header.length; i++) {
            this.data.isNumberArray.push(false);
        }
    }

    /**Gets called on table property changes. Resets the min-width property of the first rows cells to 0.
     * Causes a reload "effect"
     */
    resetTableSize() {
        let tableArr: HTMLTableElement[] = [];
        if (this.headerTable) {
            tableArr.push(this.headerTable.nativeElement);
        }
        if (this.bodyTable) {
            tableArr.push(this.bodyTable.nativeElement);
        }
        if (this.typingDiv) {
            tableArr.push(this.typingTable.nativeElement);
        }
        for (let t of tableArr) {
            let row: HTMLTableRowElement = t.rows.item(0) as HTMLTableRowElement;
            for (let j = 0; j < row.cells.length; j++) {
                if (row.cells.item(j) == null) {
                    continue;
                }
                let cell: HTMLElement = row.cells.item(j) as HTMLElement;
                cell.style.minWidth = null;
                cell.style.maxWidth = null;
            }
        }
    }

    /**Gets called on table property change with some delay, so the view can reload first.
     * Sets the min-width property of every tables first rows cells to the maximum
     * of every tables first rows cells(Column-wise),
     * if table assigned to class "resizeTable".
     */
    resizeTable() {
        let tableArr: HTMLTableElement[] = [];
        if (this.headerTable) {
            tableArr.push(this.headerTable.nativeElement);
        }
        if (this.bodyTable) {
            tableArr.push(this.bodyTable.nativeElement);
        }
        if (this.typingDiv) {
            tableArr.push(this.typingTable.nativeElement);
        }
        let colNumber = 0;
        for (let t of tableArr) {
            if (t.rows.length > colNumber) {
                colNumber = t.rows.length;
            }
        }
        let maxCol: number[] = new Array(colNumber);

        for (let t of tableArr) {
            let row: HTMLTableRowElement = t.rows.item(0) as HTMLTableRowElement;
            for (let j = 0; j < row.cells.length; j++) {
                let cell: HTMLElement = row.cells.item(j) as HTMLElement;
                if (cell == null) {
                    continue;
                }
                if (cell.getAttribute('name') === 'spacer') {
                    cell.style.minWidth = this.cellSpacing + 'px';
                    continue;
                }
                if (!maxCol[j] || maxCol[j] < cell.clientWidth) {
                    maxCol[j] = cell.clientWidth;
                }
            }
        }

        for (let t of tableArr) {
            t.style.borderCollapse = 'separate';
            let row: HTMLTableRowElement = t.rows.item(0) as HTMLTableRowElement;
            for (let j = 0; j < row.cells.length; j++) {
                if (row.cells.item(j).getAttribute('name') === 'spacer') {
                    continue;
                }
                let cell: HTMLElement = row.cells.item(j) as HTMLElement;
                cell.style.minWidth = (maxCol[j]) + 'px';
                cell.style.maxWidth = (maxCol[j]) + 'px';
            }
        }
        this.resizeTableFrame();
        // Reset the headerdiv to body divs scroll.
        this.headerDiv.nativeElement.scrollLeft = this.bodyDiv.nativeElement.scrollLeft;
        if (!!this.typingDiv) {
            this.typingDiv.nativeElement.scrollLeft = this.bodyDiv.nativeElement.scrollLeft;
        }
    }

    bodyScroll() {
        let scrollLeft = this.bodyDiv.nativeElement.scrollLeft;
        this.headerDiv.nativeElement.scrollLeft = scrollLeft;
        if (this.csvProperty.formStatus$.getValue() === FormStatus.TypingProperties) {
            this.typingDiv.nativeElement.scrollLeft = scrollLeft;
        }
    }

    /**Gets called on window size changes.
     * It brings the table container back to its initial 80%. This is a bug fix.
     */
    resizeTableFrame() {
        let tableArr: Element[] = [];
        if (this.headerTable) {
            tableArr.push(this.headerTable.nativeElement);
        }
        if (this.bodyTable) {
            tableArr.push(this.bodyTable.nativeElement);
        }
        if (this.typingDiv) {
            tableArr.push(this.typingTable.nativeElement);
        }
        let width = 0;
        for (let t of tableArr) {
            width = Math.max(width, t.clientWidth);
        }
        this.tableFrame.nativeElement.style.maxWidth = Math.min(window.innerWidth * 0.8 - 2 * 24, width) + 'px';
        this.tableFrame.nativeElement.style.minWidth = Math.min(window.innerWidth * 0.8 - 2 * 24, width) + 'px';
        // innerWidth * 0.8 = 80vw(max größe vom dialog) -24 ist padding von md-dialog-content.
    }

    /**Resets table size and delays then.
     * After delay(so view can reload on resetted table column sizes) resizes table to maximum of every table.
     */
    resize() {
        this.resetTableSize();
        setTimeout(() => this.resizeTable());
    }
}
