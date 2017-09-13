import {
    Component, ViewChild, ElementRef, ChangeDetectorRef, Input, AfterViewInit, EventEmitter,
    ChangeDetectionStrategy, OnInit, OnDestroy
} from '@angular/core';
import {MediaviewComponent} from '../mediaview/mediaview.component';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';
import {LayerService} from '../../layers/layer.service';
import {LoadingState} from '../../project/loading-state.model';
import {ResultTypes} from '../../operators/result-type.model';
import {VectorData, VectorLayer} from '../../layers/layer.model';
import {AbstractVectorSymbology} from '../../layers/symbology/symbology.model';
import {FeatureID} from '../../queries/geojson.model';
import {MapService} from '../../map/map.service';
import * as ol from 'openlayers';
import {ProjectService} from '../../project/project.service';
import {Unit} from '../../operators/unit.model';

interface FeatureData {
    id: number | string;
    properties: {[key: string]: string | number };
}
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
export class TableComponent implements OnInit, OnDestroy, AfterViewInit {

    /*@HostListener('scroll', ['$event']) private onScroll($event:Event):void {
     //if($event.target){
     this.scrollTopBefore = this.scrollTop;
     this.scrollLeftBefore = this.scrollLeft;

     this.scrollTop = $event.target['scrollTop'];
     this.scrollLeft = $event.target['scrollLeft'];
     //console.log($event.target['scrollLeft'], $event.target['scrollTop']);
     //}
     this.updateScroll();
     };*/

    public LoadingState = LoadingState;

    @Input()
    public height: number;

    /**
     * Input: Data to display in the table
     */
    // @Input()
    public data: Array<any>;

    /**
     * Output: Is emitted when the row-selection changes. The selected rows are emitted
     * @type {EventEmitter}
     */
    // @Output()
    private rowsSelected: EventEmitter<Array<number>> = new EventEmitter();


    // Data-Subsets
    public dataHead: Array<string>;
    public dataHeadUnits: Array<string>;
    private testData: Array<any>;

    // For row-selection
    public selected: boolean[];
    private selectedRowsList: Array<number>;
    public allSelected: boolean;
    public allEqual: boolean;

    // Element-References
    @ViewChild('scrollContainer') public container: ElementRef;
    /*
     @ViewChild('scrollContainerContent') table:ElementRef;
     @ViewChild('tableHead') tableHead:ElementRef;
     @ViewChild('tableBody') tableBody:ElementRef;
     @ViewChildren('tableElements') tableElements:QueryList<ElementRef>;
     */

    // For text-width-calculation
    private styleString = '16px Roboto, sans-serif';
    private oneLineMaxWidth = 300;
    private canvas;


    public avgWidths: number[];
    public colTypes: string[];

    // For virtual scrolling
    public scrollTop = 0;
    public  scrollLeft = 0;

    private scrollTopBefore = 0;
    private scrollLeftBefore = 0;

    private elementHeight = 42;


    public displayItemCount = 40;
    // private displayOffsetMax = 10;
    private displayOffsetMin = 5;

    public displayItemCounter: number[];

    public firstDisplay: number;
    // private lastDisplay: number;

    private scrolling = false;


    private cdr;
    public layerService;

    public loading = false;

    // Observables
    public data$: Observable<Array<ol.Feature>>;
    public state$: Observable<LoadingState>;

    public offsetTop$: Observable<number>;
    public offsetBottom$: Observable<number>;

    private selectable$: Observable<boolean>;
    private dataSubscription: Subscription;
    private featureSubscription: Subscription;


    /**
     * Returns all the keys of an object as array
     * @param object the object containing the keys
     * @returns {string[]} a string-array containing all the keys
     */
    private static getArrayOfKeys(object) {
        return Object.keys(object).filter(x => !(x.startsWith('___') || x === 'geometry'));
    }


    /**
     * Checks if the given unit is the default unit. If so returns an empty string, if not returns the unit formated for the header
     * @param x the unit to display
     * @returns {string} the formated unit-string
     */
    private static printUnits(x: Unit) {
        if (x.unit !== Unit.defaultUnit.unit) {
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
                return {
                    id: x.getId(),
                    properties: x.getProperties(),
                };
            });

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

    ngOnDestroy() {
        this.dataSubscription.unsubscribe();
        this.featureSubscription.unsubscribe();
    }


    /**
     * Sets the loading-variable to show or hide a Loading-Spinner.
     * It is alway hidden, after the input-variable data has changed and the view is updated
     */
    /*public setLoading(loading) {
        this.loading = loading;
        // console.log("Loading:"+this.loading);
        this.cdr.markForCheck();
    }*/

    private initDataStream() {
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
                            const int = (x.getGeometry() as ol.geom.Point ).intersectsExtent(ve); //todo not only point
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
    private dataInit() {
        this.firstDisplay = 0;
        // this.lastDisplay = 15;

        this.container.nativeElement.scrollTop = 0;
        this.container.nativeElement.scrollLeft = 0;

        this.offsetTop$ = Observable.of(0);
        let offsetBottom = (this.data.length - this.displayItemCount) * this.elementHeight;
        if (offsetBottom < 0) {
            offsetBottom = 0;
        }
        this.offsetBottom$ = Observable.of(offsetBottom);


        // Reset selection
        this.selected = [];
        for (let i = 0; i < this.data.length; i++) {
            this.selected[i] = false;
        }

        // Get Header
        if (this.data.length > 0 && this.data[0]['properties']) {
            this.dataHead = TableComponent.getArrayOfKeys(this.data[0]['properties']);
        }

        if (this.layerService) {
            if (this.layerService.getSelectedLayer()) {
                let units = this.layerService.getSelectedLayer().operator.units;

                if (units) {
                    // console.log('1:' + this.dataHeadUnits);
                    this.dataHeadUnits = [];

                    for (let d in this.dataHead) {
                        if (this.dataHead.hasOwnProperty(d)) {
                            this.dataHeadUnits.push(this.dataHead[d] + TableComponent.printUnits(units.get(this.dataHead[d])));
                        }
                    }
                    // console.log('2:' + this.dataHeadUnits);
                }
            }
        }

        // Reset avg widths
        this.avgWidths = [];
        for (let i = 0; i < this.data.length; i++) {
            this.avgWidths[i] = 300;
        }

        // Calculate Column widths
        this.testData = this.selectRandomSubData(20);
        [this.avgWidths, this.colTypes] = this.calculateColumnProperties(this.testData, this.dataHead, this.dataHeadUnits);

        // Recreate displayItemCounter
        this.displayItemCounter = [];
        let i = 0;
        while (this.displayItemCounter.length < this.displayItemCount && this.displayItemCounter.length < this.data.length) {
            this.displayItemCounter.push(i);
            i++;
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
     */
    private getTextWidth(text, font) {
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
    private selectRandomSubData(number) {
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
    private calculateColumnProperties(testData, dataHead, dataHeadUnits) {

        let headCount = dataHead.length;

        let widths = [];
        let types = [];

        for (let column = 0; column < headCount; column++) {
            let columnWidth = 0;
            let columnType;

            // Header Row
            columnWidth = this.getTextWidth(dataHeadUnits[column], 'bold ' + this.styleString);

            columnType = 'text';

            for (let row = 0; row < testData.length; row++) {
                // Normal Table Rows
                let tmp = testData[row]['properties'][dataHead[column]];

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
            if (columnWidth > widths[column] || widths[column] == null) {
                widths[column] = columnWidth;
            }

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
    public updateScroll() {
        this.scrollTopBefore = this.scrollTop;
        this.scrollLeftBefore = this.scrollLeft;

        this.scrollTop = this.container.nativeElement.scrollTop;
        this.scrollLeft = this.container.nativeElement.scrollLeft;


        // console.log(this.scrollTopBefore+"->"+this.scrollTop);

        if (this.data != null && !this.scrolling) {
            this.scrolling = true;

            // let time1 = Math.floor(Date.now());

            // Scrolling down
            if (this.scrollTop > this.scrollTopBefore) {
                this.updateScrollDown();
            }

            // Scrolling up
            if (this.scrollTop < this.scrollTopBefore) {
                this.updateScrollUp();
            }

            // Scrolling right
            if (this.scrollLeft > this.scrollLeftBefore) {

            }

            // Scrolling left
            if (this.scrollLeft < this.scrollLeftBefore) {

            }

            // let time2 = Math.floor(Date.now());

            this.scrolling = false;

            // console.log("UpdateScroll: "+(time2-time1));
        }
    }


    /**
     * Virtual Scroll Update Function
     * Loads or unloads data of the Data-Table if necessary
     */
    private updateScrollDown() {
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

            this.offsetBottom$ = Observable.of((this.data.length - numberOfTopRows - this.displayItemCount) * this.elementHeight);
            // this.offsetBottom = (this.data.length - numberOfTopRows - this.displayItemCount) * this.elementHeight;
            this.offsetTop$ = Observable.of(numberOfTopRows * this.elementHeight);
            // this.offsetTop = numberOfTopRows * this.elementHeight;

            // this.offsetBottom - (this.offsetTop - newOffsetTop);
        }
    }

    /**
     * Virtual Scroll Update Function
     * Loads or unloads data of the Data-Table if necessary
     */
    private updateScrollUp() {
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

            this.offsetTop$ = Observable.of(numberOfTopRows * this.elementHeight);
            // this.offsetTop = numberOfTopRows * this.elementHeight;
            this.offsetBottom$ = Observable.of((this.data.length - numberOfTopRows - this.displayItemCount) * this.elementHeight);
            // this.offsetBottom = (this.data.length - numberOfTopRows - this.displayItemCount) * this.elementHeight;

        }
    }


    /**
     * Row-Selection
     * Called on clicking a checkbox to select a row
     * toggles the checked-variable for this row and runs the tests to check, whether all rows are selected or unselected
     */
    public toggle(index: number) {
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
    public toggleAll() {
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
        this.selectedRowsList = [];
        for (let i in this.selected) {
            if (this.selected.hasOwnProperty(i)) {
                this.allSelected = this.allSelected && this.selected[i];

                if (this.selected[i]) {
                    this.selectedRowsList.push(Number(i));
                }
            }
        }

        this.rowsSelected.emit(this.selectedRowsList);
        // console.log("allSelected:"+this.allSelected);
    }

    /**
     * Row-Selection
     * Tests, if all Rows are in equal state (all selected or all unselected) and sets the global allEqual variable
     */
    private testEqual(): void {
        this.allEqual = true;
        for (let s of this.selected) {
            this.allEqual = this.allEqual && (s === this.selected[0]);
        }
        // console.log("allEqual:"+this.allEqual);
    }

}
