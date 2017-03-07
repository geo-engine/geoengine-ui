"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/**
 * Created by Julian Märte on 20.09.2016.
 */
var core_1 = require('@angular/core');
var Rx_1 = require('rxjs/Rx');
var FormStatus;
(function (FormStatus) {
    FormStatus[FormStatus["DataProperties"] = 0] = "DataProperties";
    FormStatus[FormStatus["SpatialProperties"] = 1] = "SpatialProperties";
    FormStatus[FormStatus["TemporalProperties"] = 2] = "TemporalProperties";
    FormStatus[FormStatus["Loading"] = 3] = "Loading";
})(FormStatus || (FormStatus = {}));
var CSV = (function () {
    function CSV() {
    }
    return CSV;
}());
exports.CSV = CSV;
var CSVConfigComponent = (function () {
    function CSVConfigComponent() {
        this.formStatus$ = new Rx_1.BehaviorSubject(FormStatus.Loading);
        this.isDataProperties$ = this.formStatus$.map(function (status) { return status === FormStatus.DataProperties; });
        this.isSpatialProperties$ = this.formStatus$.map(function (status) { return status === FormStatus.SpatialProperties; });
        this.isTemporalProperties$ = this.formStatus$.map(function (status) { return status === FormStatus.TemporalProperties; });
        this.xyColumn$ = new Rx_1.BehaviorSubject({ x: 0, y: 0 });
        this.xColumn$ = this.xyColumn$.map(function (xy) { return xy.x; });
        this.yColumn$ = this.xyColumn$.map(function (xy) { return xy.y; });
        this.resizeEvent$ = Rx_1.Observable.fromEvent(window, 'resize').map(function () {
            return document.documentElement.clientWidth;
        });
        this.subscriptions = [];
        this.delimitters = [{ def: "TAB", value: " " }, { def: ",", value: "," }, {
                def: ";",
                value: ";"
            }];
        this.timeFormats = [{
                value: "yyyy-MM-ddTHH:mm:ssZ",
                duration: false
            }, { value: "dd-MM-yyyy HH:mm:ss", duration: false }, { value: "s", duration: true }, {
                value: "h",
                duration: true
            }, { value: "d", duration: true }];
        this.intervallTypes = ["[Start,+inf)", "[Start, End]", "[Start, Start+Duration]", "(-inf, End]"];
        this.decsep = [',', '.'];
        this.texqual = ['"', '\''];
        this.projections = ['[EPSG:4326] WGS 84', '[EPSG:3857] WGS84 Web Mercator', '[SR-ORG:81] GEOS - GEOstationary Satellite'];
        this.coordFormats = ['Degrees Minutes Seconds', 'Degrees Decimal Minutes', 'Decimal Degrees'];
        this.customHeader = [];
        this.header = [];
        this.elements = [];
    }
    CSVConfigComponent.prototype.ngAfterViewInit = function () {
        this.resizeTable();
        this.scrollBarWidth = this.getScrollBarWidth();
        var headerdiv = document.getElementById('headerdiv');
        headerdiv.style.marginRight = this.scrollBarWidth + 'px';
    };
    CSVConfigComponent.prototype.ngOnInit = function () {
        var _this = this;
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
        this.subscriptions.push(this.formStatus$.subscribe(function (status) {
            switch (status) {
                case FormStatus.DataProperties:
                    _this.dialogTitle = "Data Properties";
                    break;
                case FormStatus.SpatialProperties:
                    _this.dialogTitle = "Spatial Properties";
                    break;
                case FormStatus.TemporalProperties:
                    _this.dialogTitle = "Temporal Properties";
                    break;
                case FormStatus.Loading:
                /* falls through */
                default:
                    break;
            }
        }), this.resizeEvent$.subscribe(function (data) { return _this.resizeTableFrame(); }));
        this.formStatus$.next(FormStatus.DataProperties);
        this.update(null);
        if (this.header.length > 1) {
            this.model.yCol = 1;
            this.model.endCol = 1;
            this.xyColumn$.next({ x: this.model.xCol, y: this.model.yCol });
        }
    };
    CSVConfigComponent.prototype.next = function () {
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
    };
    CSVConfigComponent.prototype.prev = function () {
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
    };
    CSVConfigComponent.prototype.ngOnDestroy = function () {
        this.subscriptions.forEach(function (sub) { return sub.unsubscribe(); });
    };
    /**This method generates an number array containing all integers i with n <= i < m
     *
     * @param n lowest integer. !Warning: This integer is still contained in array.
     * @param m highest integer. !Warning: This integer is not contained in array.
     * @returns {number[]} Array {n,..,m-1}
     */
    CSVConfigComponent.prototype.range = function (n, m) {
        var res = [];
        for (var i = n; i < m; i++) {
            res.push(i);
        }
        return res;
    };
    CSVConfigComponent.prototype.ending = function (i) {
        if ((i - 1) % 10 === 0 && (i - 11) % 100 !== 0)
            return 'st';
        else if ((i - 2) % 10 === 0 && (i - 12) % 100 !== 0)
            return 'nd';
        else if ((i - 3) % 10 === 0 && (i - 13) % 100 !== 0)
            return 'rd';
        else
            return 'th';
    };
    /**Gets called every time, anything is changed. Checks if everything is valid and reloads the table
     * Probably should save last table properties and only reload table, if they got changed.
     */
    CSVConfigComponent.prototype.update = function (e) {
        var _this = this;
        console.log('update');
        console.log(this.data);
        var lines;
        if (this.model.isHeaderRow) {
            lines = [];
        }
        else {
            lines = this.data.content.split('\n', this.linesToParse);
        }
        this.elements = [];
        if (lines.length === 0) {
            return;
        }
        var start = this.model.headerRow + 1;
        if (this.model.isHeaderRow) {
            this.header = this.split(lines[start - 1]);
        }
        else {
            start = 0;
        }
        for (var i = start; i < lines.length; i++) {
            this.elements.push(this.split(lines[i]));
        }
        this.checkColumns();
        if (this.formStatus$.getValue() === FormStatus.SpatialProperties) {
            this.xyColumn$.next({ x: this.model.xCol, y: this.model.yCol });
        }
        else if (this.formStatus$.getValue() === FormStatus.TemporalProperties) {
            this.xyColumn$.next({ x: this.model.startCol, y: this.model.endCol });
        }
        if (e != null) {
            var srcElement;
            if (!e.srcElement) {
                srcElement = e.target;
            }
            else {
                srcElement = e.srcElement;
            }
            if (['delimitter', 'texqual', 'headerRowC'].indexOf(srcElement.id) !== -1) {
                this.resetTableSize();
                setTimeout(function () { return _this.resizeTable(); });
            }
        }
    };
    /** Splits the given string line on each character, taken from user setting "this.model.delimitter".
     *  Optional the user can set a textQualifier, which are used to not interpret the delimitters in between.
     *
     * @param line string to split of.
     * @returns {string[]} an Array with the strings between the delimitters.
     */
    CSVConfigComponent.prototype.split = function (line) {
        var result = [];
        var plainText = false;
        var last = 0;
        for (var j = 0; j < line.length; j++) {
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
    };
    /** Some extra case checks, if the user changes some properties and old settings are still in model,
     * so it will get set to default or gets back to validated status.
     */
    CSVConfigComponent.prototype.checkColumns = function () {
        //Check if intervallType was changed, set the end time format to a valid time format then.
        if (this.timeFormats[this.model.endFormat].duration !== this.model.intervallType.includes('Duration')) {
            for (var i = 0; i < this.timeFormats.length; i++) {
                if (this.timeFormats[i].duration === this.model.intervallType.includes('Duration')) {
                    this.model.endFormat = i;
                    break;
                }
            }
        }
        if (!this.model.isHeaderRow && this.elements[0].length !== this.header.length) {
            this.header = new Array(this.elements[0].length);
            for (var i = 0; i < this.elements[0].length; i++) {
                this.header[i] = '';
            }
        }
        //Check if table was changed in a way, that the new header length doesnt support the old x/y col. Change them if needed.
        if (!(this.header.length <= 1)) {
            if (this.model.xCol >= this.header.length) {
                if (this.model.yCol === this.header.length - 1) {
                    this.model.xCol = this.header.length - 2;
                }
                else
                    this.model.xCol = this.header.length - 1;
            }
            if (this.model.yCol >= this.header.length) {
                if (this.model.xCol === this.header.length - 1) {
                    this.model.yCol = this.header.length - 2;
                }
                else
                    this.model.yCol = this.header.length - 1;
            }
            //Check on an equality bug, fix it then.
            if (this.header.length > 1) {
                if (this.model.xCol === this.model.yCol) {
                    if (this.model.xCol === 0) {
                        this.model.yCol = this.model.xCol + 1;
                    }
                    else {
                        this.model.xCol = this.model.yCol - 1;
                    }
                }
            }
        }
        else
            this.model.xCol = this.model.yCol = 0;
        //Check if table got changed in a way that the new header length doesnt support the start/end col settings. Change them if needed.
        if (!(this.header.length <= 1)) {
            if (this.model.startCol >= this.header.length) {
                if (this.model.endCol === this.header.length - 1) {
                    this.model.startCol = this.header.length - 2;
                }
                else
                    this.model.startCol = this.header.length - 1;
            }
            if (this.model.endCol >= this.header.length) {
                if (this.model.startCol === this.header.length - 1) {
                    this.model.endCol = this.header.length - 2;
                }
                else
                    this.model.endCol = this.header.length - 1;
            }
            //If not necessary both are needed, its possible to set every header column to start or end col. On change to "both needed" check if start col was set to end col und change if necessary.
            if (this.model.intervallType.includes('Start') && (this.model.intervallType.includes('End') || this.model.intervallType.includes('Duration')) && this.header.length > 1) {
                if (this.model.startCol === this.model.endCol) {
                    if (this.model.startCol === 0) {
                        this.model.endCol = this.model.startCol + 1;
                    }
                    else {
                        this.model.startCol = this.model.endCol - 1;
                    }
                }
            }
        }
        else
            this.model.endCol = this.model.startCol = 0;
    };
    /**This method organizes the custom header saving, so the changes wont get discarded on change to load header.
     *
     * @param e Toggle event for change property
     */
    CSVConfigComponent.prototype.changeHeaderMode = function (e) {
        if (e.checked) {
            this.customHeader = new Array(this.header.length);
            for (var i = 0; i < this.header.length; i++) {
                this.customHeader[i] = this.header[i];
            }
        }
        this.model.isHeaderRow = e.checked;
        this.update(null);
        this.resize();
        if (this.customHeader.length === 0) {
            this.customHeader = new Array(this.elements[0].length);
            for (var i = 0; i < this.customHeader.length; i++) {
                this.customHeader[i] = '';
            }
        }
        if (!e.checked) {
            if (this.elements[0].length !== this.customHeader.length) {
                this.customHeader = new Array(this.elements[0].length);
                for (var i = 0; i < this.customHeader.length; i++) {
                    this.customHeader[i] = '';
                }
            }
            for (var i = 0; i < this.customHeader.length; i++) {
                this.header[i] = this.customHeader[i];
            }
        }
    };
    CSVConfigComponent.prototype.getScrollBarWidth = function () {
        var inner = document.createElement('p');
        inner.style.width = "100%";
        inner.style.height = "200px";
        var outer = document.createElement('div');
        outer.style.position = "absolute";
        outer.style.top = "0px";
        outer.style.left = "0px";
        outer.style.visibility = "hidden";
        outer.style.width = "200px";
        outer.style.height = "150px";
        outer.style.overflow = "hidden";
        outer.appendChild(inner);
        document.body.appendChild(outer);
        var width1 = inner.offsetWidth;
        outer.style.overflow = 'scroll';
        var width2 = inner.offsetWidth;
        if (width1 === width2)
            width2 = outer.clientWidth;
        document.body.removeChild(outer);
        return (width1 - width2);
    };
    ;
    /**Gets called on table property changes. Resets the min-width property of the first rows cells to 0.
     * Causes a reload "effect"
     */
    CSVConfigComponent.prototype.resetTableSize = function () {
        var x = document.getElementsByTagName('table');
        if (x.length === 0)
            return;
        for (var i = 0; i < x.length; i++) {
            if (!x.item(i).classList.contains('resizeTable') || x.item(i).rows.length === 0)
                continue;
            for (var j = 0; j < x.item(i).rows[0].cells.length; j++) {
                x.item(i).rows[0].cells[j].style.minWidth = '0px';
            }
        }
    };
    /**Gets called on table property change with some delay, so the view can reload first.
     * Sets the min-width property of every tables first rows cells to the maximum of every tables first rows cells(Column-wise),
     * if table assigned to class "resizeTable".
     */
    CSVConfigComponent.prototype.resizeTable = function () {
        var x = document.getElementsByTagName('table');
        if (x.length === 0)
            return;
        var maxCol = new Array(x.item(0).rows.length);
        for (var i = 0; i < x.length; i++) {
            if (!x.item(i).classList.contains('resizeTable') || x.item(i).rows.length === 0)
                continue;
            for (var j = 0; j < x.item(i).rows[0].cells.length; j++) {
                var cell = x.item(i).rows[0].cells[j];
                if (cell.getAttribute('name') === 'spacer') {
                    cell.style.minWidth = this.cellSpacing + 'px';
                    continue;
                }
                if (!maxCol[j] || maxCol[j] < cell.clientWidth) {
                    maxCol[j] = cell.clientWidth;
                }
            }
        }
        for (var i = 0; i < x.length; i++) {
            if (!x.item(i).classList.contains('resizeTable') || x.item(i).rows.length === 0)
                continue;
            x.item(i).style.borderCollapse = 'separate';
            for (var j = 0; j < x.item(i).rows[0].cells.length; j++) {
                if (x.item(i).rows[0].cells[j].getAttribute('name') === 'spacer')
                    continue;
                x.item(i).rows[0].cells[j].style.minWidth = (maxCol[j]) + 'px';
            }
        }
        this.resizeTableFrame();
    };
    /**Gets called on window size changes.
     * It brings the table container back to its initial 80%. This is a bug fix.
     */
    CSVConfigComponent.prototype.resizeTableFrame = function () {
        var x = document.getElementsByClassName('resizeTable');
        var width = 0;
        for (var i = 0; i < x.length; i++) {
            width = Math.max(width, x.item(i).clientWidth);
        }
        document.getElementById('table-frame').style.maxWidth = Math.min(document.getElementById('table-frame').parentElement.clientWidth * 0.8, width) + 'px';
        document.getElementById('table-frame').style.minWidth = Math.min(document.getElementById('table-frame').parentElement.clientWidth * 0.8, width) + 'px';
    };
    /**Resets table size and delays then. After delay(so view can reload on resetted table column sizes) resizes table to maximum of every table.
     */
    CSVConfigComponent.prototype.resize = function () {
        var _this = this;
        this.resetTableSize();
        setTimeout(function () { return _this.resizeTable(); });
    };
    /**Sends the data to the backend.
     *
     */
    CSVConfigComponent.prototype.submit = function () {
    };
    Object.defineProperty(CSVConfigComponent.prototype, "diagnostic", {
        get: function () {
            return JSON.stringify(this.model);
        },
        enumerable: true,
        configurable: true
    });
    __decorate([
        core_1.Input()
    ], CSVConfigComponent.prototype, "data");
    __decorate([
        core_1.Input()
    ], CSVConfigComponent.prototype, "cellSpacing");
    __decorate([
        core_1.Input()
    ], CSVConfigComponent.prototype, "linesToParse");
    CSVConfigComponent = __decorate([
        core_1.Component({
            selector: 'csv-config',
            templateUrl: 'csv-config-template.component.html',
            styleUrls: ['csv-config-styles-basic.component.css',
                'csv-config-styles-table-fixHeader.component.css',
                'csv-config-styles-table-form.component.css',
                'csv-config-styles-misc.component.css'],
            changeDetection: core_1.ChangeDetectionStrategy.OnPush
        })
    ], CSVConfigComponent);
    return CSVConfigComponent;
}());
exports.CSVConfigComponent = CSVConfigComponent;
//# sourceMappingURL=csv-config.component.js.map