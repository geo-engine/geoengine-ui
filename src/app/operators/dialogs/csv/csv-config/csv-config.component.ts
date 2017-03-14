import {
    Component,
    Input,
    Output,
    OnInit,
    AfterViewInit,
    OnDestroy,
    ChangeDetectionStrategy,
    EventEmitter
} from '@angular/core';
import {BehaviorSubject, Subscription, Observable} from 'rxjs/Rx';
import {MdSlideToggleChange} from '@angular/material';
import * as Papa from 'papaparse';
import {Projections, Projection} from '../../../projection.model';

enum FormStatus { DataProperties, SpatialProperties, TemporalProperties, TypingProperties, Loading }

export class CSV {
    public layerName: string;
    /**Data Properties
     * */
    public delimitter: string;
    public decimalSeperator: string;
    public isTextQualifier: boolean;
    public textQualifier: string;
    public isHeaderRow: boolean;
    public headerRow: number;
    header: Array<string>;
    /**Spatial Properties
     * */
        // public isSpatialProperties:boolean; Laut Folie optional, nach Absprache nicht.
    public xCol: number;
    public yCol: number;
    public spatialRefSys: Projection/**:Typ Einfügen(Enum)*/;
    public coordForm: string/**:Typ Einfügen(Enum)*/;
    /**Temporal Properties
     * */
    public intervalType: string;
    /**:element of {[Start, +inf), [Start, End], [Start, Start+Duration], (-inf, End]}*/
    public startFormat: string;
    public startCol: number;
    public endFormat: string;
    public endCol: number;

    public content: string;
    public isNumberArr: boolean[];
}

@Component({
    selector: 'wave-csv-config',
    templateUrl: 'csv-config-template.component.html',
    styleUrls: ['csv-config-styles-basic.component.css',
        'csv-config-styles-table-fixHeader.component.css',
        'csv-config-styles-table-form.component.css',
        'csv-config-styles-misc.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CsvConfigComponent implements OnInit, OnDestroy, AfterViewInit {

    Projections = Projections;

    formStatus$: BehaviorSubject<FormStatus> = new BehaviorSubject<FormStatus>(FormStatus.Loading);
    isDataProperties$: Observable<boolean>;
    isSpatialProperties$: Observable<boolean>;
    isTemporalProperties$: Observable<boolean>;
    isTypingProperties$: Observable<boolean>;

    parsedData: Array<Array<string>>;

    xyColumn$: BehaviorSubject<{x: number, y: number}> = new BehaviorSubject<{x: number, y: number}>({x: 0, y: 0});
    xColumn$: Observable<number>;
    yColumn$: Observable<number>;

    scrollBarWidth: number;

    resizeEvent$ = Observable.fromEvent(window, 'resize').map(() => {
        return document.documentElement.clientWidth;
    });

    private subscriptions: Array<Subscription> = [];

    delimitters: {def: string, value: string}[] = [
        {def: 'TAB', value: '\t'},
        {def: 'COMMA', value: ','},
        {def: 'SEMICOLON', value: ';'}
    ];

    // http://man7.org/linux/man-pages/man3/strptime.3.html
    timeFormats: Array<{display: string, value: string}> = [
        {display: 'yyyy-MM-ddTHH:mm:ssZ', value: '%Y-%m-%dT%H:%M:%SZ'},
        {display: 'yyyy-MM-ddTHH:mmZ', value: '%Y-%m-%dT%H:%MZ'},
        {display: 'dd-MM-yyyy HH:mm:ss', value: '%d-%m-%Y %H:%M:%S'},
        {display: 'dd.MM.yyyy HH:mm:ss', value: '%d.%m.%Y %H:%M:%S'},
        {display: 'dd.MM.yyyy', value: '%d.%m.%Y'},
        {display: 'yyyy-MM-dd', value: '%Y-%m-%d'},
    ];
    durationFormats: Array<{display: string, value: string}> = [
        {display: 'days', value: 'd'},
        {display: 'hours', value: 'h'},
        {display: 'seconds', value: 's'},
    ];
    intervalTypes: Array<{display: string, value: string}> = [
        {display: 'no time', value: 'none'},
        {display: '[Start,+inf)', value: 'start+inf'},
        {display: '[Start, End]', value: 'start+end'},
        {display: '[Start, Start+Duration]', value: 'start+duration'},
    ];

    decsep: string[] = [',', '.'];
    texqual: string[] = ['"', '\''];
    coordFormats: string[] = ['Degrees Minutes Seconds', 'Degrees Decimal Minutes', 'Decimal Degrees'];

    @Input() data: {file: File, content: string, progress: number, configured: boolean};
    @Input() cellSpacing: number;
    @Input() linesToParse: number;
    @Output() finish: EventEmitter<CSV> = new EventEmitter<CSV>();

    customHeader: string[] = [];
    elements: string[][] = [];

    model: CSV;
    dialogTitle: string;

    constructor() {
        this.xColumn$ = this.xyColumn$.map(xy => xy.x);
        this.yColumn$ = this.xyColumn$.map(xy => xy.y);
        this.isDataProperties$ = this.formStatus$.map(status => status === FormStatus.DataProperties);
        this.isSpatialProperties$ = this.formStatus$.map(status => status === FormStatus.SpatialProperties);
        this.isTemporalProperties$ = this.formStatus$.map(status => status === FormStatus.TemporalProperties);
        this.isTypingProperties$ = this.formStatus$.map(status => status === FormStatus.TypingProperties);
    }

    ngAfterViewInit() {
        this.resizeTable();
        this.scrollBarWidth = this.getScrollBarWidth();
        let headerdiv: HTMLElement = document.getElementById('headerdiv');
        headerdiv.style.marginRight = this.scrollBarWidth + 'px';
        this.update(true);
    }

    ngOnInit() {
        this.model = new CSV();

        this.model.layerName = this.data.file.name;
        this.model.delimitter = this.delimitters[1].value;
        this.model.decimalSeperator = this.decsep[1];
        this.model.isTextQualifier = false;
        this.model.textQualifier = this.texqual[0];
        this.model.isHeaderRow = true;
        this.model.headerRow = 0;
        this.model.xCol = 0;
        this.model.yCol = 0;
        this.model.spatialRefSys = Projections.WGS_84;
        this.model.coordForm = this.coordFormats[0];
        this.model.intervalType = this.intervalTypes[0].value;
        this.model.startFormat = this.timeFormats[0].value;
        this.model.startCol = 0;
        this.model.endFormat = this.timeFormats[0].value;
        this.model.endCol = 0;
        this.model.content = this.data.content;
        this.model.isNumberArr = [];

        this.subscriptions.push(
            this.formStatus$.subscribe(status => {
                switch (status) {
                    case FormStatus.DataProperties:
                        this.dialogTitle = 'Data Properties';
                        break;
                    case FormStatus.SpatialProperties:
                        this.dialogTitle = 'Spatial Properties';
                        break;
                    case FormStatus.TemporalProperties:
                        this.dialogTitle = 'Temporal Properties';
                        break;
                    case FormStatus.TypingProperties:
                        this.dialogTitle = 'Typing Properties';
                        break;
                    case FormStatus.Loading:
                    /* falls through */
                    default:
                        break;
                }
            }),
            this.resizeEvent$.subscribe(data => this.resizeTableFrame())
        );

        this.formStatus$.next(FormStatus.DataProperties);
        this.update(true);
        if (this.model.header.length > 1) {
            this.model.yCol = 1;
            this.model.endCol = 1;
            this.xyColumn$.next({x: this.model.xCol, y: this.model.yCol});
        }
    }

    next() {
        switch (this.formStatus$.getValue()) {
            case FormStatus.DataProperties:
                this.formStatus$.next(FormStatus.SpatialProperties);
                break;
            case FormStatus.SpatialProperties:
                this.formStatus$.next(FormStatus.TemporalProperties);
                break;
            default:
                this.formStatus$.next(FormStatus.TypingProperties);
                this.resize();
        }
        this.update(false);
        if (this.formStatus$.getValue() === FormStatus.TypingProperties) {
            this.scrollBarWidth = this.getScrollBarWidth();
            setTimeout(() => document.getElementById('typingdiv').style.marginRight = this.scrollBarWidth + 'px');
        }
    }

    prev() {
        switch (this.formStatus$.getValue()) {
            case FormStatus.TemporalProperties:
                this.formStatus$.next(FormStatus.SpatialProperties);
                break;
            case FormStatus.TypingProperties:
                this.formStatus$.next(FormStatus.TemporalProperties);
                break;
            default:
                this.formStatus$.next(FormStatus.DataProperties);
        }
        this.update(false);
    }

    ngOnDestroy() {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    /**This method generates an number array containing all integers i with n <= i < m
     *
     * @param n lowest integer. !Warning: This integer is still contained in array.
     * @param m highest integer. !Warning: This integer is not contained in array.
     * @returns {number[]} Array {n,..,m-1}
     */
    range(n: number, m: number): number[] {
        let res: number[] = [];
        for (let i: number = n; i < m; i++) {
            res.push(i);
        }
        return res;
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

    /**Gets called every time, anything is changed. Checks if everything is valid and reloads the table
     * Probably should save last table properties and only reload table, if they got changed.
     */
    update(reparse: boolean) {
        if (reparse) {
            this.parsedData = this.parse();
            if (this.model.isHeaderRow) {
                this.model.header = this.parsedData[this.model.headerRow];
                this.elements = this.parsedData.slice(this.model.headerRow + 1,
                    this.model.headerRow + this.linesToParse + 1);
            } else {
                this.elements = this.parsedData;
            }
            if (!this.model.header || !this.elements) {
                console.log('to large data');
            }
            this.resetNumberArr();
        }

        this.checkColumns();

        if (this.formStatus$.getValue() === FormStatus.SpatialProperties) {
            this.xyColumn$.next({x: this.model.xCol, y: this.model.yCol});
        } else if (this.formStatus$.getValue() === FormStatus.TemporalProperties) {
            this.xyColumn$.next({x: this.model.startCol, y: this.model.endCol});
        }

        if (reparse) {
            this.resetTableSize();
            setTimeout(() => this.resizeTable());
        }
    }

    parse() {
        let textQualifier: string = this.model.isTextQualifier ? this.model.textQualifier : null;
        let prev: number = this.model.isHeaderRow ? this.model.headerRow + this.linesToParse + 1 : this.linesToParse;
        return Papa.parse(this.data.content as string, {
            delimiter: this.model.delimitter,
            newline: '',
            quoteChar: textQualifier,
            header: false,
            skipEmptyLines: true,
            preview: prev,
        } as any).data;

    }

    bodyScroll() {
        let scrollLeft = document.getElementById('bodydiv').scrollLeft;
        document.getElementById('headerdiv').scrollLeft = scrollLeft;
        if (this.formStatus$.getValue() === FormStatus.TypingProperties) {
            document.getElementById('typingdiv').scrollLeft = scrollLeft;
        }
    }

    /** Some extra case checks, if the user changes some properties and old settings are still in model,
     * so it will get set to default or gets back to validated status.
     */
    checkColumns(): void {
        // Check if intervalType was changed, set the end time format to a valid time format then.
        if (this.durationFormats.map(format => format.value).indexOf(this.model.endFormat) < 0
            && this.model.intervalType.indexOf('duration') >= 0) {
            this.model.endFormat = this.durationFormats[0].value;
        }
        if (this.durationFormats.map(format => format.value).indexOf(this.model.endFormat) >= 0
            && this.model.intervalType.indexOf('duration') < 0) {
            this.model.endFormat = this.timeFormats[0].value;
        }

        if (!this.model.isHeaderRow && this.elements[0].length !== this.model.header.length) {
            this.model.header = new Array(this.elements[0].length);
            for (let i = 0; i < this.elements[0].length; i++) {
                this.model.header[i] = '';
            }
        }
        // Check if table was changed in a way, that the new header
        // length doesnt support the old x/y col. Change them if needed.
        if (!(this.model.header.length <= 1)) {
            if (this.model.xCol >= this.model.header.length) {
                if (this.model.yCol === this.model.header.length - 1) {
                    this.model.xCol = this.model.header.length - 2;
                } else {
                    this.model.xCol = this.model.header.length - 1;
                }
            }
            if (this.model.yCol >= this.model.header.length) {
                if (this.model.xCol === this.model.header.length - 1) {
                    this.model.yCol = this.model.header.length - 2;
                } else {
                    this.model.yCol = this.model.header.length - 1;
                }
            }
            // Check on an equality bug, fix it then.
            if (this.model.header.length > 1) {
                if (this.model.xCol === this.model.yCol) {
                    if (this.model.xCol === 0) {
                        this.model.yCol = this.model.xCol + 1;
                    } else {
                        this.model.xCol = this.model.yCol - 1;
                    }
                }
            }
        } else {
            this.model.xCol = this.model.yCol = 0;
        }


        // Check if table got changed in a way that the new header length doesnt
        // support the start/end col settings. Change them if needed.
        if (!(this.model.header.length <= 1)) {
            if (this.model.startCol >= this.model.header.length) {
                if (this.model.endCol === this.model.header.length - 1) {
                    this.model.startCol = this.model.header.length - 2;
                } else {
                    this.model.startCol = this.model.header.length - 1;
                }
            }
            if (this.model.endCol >= this.model.header.length) {
                if (this.model.startCol === this.model.header.length - 1) {
                    this.model.endCol = this.model.header.length - 2;
                } else {
                    this.model.endCol = this.model.header.length - 1;
                }
            }
            // If not necessary both are needed, its possible to set every header column to start or end col.
            // On change to "both needed" check if start col was set to end col und change if necessary.
            if (this.model.intervalType.indexOf('Start') >= 0 && (this.model.intervalType.indexOf('End') >= 0
                || this.model.intervalType.indexOf('Duration') >= 0) && this.model.header.length > 1) {
                if (this.model.startCol === this.model.endCol) {
                    if (this.model.startCol === 0) {
                        this.model.endCol = this.model.startCol + 1;
                    } else {
                        this.model.startCol = this.model.endCol - 1;
                    }
                }
            }
        } else {
            this.model.endCol = this.model.startCol = 0;
        }
    }

    /**This method organizes the custom header saving, so the changes wont get discarded on change to load header.
     *
     * @param e Toggle event for change property
     */
    changeHeaderMode(e: MdSlideToggleChange): void {
        if (e.checked) {
            this.customHeader = new Array(this.model.header.length);
            for (let i = 0; i < this.model.header.length; i++) {
                this.customHeader[i] = this.model.header[i];
            }
        }
        this.model.isHeaderRow = e.checked;
        this.update(true);
        this.resize();
        if (this.customHeader.length === 0) {
            this.customHeader = new Array(this.elements[0].length);
            for (let i = 0; i < this.customHeader.length; i++) {
                this.customHeader[i] = '';
            }
        }
        if (!e.checked) {
            if (this.elements[0].length !== this.customHeader.length) {
                this.customHeader = new Array(this.elements[0].length);
                for (let i = 0; i < this.customHeader.length; i++) {
                    this.customHeader[i] = '';
                }
            }
            for (let i = 0; i < this.customHeader.length; i++) {
                this.model.header[i] = this.customHeader[i];
            }
        }
    }

    resetNumberArr() {
        this.model.isNumberArr = [];
        for (let i = 0; i < this.model.header.length; i++) {
            this.model.isNumberArr.push(false);
        }
    }

    getScrollBarWidth() {
        let inner = document.createElement('p');
        inner.style.width = '100%';
        inner.style.height = '200px';

        let outer = document.createElement('div');
        outer.style.position = 'absolute';
        outer.style.top = '0px';
        outer.style.left = '0px';
        outer.style.visibility = 'hidden';
        outer.style.width = '200px';
        outer.style.height = '150px';
        outer.style.overflow = 'hidden';
        outer.appendChild(inner);

        document.body.appendChild(outer);
        let width1 = inner.offsetWidth;
        outer.style.overflow = 'scroll';
        let width2 = inner.offsetWidth;
        if (width1 === width2) {
            width2 = outer.clientWidth;
        }

        document.body.removeChild(outer);

        return (width1 - width2);
    };

    /**Gets called on table property changes. Resets the min-width property of the first rows cells to 0.
     * Causes a reload "effect"
     */
    resetTableSize() {
        let x = document.getElementsByTagName('table');
        if (x.length === 0) {
            return;
        }

        for (let i = 0; i < x.length; i++) {
            if (!x.item(i).classList.contains('resizeTable') || x.item(i).rows.length === 0) {
                continue;
            }
            for (let j = 0; j < x.item(i).rows.item(0).cells.length; j++) {
                x.item(i).rows.item(0).cells.item(j).style.minWidth = '0px';
            }
        }
    }

    /**Gets called on table property change with some delay, so the view can reload first.
     * Sets the min-width property of every tables first rows cells to the maximum
     * of every tables first rows cells(Column-wise),
     * if table assigned to class "resizeTable".
     */
    resizeTable() {
        let x = document.getElementsByTagName('table');
        if (x.length === 0) {
            return;
        }
        let maxCol: number[] = new Array(x.item(0).rows.length);

        for (let i = 0; i < x.length; i++) {
            if (!x.item(i).classList.contains('resizeTable') || x.item(i).rows.length === 0) {
                continue;
            }
            for (let j = 0; j < x.item(i).rows.item(0).cells.length; j++) {
                let cell = x.item(i).rows.item(0).cells.item(j);
                if (cell.getAttribute('name') === 'spacer') {
                    cell.style.minWidth = this.cellSpacing + 'px';
                    continue;
                }
                if (!maxCol[j] || maxCol[j] < cell.clientWidth) {
                    maxCol[j] = cell.clientWidth;
                }
            }
        }

        for (let i = 0; i < x.length; i++) {
            if (!x.item(i).classList.contains('resizeTable') || x.item(i).rows.length === 0) {
                continue;
            }
            x.item(i).style.borderCollapse = 'separate';
            for (let j = 0; j < x.item(i).rows.item(0).cells.length; j++) {
                if (x.item(i).rows.item(0).cells.item(j).getAttribute('name') === 'spacer') {
                    continue;
                }
                x.item(i).rows.item(0).cells.item(j).style.minWidth = (maxCol[j]) + 'px';
                x.item(i).rows.item(0).cells.item(j).style.maxWidth = (maxCol[j]) + 'px';
            }
        }
        this.resizeTableFrame();
        // Reset the headerdiv to body divs scroll.
        document.getElementById('headerdiv').scrollLeft = document.getElementById('bodydiv').scrollLeft;
        if (this.formStatus$.getValue() === FormStatus.TypingProperties) {
            document.getElementById('typingdiv').scrollLeft = document.getElementById('bodydiv').scrollLeft;
        }
    }

    /**Gets called on window size changes.
     * It brings the table container back to its initial 80%. This is a bug fix.
     */
    resizeTableFrame() {
        let x = document.getElementsByClassName('resizeTable');
        let width = 0;
        for (let i = 0; i < x.length; i++) {
            width = Math.max(width, x.item(i).clientWidth);
        }
        document.getElementById('table-frame').style.maxWidth = Math.min(window.innerWidth * 0.8 * 0.8, width) + 'px';
        document.getElementById('table-frame').style.minWidth = Math.min(window.innerWidth * 0.8 * 0.8, width) + 'px';
    }

    /**Resets table size and delays then.
     * After delay(so view can reload on resetted table column sizes) resizes table to maximum of every table.
     */
    resize() {
        this.resetTableSize();
        setTimeout(() => this.resizeTable());
    }

    /**Sends the data to the backend.
     *
     */
    submit() {
        this.model.content = this.data.content;
        this.finish.emit(this.model);
    }

    get typedCols(): number[] {
        let arr: number[] = [
            this.model.xCol,
            this.model.yCol
        ];
        if (this.model.intervalType.indexOf('End') >= 0 || this.model.intervalType.indexOf('Duration') >= 0) {
            arr.push(this.model.endCol);
        }
        if (this.model.intervalType.indexOf('Start') >= 0) {
            arr.push(this.model.startCol);
        }
        return arr;
    }
}
