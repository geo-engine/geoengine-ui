/**
 * Created by Julian on 09/05/2017.
 */
import {IntervalFormat} from '../../interval.enum';
import {
    Component, ChangeDetectionStrategy, Input, ViewChild, ElementRef, OnInit, AfterViewInit,
    ApplicationRef, ChangeDetectorRef, OnDestroy
} from '@angular/core';
import {CsvPropertiesComponent, FormStatus} from '../csv-properties/csv-properties.component';
import * as Papa from 'papaparse';
import {Observable, Subscription} from 'rxjs';
import {FormControl, AbstractControl} from '@angular/forms';
import {CsvDialogComponent} from '../../csv-dialog/csv-dialog.component';

@Component({
    selector: 'wave-csv-table',
    templateUrl: './csv-table-template.component.html',
    styleUrls: ['./csv-table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CsvTableComponent implements OnInit, AfterViewInit, OnDestroy {

    resizeEvent$ = Observable.fromEvent(window, 'resize').map(() => {
        return document.documentElement.clientWidth;
    });

    @Input('properties') csvProperty: CsvPropertiesComponent;
    @Input() data: {file: File, content: string, progress: number, configured: boolean, isNumberArray: boolean[]};
    @Input() cellSpacing: number;
    @Input() linesToParse: number;
    @Input() dialog: CsvDialogComponent;

    IntervalFormat = IntervalFormat;

    @ViewChild('headerdiv') headerDiv: ElementRef;
    @ViewChild('bodydiv') bodyDiv: ElementRef;
    @ViewChild('typingdiv') typingDiv: ElementRef;
    @ViewChild('headertable') headerTable: ElementRef;
    @ViewChild('bodytable') bodyTable: ElementRef;
    @ViewChild('typingtable') typingTable: ElementRef;
    @ViewChild('tableframe') tableFrame: ElementRef;

    parsedData: Array<Array<string>>;
    customHeader: string[] = [];
    header: string[] = [];
    elements: string[][] = [];
    cellSizes:number[] = [];

    private subscriptions: Array<Subscription> = [];

    constructor(public _changeDetectorRef: ChangeDetectorRef) {
        setTimeout( () => {
            this._changeDetectorRef.markForCheck();
        }, 10);
    }

    ngOnInit() {
        this.subscriptions.push(
            // this.resizeEvent$.subscribe(data => this.resizeTableFrame())
        );
        this.parse();
        this.cellSizes = new Array(this.header.length);
        for(let i: number = 0; i < this.header.length; i++) {
            this.cellSizes[i] = 0;
        }
    }

    ngAfterViewInit() {
    }

    ngOnDestroy() {
        this.subscriptions.forEach(sub => sub.unsubscribe());
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
            if (this.header.length <= 2) {
                this.csvProperty.temporalProperties.controls['isTime'].setValue(false);
                this.csvProperty.temporalProperties.controls['isTime'].disable();
            } else {
                this.csvProperty.temporalProperties.controls['isTime'].enable();
            }
            // TODO: set Start/End column to a valid value, if it exceeds header length.
        }
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
        this.cellSizes = [];
        for(let i: number = 0; i < Math.max(this.header.length, this.elements.length); i++) {
            this.cellSizes.push(0);
        }
    }

    /**Gets called on table property change with some delay, so the view can reload first.
     * Sets the min-width property of every tables first rows cells to the maximum
     * of every tables first rows cells(Column-wise),
     * if table assigned to class "resizeTable".
     */
    resizeTable() {
        let tableArr: HTMLTableElement[] = [];
        tableArr.push(this.headerTable.nativeElement);
        tableArr.push(this.bodyTable.nativeElement);
        if (this.csvProperty.formStatus$.getValue() === FormStatus.TypingProperties) {
            tableArr.push(this.typingTable.nativeElement);
        }
        let colNumber = 0;
        for (let t of tableArr) {
            if (t.rows.length > colNumber) {
                colNumber = t.rows.length;
            }
        }
        for (let t of tableArr) {
            // t.style.borderSpacing = this.cellSpacing + 'px 0';
            let row: HTMLTableRowElement = t.rows.item(0) as HTMLTableRowElement;
            for (let j = 0; j < row.cells.length; j++) {
                let cell: HTMLElement = row.cells.item(j) as HTMLElement;
                if(cell.getAttribute('name') === 'spacer') {
                    this.cellSizes[j] = this.cellSpacing;
                }else if (!this.cellSizes[j] || this.cellSizes[j] < cell.getBoundingClientRect().width) {
                    this.cellSizes[j] = cell.getBoundingClientRect().width;
                }
            }
        }
        // this.resizeTableFrame();
        // Reset the headerdiv to body divs scroll.
        this.headerDiv.nativeElement.scrollLeft = this.bodyDiv.nativeElement.scrollLeft = 0;
        if (this.csvProperty.formStatus$.getValue() === FormStatus.TypingProperties) {
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
        tableArr.push(this.headerTable.nativeElement);
        tableArr.push(this.bodyTable.nativeElement);
        if (this.csvProperty.formStatus$.getValue() === FormStatus.TypingProperties) {
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
        this._changeDetectorRef.detectChanges();
        this.resetTableSize();
        this.update(10);
        setTimeout(() => this.resizeTable(), 100);
        this.update(100);
    }

    ending(i: number): string {
        if ((i - 1) % 10 === 0 && (i - 11) % 100 !== 0) {
            return 'st';
        } else if ((i - 2) % 10 === 0 && (i - 12) % 100 !== 0) {
            return 'nd';
        } else if ((i - 3) % 10 === 0 && (i - 13) % 100 !== 0) {
            return 'rd';
        } else {
            return 'th';
        }
    }

    update(timeOut: number) {
        setTimeout(() => {
            this._changeDetectorRef.reattach();
            this._changeDetectorRef.detectChanges();
        }, timeOut);
        if(this.header.length < 2) {
            this.csvProperty.temporalProperties.controls['isTime'].setValue(false);
            this.csvProperty.temporalProperties.controls['isTime'].disable();
        } else if(this.header.length <= 3) {
            if([IntervalFormat.StartEnd, IntervalFormat.StartDur].indexOf(this.csvProperty.temporalProperties.controls['intervalType'].value) >= 0) {
                this.csvProperty.temporalProperties.controls['intervalType'].setValue(IntervalFormat.StartInf);
            }
        } else {
            this.csvProperty.temporalProperties.controls['isTime'].enable();
        }
    }

    get notOnlyWhiteSpace() : boolean {
        for(let h of this.header) {
            if(h === '' || h === null || h === undefined) return false;
        }
        return true;
    }
}
