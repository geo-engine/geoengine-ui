/**
 * Created by Julian Märte on 20.09.2016.
 */
import {Component, Input, OnInit, AfterViewInit, OnDestroy, ChangeDetectionStrategy} from '@angular/core';
import {BehaviorSubject, Subscription, Observable} from 'rxjs/Rx';
import {MdSlideToggleChange} from '@angular/material';

enum FormStatus { DataProperties, SpatialProperties, TemporalProperties, Loading }

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
    /**Spatial Properties
     * */
        // public isSpatialProperties:boolean; Laut Folie optional, nach Absprache nicht.
    public xCol: number;
    public yCol: number;
    public spatialRefSys: string/**:Typ Einfügen(Enum)*/;
    public coordForm: string/**:Typ Einfügen(Enum)*/;
    /**Temporal Properties
     * */
    public intervallType: string;
    /**:element of {[Start, +inf), [Start, End], [Start, Start+Duration], (-inf, End]}*/
    public startFormat: number;
    public startCol: number;
    public endFormat: number;
    public endCol: number;
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
export class CSVConfigComponent implements OnInit, OnDestroy, AfterViewInit {

    formStatus$: BehaviorSubject<FormStatus> = new BehaviorSubject<FormStatus>(FormStatus.Loading);
    isDataProperties$: Observable<boolean>;
    isSpatialProperties$: Observable<boolean>;
    isTemporalProperties$: Observable<boolean>;

    xyColumn$: BehaviorSubject<{x: number, y: number}> = new BehaviorSubject<{x: number, y: number}>({x: 0, y: 0});
    xColumn$ = this.xyColumn$.map(xy => xy.x);
    yColumn$ = this.xyColumn$.map(xy => xy.y);

    scrollBarWidth: number;

    resizeEvent$ = Observable.fromEvent(window, 'resize').map(() => {
        return document.documentElement.clientWidth;
    });

    private subscriptions: Array<Subscription> = [];

    delimitters: {def: string, value: string}[] = [{def: 'TAB', value: ' '}, {def: ',', value: ','}, {
        def: ';',
        value: ';'
    }];
    timeFormats: {value: string, duration: boolean}[] = [{
        value: 'yyyy-MM-ddTHH:mm:ssZ',
        duration: false
    }, {value: 'dd-MM-yyyy HH:mm:ss', duration: false}, {value: 's', duration: true}, {
        value: 'h',
        duration: true
    }, {value: 'd', duration: true}];
    intervallTypes: string[] = ['[Start,+inf)', '[Start, End]', '[Start, Start+Duration]', '(-inf, End]'];
    decsep: string[] = [',', '.'];
    texqual: string[] = ['"', '\''];
    projections: string[] = ['[EPSG:4326] WGS 84', '[EPSG:3857] WGS84 Web Mercator', '[SR-ORG:81] GEOS - GEOstationary Satellite'];
    coordFormats: string[] = ['Degrees Minutes Seconds', 'Degrees Decimal Minutes', 'Decimal Degrees'];

    @Input() data: {file: File, content: string, progress: number, configured: boolean};
    @Input() cellSpacing: number;
    @Input() linesToParse: number;

    customHeader: string[] = [];
    header: string[] = [];
    elements: string[][] = [];

    model: CSV;
    dialogTitle: string;

    constructor() {
        this.isDataProperties$ = this.formStatus$.map(status => status === FormStatus.DataProperties);
        this.isSpatialProperties$ = this.formStatus$.map(status => status === FormStatus.SpatialProperties);
        this.isTemporalProperties$ = this.formStatus$.map(status => status === FormStatus.TemporalProperties);
    }

    ngAfterViewInit() {
        this.resizeTable();
        this.scrollBarWidth = this.getScrollBarWidth();
        let headerdiv: HTMLElement = document.getElementById('headerdiv');
        headerdiv.style.marginRight = this.scrollBarWidth + 'px';
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
        this.model.spatialRefSys = this.projections[0];
        this.model.coordForm = this.coordFormats[0];
        this.model.intervallType = this.intervallTypes[0];
        this.model.startFormat = 0;
        this.model.startCol = 0;
        this.model.endFormat = 0;
        this.model.endCol = 0;

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
                    case FormStatus.Loading:
                    /* falls through */
                    default:
                        break;
                }
            }),
            this.resizeEvent$.subscribe(data => this.resizeTableFrame())
        );

        this.formStatus$.next(FormStatus.DataProperties);
        this.update(null);
        if (this.header.length > 1) {
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
                this.formStatus$.next(FormStatus.TemporalProperties);
        }
        this.update(null);
    }

    prev() {
        switch (this.formStatus$.getValue()) {
            case FormStatus.SpatialProperties:
                this.formStatus$.next(FormStatus.DataProperties);
                break;
            case FormStatus.TemporalProperties:
                this.formStatus$.next(FormStatus.SpatialProperties);
                break;
            default:
                this.formStatus$.next(FormStatus.DataProperties);
        }
        this.update(null);
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
    update(e: Event) {
        console.log('update');
        console.log(this.data);
        let lines: string[];
        if (this.model.isHeaderRow) {
            lines = [];
            // lines = this.data.content.split
            // ('\n', this.linesToParse+1 + this.model.headerRow).slice(0, this.linesToParse+1 + this.model.headerRow);
        } else {
            lines = this.data.content.split('\n', this.linesToParse);
        }
        this.elements = [];
        if (lines.length === 0) {
            return;
        }
        let start: number = this.model.headerRow + 1;
        if (this.model.isHeaderRow) {
            this.header = this.split(lines[start - 1]);
        } else {
            start = 0;
        }
        for (let i: number = start; i < lines.length; i++) {
            this.elements.push(this.split(lines[i]));
        }

        this.checkColumns();

        if (this.formStatus$.getValue() === FormStatus.SpatialProperties) {
            this.xyColumn$.next({x: this.model.xCol, y: this.model.yCol});
        } else if (this.formStatus$.getValue() === FormStatus.TemporalProperties) {
            this.xyColumn$.next({x: this.model.startCol, y: this.model.endCol});
        }
        if (e != null) {
            let srcElement = null;
            if (!e.srcElement) {
                srcElement = e.target;
            } else {
                srcElement = e.srcElement;
            }
            if (['delimitter', 'texqual', 'headerRowC'].indexOf(srcElement.id) !== -1) {
                this.resetTableSize();
                setTimeout(() => this.resizeTable());
            }
        }
    }

    /** Splits the given string line on each character, taken from user setting 'this.model.delimitter'.
     *  Optional the user can set a textQualifier, which are used to not interpret the delimitters in between.
     *
     * @param line string to split of.
     * @returns {string[]} an Array with the strings between the delimitters.
     */
    split(line: string): string[] {
        let result: string[] = [];
        let plainText = false;
        let last = 0;
        for (let j = 0; j < line.length; j++) {
            if (line.charCodeAt(j) === this.model.textQualifier.charCodeAt(0) && this.model.isTextQualifier) {
                plainText = !plainText;
                line = line.slice(0, j) + line.slice(j + 1);
            }
            if (line.charAt(j) === this.model.delimitter && !plainText) {
                result.push(line.slice(last, j));
                last = j + 1;
            }
        }
        if (last <= line.length - 1) {
            result.push(line.slice(last, line.length));
        }
        return result;
    }

    /** Some extra case checks, if the user changes some properties and old settings are still in model,
     * so it will get set to default or gets back to validated status.
     */
    checkColumns(): void {
        // Check if intervallType was changed, set the end time format to a valid time format then.
        if (this.timeFormats[this.model.endFormat].duration !== this.model.intervallType.indexOf('Duration') >= 0) {
            for (let i = 0; i < this.timeFormats.length; i++) {
                if (this.timeFormats[i].duration === this.model.intervallType.indexOf('Duration') >= 0) {
                    this.model.endFormat = i;
                    break;
                }
            }
        }

        if (!this.model.isHeaderRow && this.elements[0].length !== this.header.length) {
            this.header = new Array(this.elements[0].length);
            for (let i = 0; i < this.elements[0].length; i++) {
                this.header[i] = '';
            }
        }
        // Check if table was changed in a way, that the new header length
        // doesnt support the old x/y col. Change them if needed.
        if (!(this.header.length <= 1)) {
            if (this.model.xCol >= this.header.length) {
                if (this.model.yCol === this.header.length - 1) {
                    this.model.xCol = this.header.length - 2;
                } else {
                    this.model.xCol = this.header.length - 1;
                }
            }
            if (this.model.yCol >= this.header.length) {
                if (this.model.xCol === this.header.length - 1) {
                    this.model.yCol = this.header.length - 2;
                } else {
                    this.model.yCol = this.header.length - 1;
                }
            }
            // Check on an equality bug, fix it then.
            if (this.header.length > 1) {
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


        // Check if table got changed in a way that the new header length doesnt support the start/end col settings. Change them if needed.
        if (!(this.header.length <= 1)) {
            if (this.model.startCol >= this.header.length) {
                if (this.model.endCol === this.header.length - 1) {
                    this.model.startCol = this.header.length - 2;
                } else {
                    this.model.startCol = this.header.length - 1;
                }
            }
            if (this.model.endCol >= this.header.length) {
                if (this.model.startCol === this.header.length - 1) {
                    this.model.endCol = this.header.length - 2;
                } else {
                    this.model.endCol = this.header.length - 1;
                }
            }
            // If not necessary both are needed, its possible to set every header column to start or end col. On change to 'both needed' check if start col was set to end col und change if necessary.
            if (this.model.intervallType.indexOf('Start') >= 0 && (this.model.intervallType.indexOf('End') >= 0 || this.model.intervallType.indexOf('Duration') >= 0) && this.header.length > 1) {
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
            this.customHeader = new Array(this.header.length);
            for (let i = 0; i < this.header.length; i++) {
                this.customHeader[i] = this.header[i];
            }
        }
        this.model.isHeaderRow = e.checked;
        this.update(null);
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
                this.header[i] = this.customHeader[i];
            }
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
     * Causes a reload 'effect'
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
            for (let j = 0; j < x.item(i).rows[0].cells.length; j++) {
                x.item(i).rows[0].cells[j].style.minWidth = '0px';
            }
        }
    }

    /**Gets called on table property change with some delay, so the view can reload first.
     * Sets the min-width property of every tables first rows cells to the maximum of every tables first rows cells(Column-wise),
     * if table assigned to class 'resizeTable'.
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
            for (let j = 0; j < x.item(i).rows[0].cells.length; j++) {
                let cell = x.item(i).rows[0].cells[j];
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
            for (let j = 0; j < x.item(i).rows[0].cells.length; j++) {
                if (x.item(i).rows[0].cells[j].getAttribute('name') === 'spacer') {
                    continue;
                }
                x.item(i).rows[0].cells[j].style.minWidth = (maxCol[j]) + 'px';
            }
        }
        this.resizeTableFrame();
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
        document.getElementById('table-frame').style.maxWidth = Math.min(document.getElementById('table-frame').parentElement.clientWidth * 0.8, width) + 'px';
        document.getElementById('table-frame').style.minWidth = Math.min(document.getElementById('table-frame').parentElement.clientWidth * 0.8, width) + 'px';
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

    }

    get diagnostic() {
        return JSON.stringify(this.model);
    }
}
