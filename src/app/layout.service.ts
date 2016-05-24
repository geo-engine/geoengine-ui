import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs/Rx';

import {PlotService} from '../plots/plot.service';

/**
 * Layout settings serialization format.
 */
export interface LayoutDict {
    layerListVisible: boolean;
    plotListVisible: boolean;
    dataTableVisible: boolean;
    tabIndex: number;
    dataTableHeightPercentage: number;
}

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
    private tabIndex$: BehaviorSubject<number> = new BehaviorSubject(0);

    /**
     * What is the height of the data table as a percentage of the available space.
     */
    private dataTableHeightPercentage$: BehaviorSubject<number> = new BehaviorSubject(2 / 5);

    constructor(
        private plotService: PlotService
    ) {
        // the component is visible iff there are plots.
        this.plotComponentVisible$ = this.plotService.getPlotsStream().map(
            plots => plots.length > 0
        );

        // if plots are empty, reset visibility to true (for the next time plots are inserted)
        this.plotListVisible$.filter(visible => visible === false)
                             .map(() => true)
                             .subscribe(this.plotListVisible$);
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
    getTabIndexStream(): Observable<number> {
        return this.tabIndex$;
    }

    /**
     * What is the curent tab index?
     */
    getTabIndex(): number {
        return this.tabIndex$.value;
    }

    /**
     * Set the current tab index.
     */
    setTabIndex(index: number) {
        // ignore call if it is the same index.
        if (this.tabIndex$.value === index) {
            return;
        }

        if (index < 0) {
            index = 0; // repair index
        }

        this.tabIndex$.next(index);
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
            tabIndex: this.getTabIndex(),
            dataTableHeightPercentage: this.dataTableHeightPercentage$.value,
        };
    }

    getLayoutDictStream(): Observable<LayoutDict> {
        return Observable.combineLatest(
            this.layerListVisible$,
            this.plotListVisible$,
            this.dataTableVisible$,
            this.tabIndex$,
            this.dataTableHeightPercentage$,
            (
                layerListVisible,
                plotListVisible,
                dataTableVisible,
                tabIndex,
                dataTableHeightPercentage
            ) => {
                return {
                    layerListVisible: layerListVisible,
                    plotListVisible: plotListVisible,
                    dataTableVisible: dataTableVisible,
                    tabIndex: tabIndex,
                    dataTableHeightPercentage: dataTableHeightPercentage,
                };
            }
        );
    }

    setLayoutDict(dict: LayoutDict) {
        this.setLayerListVisibility(dict.layerListVisible);
        this.setPlotListVisibility(dict.plotListVisible);
        this.setDataTableVisibility(dict.dataTableVisible);
        this.setTabIndex(dict.tabIndex);
        this.setDataTableHeightPercentage(dict.dataTableHeightPercentage);
    }

    /**
     * Calculate the height of the data table.
     */
    private calculateDataTableHeight(
        dataTableHeightPercentage: number, totalAvailabeHeight: number
    ): number {
        const DATA_TABLE_COLLAPSED_HEIGHT = 40;
        return Math.max(
            Math.ceil(dataTableHeightPercentage * totalAvailabeHeight),
            DATA_TABLE_COLLAPSED_HEIGHT
        );
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

}
