/**
 * Created by Julian on 09/05/2017.
 */
import {IntervalFormat} from '../../interval.enum';
import {
    Component, ChangeDetectionStrategy, Input, ViewChild, ElementRef, OnInit, AfterViewInit,
    ChangeDetectorRef, OnDestroy
} from '@angular/core';
import {DataPropertiesDict, FormStatus} from '../csv-properties/csv-properties.component';
import * as Papa from 'papaparse';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';
import {UploadData} from '../../csv-upload/csv-upload.component';
import {CsvPropertiesService} from '../../csv-dialog/csv.properties.service';
import {BehaviorSubject} from 'rxjs';

@Component({
    selector: 'wave-csv-table',
    templateUrl: './csv-table-template.component.html',
    styleUrls: ['./csv-table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CsvTableComponent implements OnInit, AfterViewInit, OnDestroy {

    @Input() data: UploadData;
    @Input() cellSpacing: number;
    @Input() linesToParse: number;

    IntervalFormat = IntervalFormat;
    isNumberArray: number[];
    untypedColumns: BehaviorSubject<number[]>;
    isWkt: BehaviorSubject<boolean>;

    @ViewChild('headerdiv') headerDiv: ElementRef;
    @ViewChild('bodydiv') bodyDiv: ElementRef;
    @ViewChild('typingdiv') typingDiv: ElementRef;
    @ViewChild('headertable') headerTable: ElementRef;
    @ViewChild('bodytable') bodyTable: ElementRef;
    @ViewChild('typingtable') typingTable: ElementRef;
    @ViewChild('tableframe') tableFrame: ElementRef;

    parsedData: Array<Array<string>>;
    customHeader: {value: string}[] = [];
    header: {value: string}[] = [];
    elements: string[][] = [];
    cellSizes: number[] = [];
    dataProperties: DataPropertiesDict;
    formStatus: FormStatus;

    isDataProperties$: Observable<boolean>;
    isSpatialProperties$: Observable<boolean>;
    isTemporalProperties$: Observable<boolean>;
    isTypingProperties$: Observable<boolean>;
    isLayerProperties$: Observable<boolean>;

    xColumn$: Observable<number>;
    yColumn$: Observable<number>;

    private subscriptions: Array<Subscription> = [];

    constructor(public _changeDetectorRef: ChangeDetectorRef, public propertiesService: CsvPropertiesService) {
        this.isDataProperties$ = this.propertiesService.formStatus$.map(status => status === FormStatus.DataProperties);
        this.isSpatialProperties$ = this.propertiesService.formStatus$.map(status => status === FormStatus.SpatialProperties);
        this.isTemporalProperties$ = this.propertiesService.formStatus$.map(status => status === FormStatus.TemporalProperties);
        this.isTypingProperties$ = this.propertiesService.formStatus$.map(status => status === FormStatus.TypingProperties);
        this.isLayerProperties$ = this.propertiesService.formStatus$.map(status => status === FormStatus.LayerProperties);
        this.xColumn$ = this.propertiesService.xyColumn$.map(xy => xy.x);
        this.yColumn$ = this.propertiesService.xyColumn$.map(xy => xy.y);
        setTimeout(this._changeDetectorRef.markForCheck());
        this.untypedColumns = new BehaviorSubject([this.propertiesService.xyColumn$.getValue().x, this.propertiesService.xyColumn$.getValue().y]);
        this.isWkt = new BehaviorSubject(false);
    }

    ngOnInit() {
        this.subscriptions.push(
            this.propertiesService.dataProperties$.subscribe(data => {
                if (!!this.dataProperties) {
                    if (this.dataProperties.isHeaderRow !== data.isHeaderRow) {
                        if (data.isHeaderRow === true) {
                            this.customHeader = new Array(this.elements[0].length);
                            for (let i = 0; i < this.header.length; i++) {
                                this.customHeader[i] = this.header[i];
                            }
                        } else {
                            if (this.customHeader.length === this.elements[0].length) {
                                for (let i = 0; i < this.customHeader.length; i++) {
                                    this.header[i] = this.customHeader[i];
                                }
                            } else {
                                this.customHeader = new Array(this.elements[0].length);
                                this.header = new Array(this.elements[0].length);
                                for (let i = 0; i < this.customHeader.length; i++) {
                                    this.header[i] = {value: ''};
                                    this.customHeader[i] = {value: ''};
                                }
                            }
                        }
                    }
                }
                this.dataProperties = data;
                this.parse();
                if (this.header.length > 0) {
                    setTimeout(this.resize());
                }
            }),
            this.propertiesService.formStatus$.subscribe(formStatus => {
                if ([formStatus, this.formStatus].indexOf(FormStatus.TypingProperties) >= 0) {
                    this.resize();
                    this.bodyScroll();
                }
                this.formStatus = formStatus;
            }),
            this.propertiesService.spatialProperties$.subscribe(data => {
                let untypedColumns = [data.xColumn];
                if (!data.isWkt) {
                    untypedColumns.push(data.yColumn);
                }
                let c = this.isWkt.getValue() ? 1 : 0;
                for (let i = 2 - c; i < this.untypedColumns.getValue().length; i++) {
                    untypedColumns.push(this.untypedColumns.getValue()[i]);
                }
                this.untypedColumns.next(untypedColumns);
                this.isWkt.next(data.isWkt);
                this.update(10);
            }),
            this.propertiesService.temporalProperties$.subscribe(data => {
                let untypedColumns = [this.untypedColumns.getValue()[0]];
                if (!this.isWkt.getValue()) {
                    untypedColumns.push(this.untypedColumns.getValue()[1]);
                }
                if (data.isTime) {
                    untypedColumns.push(data.startColumn);
                    if ([IntervalFormat.StartEnd, IntervalFormat.StartDur].indexOf(data.intervalType) >= 0) {
                        untypedColumns.push(data.endColumn);
                    }
                }
                this.untypedColumns.next(untypedColumns);
                this.update(10);
            }),
            // this.resizeEvent$.subscribe(data => this.resizeTableFrame())
        );
        this.parse();
        this.cellSizes = new Array(this.header.length);
        for (let i = 0; i < this.header.length; i++) {
            this.cellSizes[i] = 0;
        }
    }

    ngAfterViewInit() {
        this.resize();
    }

    ngOnDestroy() {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    parse() {
        if (!!this.dataProperties) {
            let textQualifier: string = this.dataProperties.isTextQualifier ?
                this.dataProperties.textQualifier : null;
            let prev: number = this.dataProperties.isHeaderRow ?
                this.dataProperties.headerRow + this.linesToParse + 1 : this.linesToParse;
            let parsed = Papa.parse(this.data.content as string, {
                delimiter: this.dataProperties.delimiter,
                newline: '',
                quoteChar: textQualifier,
                header: false,
                skipEmptyLines: true,
                preview: prev,
            } as any);
            this.parsedData = parsed.data;
            // this.csvProperty.dataProperties.controls['delimiter'].setValue(parsed.meta.delimiter, {emitEvent: false});
            if (this.dataProperties.isHeaderRow) {
                this.header = new Array(this.parsedData[this.dataProperties.headerRow].length);
                for (let i = 0; i < this.header.length; i++) {
                    this.header[i] = {value: this.parsedData[this.dataProperties.headerRow][i]};
                }
                this.elements = this.parsedData.slice(this.dataProperties.headerRow + 1,
                    this.dataProperties.headerRow + this.linesToParse + 1);
            } else {
                this.elements = this.parsedData;
                if (this.header.length !== this.elements[0].length) {
                    this.header = new Array(this.elements[0].length);
                    for (let i = 0; i < this.header.length; i++) {
                        this.header[i] = {value: ''};
                    }
                }
            }
            if (!this.header || !this.elements) {
                console.log('to large data');
            }
            this.resetNumberArr();
            this.propertiesService.changeHeader(this.header);
            // TODO: set Start/End column to a valid value, if it exceeds header length.
        }
    }

    resetNumberArr() {
        this.isNumberArray = new Array(this.header.length);
        this.isNumberArray.fill(0, 0, this.header.length);
    }

    /**Gets called on table property changes. Resets the min-width property of the first rows cells to 0.
     * Causes a reload "effect"
     */
    resetTableSize() {
        this.cellSizes = [];
        for (let i = 0; i < 2 * Math.max(this.header.length, this.elements.length); i++) {
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
        if (this.headerTable.nativeElement === null) {
            return;
        }
        if (this.formStatus === FormStatus.TypingProperties) {
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
                if (cell.getAttribute('name') === 'spacer') {
                    this.cellSizes[j] = this.cellSpacing;
                } else if (!this.cellSizes[j] || this.cellSizes[j] < cell.getBoundingClientRect().width) {
                    this.cellSizes[j] = cell.getBoundingClientRect().width;
                }
            }
        }
        // this.resizeTableFrame();
        // Reset the headerdiv to body divs scroll.
        this.headerDiv.nativeElement.scrollLeft = this.bodyDiv.nativeElement.scrollLeft = 0;
        if (this.formStatus === FormStatus.TypingProperties) {
            this.typingDiv.nativeElement.scrollLeft = this.bodyDiv.nativeElement.scrollLeft;
        }
    }

    bodyScroll() {
        let scrollLeft = this.bodyDiv.nativeElement.scrollLeft;
        this.headerDiv.nativeElement.scrollLeft = scrollLeft;
        if (this.formStatus === FormStatus.TypingProperties) {
            this.typingDiv.nativeElement.scrollLeft = scrollLeft;
        }
    }

    headerScroll() {
        let scrollLeft = this.headerDiv.nativeElement.scrollLeft;
        this.bodyDiv.nativeElement.scrollLeft = scrollLeft;
        if (this.formStatus === FormStatus.TypingProperties) {
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
        if (this.formStatus === FormStatus.TypingProperties) {
            tableArr.push(this.typingTable.nativeElement);
        }
        let width = 0;
        for (let t of tableArr) {
            width = Math.max(width, t.clientWidth);
        }
        this.tableFrame.nativeElement.style.maxWidth = Math.min(window.innerWidth * 0.8 - 2 * 24, width) + 'px';
        this.tableFrame.nativeElement.style.minWidth = Math.min(window.innerWidth * 0.8 - 2 * 24, width) + 'px';
        // innerWidth * 0.8 = 80vw(max größe vom dialog) -24 ist padding von mat-dialog-content.
    }

    /**Resets table size and delays then.
     * After delay(so view can reload on resetted table column sizes) resizes table to maximum of every table.
     */
    resize() {
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
            this._changeDetectorRef.markForCheck();
        }, timeOut);
    }

    styleDict(i: number, isSpatial: boolean, isTemporal: boolean, head: boolean) {
        let j = this.untypedColumns.getValue().indexOf(i);
        if (isSpatial) {
            if (head) {
                return {orangeHead: j === 0, blueHead: j === 1 && !this.isWkt.getValue()};
            } else {
                return {orange: j === 0, blue: j === 1 && !this.isWkt.getValue()};
            }
        }
        if (isTemporal) {
            let c = this.isWkt.getValue() ? 1 : 0;
            if (head) {
                return {greenHead: j === 2 - c, violetHead: j === 3 - c};
            } else {
                return {green: j === 2 - c, violet: j === 3 - c};
            }
        }
        return {};
    }

    get notOnlyWhiteSpace(): boolean {
        for (let h of this.header) {
            if (h.value === '' || h.value === null || h.value === undefined) {
                return false;
            }
        }
        return true;
    }
}
