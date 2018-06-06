import {
    Component, ViewChild, ElementRef, ChangeDetectorRef, Input, AfterViewInit,
    ChangeDetectionStrategy, OnInit, OnDestroy, OnChanges, SimpleChanges
} from '@angular/core';
import {DataSource} from '@angular/cdk/collections';
import {MediaviewComponent} from '../mediaview/mediaview.component';
import {Observable, BehaviorSubject, Subscription} from 'rxjs';
import {LayerService} from '../../layers/layer.service';
import {LoadingState} from '../../project/loading-state.model';
import {ResultTypes} from '../../operators/result-type.model';
import {VectorData, VectorLayer} from '../../layers/layer.model';
import {AbstractVectorSymbology} from '../../layers/symbology/symbology.model';
import {FeatureID} from '../../queries/geojson.model';
import {MapService} from '../../map/map.service';
import ol from 'ol';
import {ProjectService} from '../../project/project.service';
import {Unit} from '../../operators/unit.model';


/**
 * Data-Table-Component
 * Displays a Data-Table
 */
@Component({
    selector: 'wave-datatable',
    templateUrl: './table.component.html',
    styleUrls: ['table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Data-Table-Component
 * Displays a Data-Table
 */
export class TableComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {

    public LoadingState = LoadingState;

    @Input()
    public height: number;

    // Data and Data-Subsets
    public data: Array<any>;
    public tableData: TableDataSource;
    public dataHead: Array<string>;
    public tableDataHead: Array<string>;
    public dataHeadUnits: Array<string>;

    // For row-selection
    // private rowsSelected: EventEmitter<Array<number>> = new EventEmitter();
    public selected: boolean[];
    // private selectedRowsList: Array<number>;
    public allSelected: boolean;
    public allEqual: boolean;

    // Element-References
    @ViewChild('scrollContainer') public container: ElementRef;

    // For text-width-calculation
    private styleString = '16px Roboto, sans-serif';
    private styleStringHead = '12px Roboto, sans-serif';
    private columnMinWidth = 100;
    private columnMaxWidth = 400;
    private canvas;


    public avgWidths: number[];
    public colTypes: string[];

    // For virtual scrolling
    public scrollTop = 0;
    public scrollLeft = 0;

    private scrollTopBefore = 0;
    // private scrollLeftBefore = 0;

    private elementHeight = 41;
    private headerHeight = 41;


    private minDisplayItemCount = 6;
    public displayItemCount = this.minDisplayItemCount;
    // private displayOffsetMax = 10;
    private displayOffsetMin = 1;

    public displayItemCounter: number[];

    public firstDisplay: number;
    // private lastDisplay: number;

    private scrolling = false;


    private cdr;
    public layerService;

    // Observables
    public data$: Observable<Array<ol.Feature>>;
    public state$: Observable<LoadingState>;

    public offsetTop$: BehaviorSubject<number>;
    public offsetBottom$: BehaviorSubject<number>;

    private selectable$: Observable<boolean>;
    private dataSubscription: Subscription;
    private featureSubscription: Subscription;


    /**
     * Returns all the keys of an object as array
     * @param object the object containing the keys
     * @returns {string[]} a string-array containing all the keys
     */
    private static getArrayOfKeys(object: {[key: string]: any}): Array<string> {
        return Object
            .keys(object)
            .filter(x => !(x.startsWith('___') || x === 'geometry'));
    }


    /**
     * Checks if the given unit is the default unit. If so returns an empty string, if not returns the unit formated for the header
     * @param x the unit to display
     * @returns {string} the formated unit-string
     */
    private static formatUnits(x: Unit): string {
        if (x && x.unit !== Unit.defaultUnit.unit) {
            return ' [' + x.unit + ']';
        } else {
            return '';
        }
    }

    /**
     * Sets up all variables
     * Extracts the column names from the data input and calculates the average widths of all rows
     * @param cdr ChangeDetector Reference
     * @param layerService LayerService Reference
     * @param mapService MapService Reference
     * @param projectService ProjectService Reference
     */
    constructor(cdr: ChangeDetectorRef,
                layerService: LayerService,
                private mapService: MapService,
                private projectService: ProjectService) {
        this.cdr = cdr;
        this.layerService = layerService;

        this.canvas = document.createElement('canvas');

        this.initDataStream();
    }

    ngOnInit() {
        this.dataSubscription = this.data$.subscribe((features: Array<ol.Feature>) => {
            this.dataHead = [];
            this.dataHeadUnits = [];
            this.data = [];

            this.data = features.map(x => {
                /*let properties = x.getProperties();
                properties['id'] = x.getId();
                return properties;*/
                return {
                    id: x.getId(),
                    properties: x.getProperties()
                };
            });

            if (this.height / this.elementHeight > this.minDisplayItemCount) {
                this.displayItemCount = Math.ceil(1.5 * this.height / this.elementHeight);
            }

            // console.log(this.data);

            // only needs to be called once for each "data"
            this.dataInit();

            this.cdr.markForCheck();
        });
    }

    /**
     * Get the height of the container and save it to variable
     */
    ngAfterViewInit() {
        /*this.styleString = window.getComputedStyle(this.container.nativeElement).fontSize + ' ' +
            window.getComputedStyle(this.container.nativeElement).getPropertyValue('font-family');*/

        this.featureSubscription = this.layerService.getSelectedFeaturesStream().subscribe(x => {

            for (let i = 0; i < this.data.length; i++) {
                const selectedContainsId = x.selected.contains(this.data[i].id);
                if (!this.selected[i] && selectedContainsId) {

                    this.container.nativeElement.scrollTop = i * this.elementHeight;
                }

                this.selected[i] = selectedContainsId;
            }

            this.testSelected();
            this.testEqual();

            this.cdr.markForCheck();
        });
    }

    ngOnChanges(changes: SimpleChanges) {

        if (this.height / this.elementHeight > this.minDisplayItemCount) {
            this.displayItemCount = Math.ceil(1.5 * this.height / this.elementHeight);
        }
    }

    ngOnDestroy() {
        this.dataSubscription.unsubscribe();
        this.featureSubscription.unsubscribe();
    }

    private initDataStream(): void {
        const dataStream = this.layerService.getSelectedLayerStream().map(layer => {
            if (layer === undefined) {
                return {
                    data$: Observable.of([]),
                    state$: Observable.of(LoadingState.OK),
                    selectable: false,
                };
            }
            switch (layer.operator.resultType) {
                case ResultTypes.POINTS:
                case ResultTypes.LINES:
                case ResultTypes.POLYGONS:
                    let vectorLayer = layer as VectorLayer<AbstractVectorSymbology>;
                    let vectorLayerData = this.projectService.getLayerDataStream(vectorLayer) as Observable<VectorData>;

                    const data = Observable.combineLatest(
                        vectorLayerData, this.mapService.getViewportSizeStream()).map(([d, v]) => {
                        return d.data.filter(x => {
                            const xe = x.getGeometry().getExtent();
                            const ve = v.extent;
                            const int = (x.getGeometry() as ol.geom.Point ).intersectsExtent(ve); // todo not only point
                            // console.log(ve, x.getGeometry(), int);
                            return int;
                        });
                        // return d;
                    });
                    return {
                        data$: data,
                        dataExtent$: vectorLayerData.map(x => x.extent),
                        state$: this.projectService.getLayerDataStatusStream(vectorLayer),
                        // reload$: this.projectService.,
                        selectable: true,
                    };
                default:
                    return {
                        data$: Observable.of([]),
                        state$: Observable.of(LoadingState.OK),
                        selectable: false,
                    };
            }
        });

        this.data$ = dataStream.switchMap(stream => stream.data$);
        this.state$ = dataStream.switchMap(stream => stream.state$);
        this.selectable$ = dataStream.map(stream => stream.selectable);
    }


    /**
     * Called when the input-variable data has changed
     * Resets and recalculates all variables needed for displaying data in the table, virtual scrolling and selection
     */
    private dataInit(): void {
        this.firstDisplay = 0;
        // this.lastDisplay = 15;

        this.tableData = new TableDataSource(this.data, this.firstDisplay, this.displayItemCount);

        this.container.nativeElement.scrollTop = 0;
        this.container.nativeElement.scrollLeft = 0;

        this.offsetTop$ = new BehaviorSubject(0);
        let offsetBottom = (this.data.length - this.displayItemCount) * this.elementHeight;
        if (offsetBottom < 0) {
            offsetBottom = 0;
        }
        this.offsetBottom$ = new BehaviorSubject(offsetBottom);

        // Reset selection
        this.selected = [];
        for (let i = 0; i < this.data.length; i++) {
            this.selected[i] = false;
        }

        // Get Header
        if (this.data.length > 0 && this.data[0].properties) {
            this.dataHead = TableComponent.getArrayOfKeys(this.data[0].properties);
            this.tableDataHead = ['selection', ...this.dataHead];
        }

        // console.log(this.dataHead);
        if (this.layerService) {
            if (this.layerService.getSelectedLayer()) {
                let units = this.layerService.getSelectedLayer().operator.units;

                if (units) {
                    this.dataHeadUnits = [];

                    for (let d in this.dataHead) {
                        if (this.dataHead.hasOwnProperty(d)) {
                            this.dataHeadUnits.push(this.dataHead[d] + TableComponent.formatUnits(units.get(this.dataHead[d])));
                        }
                    }
                }
            }
        }

        // Reset avg widths
        this.avgWidths = [];
        for (let i = 0; i < this.data.length; i++) {
            this.avgWidths[i] = this.columnMinWidth;
        }

        // Calculate Column widths
        const testData = this.selectRandomSubData(20);
        [this.avgWidths, this.colTypes] = this.calculateColumnProperties(testData, this.dataHead, this.dataHeadUnits);

        /*console.log('--------------------------------');
        console.log(testData);
        console.log(this.avgWidths);*/

        // Recreate displayItemCounter
        this.displayItemCounter = [];
        let j = 0;
        while (this.displayItemCounter.length < this.displayItemCount && this.displayItemCounter.length < this.data.length) {
            this.displayItemCounter.push(j);
            j++;
        }

        // Test for Selections
        this.testSelected();
        this.testEqual();
    }

    /**
     * Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
     *
     * @param {String} text The text to be rendered.
     * @param {String} font The css font descriptor that text is to be rendered with (e.g. "bold 14px verdana").
     * @returns {number} the calculated width
     */
    private getTextWidth(text, font): number {
        // re-use canvas object for better performance
        let context = this.canvas.getContext('2d');
        context.font = font;
        let metrics = context.measureText(text);
        // console.log(metrics);
        return metrics.width;
    }

    /**
     * Selects a given number of random rows from the main dataset
     * @param number amount of rows to select
     * @returns {Array} an array of rows from the dataset
     */
    private selectRandomSubData(number): Array<any> {
        let testData = [];

        for (let i = 0; i < number; i++) {
            let r = Math.floor(Math.random() * this.data.length);

            testData[i] = this.data[r];
        }

        return testData;
    }

    /**
     * Calculates the average column-text-widths of a given dataset. Also includes the header-texts to make shure they also fit
     * Tests for the contents of the sample-data to predict the content type of each column
     * @param testData the dataset, to calculate column widths from
     * @param dataHead the column names of the given dataset
     * @param dataHeadUnits the column names of the given dataset (with units)
     * @returns ({Array},{Array}) an array of average-widths and an array with the predicted content types
     */
    private calculateColumnProperties(testData, dataHead, dataHeadUnits): [number[], string[]] {

        let headCount = dataHead.length;

        let widths = [];
        let types = [];

        for (let column = 0; column < headCount; column++) {
            let columnWidth = 0;
            let columnType;

            // Header Row
            columnWidth = this.getTextWidth(dataHeadUnits[column], this.styleStringHead);

            columnType = 'text';

            for (let row = 0; row < testData.length; row++) {
                // Normal Table Rows
                let tmp = testData[row].properties[dataHead[column]];

                // console.log(tmp);

                if (typeof tmp === 'string' && tmp !== '') {
                    let urls = tmp.split(/(,)/g);

                    let mediaCount = [0, 0, 0];
                    let nonUrlsString = '';

                    for (let u in urls) {
                        if (urls.hasOwnProperty(u)) {
                            let mediaType = MediaviewComponent.getType(urls[u]);

                            if (mediaType !== '') {
                                if (mediaType === 'text') {
                                    nonUrlsString += urls[u] + ' ';
                                } else {
                                    if (mediaType === 'image') {
                                        mediaCount[0] += 1;
                                    } else if (mediaType === 'audio') {
                                        mediaCount[1] += 1;
                                    } else if (mediaType === 'video') {
                                        mediaCount[2] += 1;
                                    }

                                    columnType = 'media';
                                }

                            }
                        }
                    }

                    let mediaString = '';

                    if (mediaCount[0] > 0) {
                        mediaString += '___ ' + mediaCount[0] + ' images';
                    }
                    if (mediaCount[1] > 0) {
                        mediaString += '___ ' + mediaCount[1] + ' audio-files';
                    }
                    if (mediaCount[2] > 0) {
                        mediaString += '___ ' + mediaCount[2] + ' videos';
                    }

                    mediaString += ' ' + nonUrlsString;

                    // console.log(mediaString);

                    columnWidth = Math.max(columnWidth, this.getTextWidth(mediaString, this.styleString));
                }
            }

            // Widths
            if (columnWidth > this.columnMaxWidth) {
                columnWidth = this.columnMaxWidth;
            }
            widths[column] = columnWidth;

            // Types
            types[column] = columnType;
        }

        return ([widths, types]);
    }

    /**
     * Checks whether a given text is too wide for the column with given id
     * @param text the text for the column
     * @param colID the ID of the column to test for
     * @returns {boolean} true, if the text is too wide for the column, false otherwise
     */

    /*public textTooWideForColumn(text, colID) {
        let w = this.getTextWidth(text, this.styleString);
        if (w > this.oneLineMaxWidth) {
            w = w / 2 + 50;
        }
        // console.log(w > this.avgWidths[colID]);
        return w > this.avgWidths[colID];
    }*/

    /**
     * Called on Scrolling the Data-Table
     * Updates the auto-scrolling first row and first column and calls the virtual-scroll update functions (top and bottom)
     */
    public updateScroll(): void {
        this.scrollTopBefore = this.scrollTop;
        // this.scrollLeftBefore = this.scrollLeft;

        this.scrollTop = this.container.nativeElement.scrollTop;
        this.scrollLeft = this.container.nativeElement.scrollLeft;
        // console.log(this.scrollTopBefore+"->"+this.scrollTop);

        if (this.data != null && !this.scrolling) {
            this.scrolling = true;

            let numberOfTopRows;

            // Scrolling down
            if (this.scrollTop > this.scrollTopBefore) {
                if (this.scrollTop + this.height >
                    this.headerHeight + (this.firstDisplay + this.displayItemCount - this.displayOffsetMin) * this.elementHeight) {

                    numberOfTopRows = Math.floor((this.scrollTop - this.headerHeight) / this.elementHeight) - this.displayOffsetMin;
                }
            }

            // Scrolling up
            if (this.scrollTop < this.scrollTopBefore) {
                if (this.scrollTop < this.headerHeight + (this.firstDisplay + this.displayOffsetMin) * this.elementHeight) {

                    numberOfTopRows = Math.floor((this.scrollTop + this.height) /
                        this.elementHeight) + this.displayOffsetMin - this.displayItemCount;
                }
            }

            if (typeof numberOfTopRows !== 'undefined') {

                if (numberOfTopRows + this.displayItemCount > this.data.length) {
                    numberOfTopRows = this.data.length - this.displayItemCount;
                }
                if (numberOfTopRows < 0) {
                    numberOfTopRows = 0;
                }

                if (this.firstDisplay !== numberOfTopRows) {

                    this.firstDisplay = numberOfTopRows;
                    this.tableData.update(this.data, this.firstDisplay, this.displayItemCount);

                    this.offsetBottom$.next((this.data.length - numberOfTopRows - this.displayItemCount) * this.elementHeight);
                    this.offsetTop$.next(numberOfTopRows * this.elementHeight);
                }
            }

            this.scrolling = false;
        }
    }


    /**
     * Virtual Scroll Update Function
     * Loads or unloads data of the Data-Table if necessary
     */
    /*private updateScrollDown() {
        let tableHeadHeight = this.elementHeight;

        // Scrolling down
        if (this.scrollTop + this.height >
            tableHeadHeight + (this.firstDisplay + this.displayItemCount - this.displayOffsetMin) * this.elementHeight) {

            let numberOfTopRows = Math.floor((this.scrollTop - tableHeadHeight) / this.elementHeight) - this.displayOffsetMin;

            if (numberOfTopRows + this.displayItemCount > this.data.length) {
                numberOfTopRows = this.data.length - this.displayItemCount;
            }
            if (numberOfTopRows < 0) {
                numberOfTopRows = 0;
            }


            this.firstDisplay = numberOfTopRows;
            this.tableData.update(this.data, this.firstDisplay, this.displayItemCount);

            this.offsetBottom$.next((this.data.length - numberOfTopRows - this.displayItemCount) * this.elementHeight);
            // this.offsetBottom = (this.data.length - numberOfTopRows - this.displayItemCount) * this.elementHeight;
            this.offsetTop$.next(numberOfTopRows * this.elementHeight);
            // this.offsetTop = numberOfTopRows * this.elementHeight;

            // this.offsetBottom - (this.offsetTop - newOffsetTop);
        }
    }*/

    /**
     * Virtual Scroll Update Function
     * Loads or unloads data of the Data-Table if necessary
     */
    /*private updateScrollUp() {
        let tableHeadHeight = this.elementHeight;

        // Scrolling up
        if (this.scrollTop < tableHeadHeight + (this.firstDisplay + this.displayOffsetMin) * this.elementHeight) {

            let numberOfTopRows = Math.floor((this.scrollTop + this.height) /
                this.elementHeight) + this.displayOffsetMin - this.displayItemCount;

            if (numberOfTopRows + this.displayItemCount > this.data.length) {
                numberOfTopRows = this.data.length - this.displayItemCount;
            }
            if (numberOfTopRows < 0) {
                numberOfTopRows = 0;
            }

            this.firstDisplay = numberOfTopRows;
            this.tableData.update(this.data, this.firstDisplay, this.displayItemCount);

            this.offsetTop$.next(numberOfTopRows * this.elementHeight);
            // this.offsetTop = numberOfTopRows * this.elementHeight;
            this.offsetBottom$.next((this.data.length - numberOfTopRows - this.displayItemCount) * this.elementHeight);
            // this.offsetBottom = (this.data.length - numberOfTopRows - this.displayItemCount) * this.elementHeight;

        }
    }*/


    /**
     * Row-Selection
     * Called on clicking a checkbox to select a row
     * toggles the checked-variable for this row and runs the tests to check, whether all rows are selected or unselected
     */
    public toggle(index: number): void {
        this.selected[index] = !this.selected[index];

        if (this.selected[index]) {
            this.layerService.updateSelectedFeatures([this.data[index].id], []);
        } else {
            this.layerService.updateSelectedFeatures([], [this.data[index].id]);
        }

        /*this.testSelected();
         this.testEqual();*/
    }

    /**
     * Row-Selection
     * Called when clicking the select-all-checkbox
     * Selects or unselects all rows, depending on whether a row is already selected
     */
    public toggleAll(): void {
        let toggledList = Array<FeatureID>();
        for (let i = 0; i < this.selected.length; i++) {
            if (this.allSelected === this.selected[i]) {
                toggledList.push(this.data[i].id);
            }

            this.selected[i] = !this.allSelected;
        }

        if (!this.allSelected) {
            this.layerService.updateSelectedFeatures(toggledList, []);
        } else {
            this.layerService.updateSelectedFeatures([], toggledList);
        }

        /*this.testSelected();
         this.testEqual(); */
    }

    /**
     * Row-Selection
     * Tests, if all Rows are selected and sets the global allSelected variable
     * Also emits the row-selection-event
     */
    private testSelected(): void {
        this.allSelected = true;
        // this.selectedRowsList = [];
        for (let s of this.selected) {
            if (!s) {
                this.allSelected = false;
                break;
            }
            // this.allSelected = this.allSelected && this.selected[i];

            /*if (this.selected[i]) {
				this.selectedRowsList.push(Number(i));
			}*/
        }

        // this.rowsSelected.emit(this.selectedRowsList);
    }

    /**
     * Row-Selection
     * Tests, if all Rows are in equal state (all selected or all unselected) and sets the global allEqual variable
     */
    private testEqual(): void {
        this.allEqual = true;
        for (let s of this.selected) {
            if (s !== this.selected[0]) {
                this.allEqual = false;
                break;
            }
            // this.allEqual = this.allEqual && (s === this.selected[0]);
        }
    }
}

export class TableDataSource extends DataSource<any> {

    private dataObs$: BehaviorSubject<Element[]>;

    constructor(data: Array<any>, start: number, length: number) {
        super();
        this.dataObs$ = new BehaviorSubject([]);
        this.update(data, start, length);
    }

    update(data: Array<any>, start: number, length: number): void {
        let slice = data.slice(start, start + length);
        let dataNew = [undefined, ...slice, undefined];
        // console.log(start, length);
        // console.log(this.data);
        this.dataObs$.next(dataNew);
    }

    /** Connect function called by the table to retrieve one stream containing the data to render. */
    connect(): Observable<Element[]> {
        return this.dataObs$.asObservable();
    }

    disconnect() {
    }
}
