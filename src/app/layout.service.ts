import {Injectable, Type} from '@angular/core';
import {BehaviorSubject, Observable, ReplaySubject, Subject} from 'rxjs/Rx';

import {PlotService} from '../plots/plot.service';

/**
 * Layout settings serialization format.
 */
export interface LayoutDict {
    layerListVisible: boolean;
    plotListVisible: boolean;
    dataTableVisible: boolean;
    headerTabIndex: number;
    footerTabIndex: number;
    dataTableHeightPercentage: number;
}

/**
 * The type of Browser.
 */
export enum Browser {
    FIREFOX, CHROME, SAFARI, OPERA, IE, EDGE,
}

// declarations for browser detection
declare const InstallTrigger: {};
declare const opr: {};

/**
 * A service that keeps track of app layouting options.
 */
@Injectable()
export class LayoutService {

    /**
     * Is the layer list visible?
     */
    private layerListVisible$: BehaviorSubject<boolean> = new BehaviorSubject(true);

    /**
     * Is the plot component visible?
     */
    private plotComponentVisible$: Observable<boolean>;

    /**
     * Is the plot list visible? If the plot component is not visible, this is uneffective.
     */
    private plotListVisible$: BehaviorSubject<boolean> = new BehaviorSubject(false);

    /**
     * Is the data table visible?
     */
    private dataTableVisible$: BehaviorSubject<boolean> = new BehaviorSubject(true);

    /**
     * What is the currently visible tab?
     */
    private headerTabIndex$: BehaviorSubject<number> = new BehaviorSubject(0);

    /**
     * What is the currently visible tab?
     */
    private footerTabIndex$: BehaviorSubject<number> = new BehaviorSubject(0);

    /**
     * What is the height of the data table as a percentage of the available space.
     */
    private dataTableHeightPercentage$: BehaviorSubject<number> = new BehaviorSubject(2 / 5);

    /**
     *  Sidenav content
     */
    private sidenavContentComponent$: Subject<any> = new ReplaySubject();


    /**
     * Store the detected browser.
     */
    private browser: Browser;

    constructor(
        private plotService: PlotService
    ) {
        // the component is visible iff there are plots.
        this.plotComponentVisible$ = this.plotService.getPlotsStream().map(
            plots => plots.length > 0
        );

        // if plots are empty, reset visibility to true (for the next time plots are inserted)
        this.plotComponentVisible$.filter(visible => visible === false)
                             .map(() => true)
                             .subscribe(this.plotListVisible$);

        this.browser = this.detectBrowser();
    }

    /**
     * Which component to show in the sidenav?
     */
    getSidenavContentComponentStream<C>(): Observable<Type<C>> {
        return this.sidenavContentComponent$;
    }

    /**
     * Set the new Component to show in the sidenav
     * @param component
     */
    setSidenavContentComponent(component: any){
        this.sidenavContentComponent$.next(component);
    }

    /**
     * Get the detected user browser
     * @returns the browser type
     */
    getBrowser(): Browser {
        return this.browser;
    }

    /**
     * Is the layer list visible in the component?
     */
    getLayerListVisibility(): boolean {
        return this.layerListVisible$.value;
    }

    /**
     * Is the layer list visible in the component?
     */
    getLayerListVisibilityStream(): Observable<boolean> {
        return this.layerListVisible$;
    }

    /**
     * Sets the visibility of the layer list.
     */
    setLayerListVisibility(visible: boolean) {
        this.layerListVisible$.next(visible);
    }

    /**
     * Toggles the visibility of the layer list.
     */
    toggleLayerListVisibility() {
        this.setLayerListVisibility(!this.layerListVisible$.value);
    }

    /**
     * Is the plot component visible?
     */
    getPlotComponentVisibilityStream(): Observable<boolean> {
        return this.plotComponentVisible$;
    }

    /**
     * Is the plot component visible?
     */
    getPlotComponentVisibility(): boolean {
        return this.plotService.getPlots().length > 0;
    }

    /**
     * Is the plot list visible in the component?
     */
    getPlotListVisibilityStream(): Observable<boolean> {
        return this.plotListVisible$;
    }

    /**
     * Is the plot list visible in the component?
     */
    getPlotListVisibility(): boolean {
        return this.plotListVisible$.value;
    }

    /**
     * Sets the visibility of the plot list.
     */
    setPlotListVisibility(visible: boolean) {
        // ignore this if there are currently no plots.
        if (this.plotService.getPlots().length > 0) {
            this.plotListVisible$.next(visible);
        }
    }

    /**
     * Toggles the visibility of the plot list.
     */
    togglePlotListVisibility() {
        this.setPlotListVisibility(!this.plotListVisible$.value);
    }

    /**
     * Is the data table visible?
     */
    getDataTableVisibilityStream(): Observable<boolean> {
        return this.dataTableVisible$;
    }

    /**
     * Is the data table visible?
     */
    getDataTableVisibility(): boolean {
        return this.dataTableVisible$.value;
    }

    /**
     * Sets the visibility of the data table.
     */
    setDataTableVisibility(visible: boolean) {
        this.dataTableVisible$.next(visible);
    }

    /**
     * Toggles the visibility of the data table.
     */
    toggleDataTableVisibility() {
        this.setDataTableVisibility(!this.dataTableVisible$.value);
    }

    /**
     * What is the curent tab index?
     */
    getHeaderTabIndexStream(): Observable<number> {
        return this.headerTabIndex$;
    }

    /**
     * What is the curent tab index?
     */
    getHeaderTabIndex(): number {
        return this.headerTabIndex$.value;
    }

    /**
     * Set the current tab index.
     */
    setHeaderTabIndex(index: number) {
        // ignore call if it is the same index.
        if (this.headerTabIndex$.value === index) {
            return;
        }

        if (index < 0) {
            index = 0; // repair index
        }

        this.headerTabIndex$.next(index);
    }

    /**
     * What is the curent tab index?
     */
    getFooterTabIndexStream(): Observable<number> {
        return this.footerTabIndex$;
    }

    /**
     * What is the curent tab index?
     */
    getFooterTabIndex(): number {
        return this.footerTabIndex$.value;
    }

    /**
     * Set the current tab index.
     */
    setFooterTabIndex(index: number) {
        // ignore call if it is the same index.
        if (this.footerTabIndex$.value === index) {
            return;
        }

        if (index < 0) {
            index = 0; // repair index
        }

        this.footerTabIndex$.next(index);
    }

    /**
     * Sets the percentage of the vertical viewport that the data table covers.
     */
    setDataTableHeightPercentage(percentage: number) {
        if (percentage < 0 || percentage > 1) {
            throw 'The data table percentage value must be between 0 and 1.';
        }

        this.dataTableHeightPercentage$.next(percentage);
    }

    /**
     * A notification observable that emits on component height relation changes.
     */
    getVerticalComponentRelationsChangedStream(): Observable<void> {
        return this.dataTableHeightPercentage$.mapTo(undefined);
    }

    /**
     * Calculate the height of the data table.
     */
    getDataTableHeight(totalAvailabeHeight: number): number {
        return this.calculateDataTableHeight(
            this.dataTableVisible$.value ? this.dataTableHeightPercentage$.value : 0,
            totalAvailabeHeight
        );
    }

    /**
     * Calculate the height of the data table.
     */
    getDataTableHeightStream(totalAvailabeHeight$: Observable<number>): Observable<number> {
        return Observable.combineLatest(
            this.dataTableHeightPercentage$,
            totalAvailabeHeight$,
            this.dataTableVisible$,
            (dataTableHeightPercentage, totalAvailabeHeight, dataTableVisible): number => {
                return this.calculateDataTableHeight(
                    dataTableVisible ? dataTableHeightPercentage : 0,
                    totalAvailabeHeight
                );
            }
        );
    }

    /**
     * Calculate the height of the map.
     */
    getMapHeight(totalAvailabeHeight: number): number {
        return this.calculateMapHeight(
            this.dataTableVisible$.value ? this.dataTableHeightPercentage$.value : 0,
            totalAvailabeHeight
        );
    }

    /**
     * Calculate the height of the data table.
     */
    getMapHeightStream(totalAvailabeHeight$: Observable<number>): Observable<number> {
        return Observable.combineLatest(
            this.dataTableHeightPercentage$,
            totalAvailabeHeight$,
            this.dataTableVisible$,
            (dataTableHeightPercentage, totalAvailabeHeight, dataTableVisible): number => {
                return this.calculateMapHeight(
                    dataTableVisible ? dataTableHeightPercentage : 0,
                    totalAvailabeHeight
                );
            }
        );
    }

    getLayoutDict(): LayoutDict {
        return {
            layerListVisible: this.getLayerListVisibility(),
            plotListVisible: this.getPlotListVisibility(),
            dataTableVisible: this.getDataTableVisibility(),
            headerTabIndex: this.getHeaderTabIndex(),
            footerTabIndex: this.getFooterTabIndex(),
            dataTableHeightPercentage: this.dataTableHeightPercentage$.value,
        };
    }

    getLayoutDictStream(): Observable<LayoutDict> {
        return Observable.combineLatest(
            this.layerListVisible$,
            this.plotListVisible$,
            this.dataTableVisible$,
            this.headerTabIndex$,
            this.footerTabIndex$,
            this.dataTableHeightPercentage$,
            (
                layerListVisible,
                plotListVisible,
                dataTableVisible,
                headerTabIndex,
                footerTabIndex,
                dataTableHeightPercentage
            ) => {
                return {
                    layerListVisible: layerListVisible,
                    plotListVisible: plotListVisible,
                    dataTableVisible: dataTableVisible,
                    headerTabIndex: headerTabIndex,
                    footerTabIndex: footerTabIndex,
                    dataTableHeightPercentage: dataTableHeightPercentage,
                };
            }
        );
    }

    setLayoutDict(dict: LayoutDict) {
        this.setLayerListVisibility(dict.layerListVisible);
        this.setPlotListVisibility(dict.plotListVisible);
        this.setDataTableVisibility(dict.dataTableVisible);
        this.setHeaderTabIndex(dict.headerTabIndex);
        this.setFooterTabIndex(dict.footerTabIndex);
        this.setDataTableHeightPercentage(dict.dataTableHeightPercentage);
    }

    /**
     * Calculate the height of the data table.
     */
    private calculateDataTableHeight(
        dataTableHeightPercentage: number, totalAvailabeHeight: number
    ): number {
        return Math.ceil(dataTableHeightPercentage * totalAvailabeHeight);
    }

    /**
     * Calculate the height of the map.
     */
    private calculateMapHeight(
        dataTableHeightPercentage: number, totalAvailabeHeight: number
    ): number {
        const dataTableHeight = this.calculateDataTableHeight(
            dataTableHeightPercentage, totalAvailabeHeight
        );
        return totalAvailabeHeight - dataTableHeight;
    }

    private detectBrowser(): Browser {
        interface ExtendedWindow extends Window {
            opr?: {};
            addons?: {};
            opera?: {};
            HTMLElement?: {};
            StyleMedia?: {};
            chrome?: {
                webstore?: {};
            };
        }
        interface ExtendedDocument extends Document {
            documentMode?: {};
        }
        const extendedWindow = window as ExtendedWindow;
        const extendedDocument = document as ExtendedDocument;

        // Opera 8.0+
        const isOpera = (!!extendedWindow['opr'] && !!extendedWindow['addons']) || !!extendedWindow['opera']
                        || navigator.userAgent.indexOf(' OPR/') >= 0;
        if (isOpera) {
            return Browser.OPERA;
        }
        // Firefox 1.0+
        const isFirefox = typeof InstallTrigger !== 'undefined';
        if (isFirefox) {
            return Browser.FIREFOX;
        }
        // At least Safari 3+: "[object HTMLElementConstructor]"
        const isSafari = Object.prototype.toString.call(
            extendedWindow['HTMLElement']
        ).indexOf('Constructor') > 0;
        if (isSafari) {
            return Browser.SAFARI;
        }
        // Internet Explorer 6-11
        const isIE = /*@cc_on!@*/false || !!extendedDocument['documentMode'];
        if (isIE) {
            return Browser.IE;
        }
        // Edge 20+
        const isEdge = !isIE && !!extendedWindow['StyleMedia'];
        if (isEdge) {
            return Browser.EDGE;
        }
        // Chrome 1+
        const isChrome = !!extendedWindow['chrome'] && !!extendedWindow['chrome'].webstore;
        if (isChrome) {
            return Browser.CHROME;
        }
    }

}
