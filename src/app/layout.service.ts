import {
    fromEvent as observableFromEvent, combineLatest as observableCombineLatest, BehaviorSubject, Observable, ReplaySubject, Subject
} from 'rxjs';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';

import {Injectable, Type} from '@angular/core';
import {Config} from './config.service';

/**
 * Layout settings serialization format.
 */
export interface LayoutDict {
    layerListVisible: boolean;
    layerDetailViewVisible: boolean;
    layerDetailViewTabIndex: number;
    layerDetailViewHeightPercentage: number;
}

export interface SidenavConfig {
    component: Type<any>;
    parent?: Type<any>;
    config?: { [key: string]: any };
}

/**
 * A service that keeps track of app layouting options.
 */
@Injectable()
export class LayoutService {

    private static _scrollbarWidthPx: number;

    /**
     * Is the layer list visible?
     */
    private layerListVisible$: BehaviorSubject<boolean> = new BehaviorSubject(true);

    /**
     * Is the data table visible?
     */
    private layerDetailViewVisible$: BehaviorSubject<boolean> = new BehaviorSubject(true);

    /**
     * What is the currently visible tab?
     */
    private layerDetailViewTabIndex$: BehaviorSubject<number> = new BehaviorSubject(0);

    /**
     * What is the height of the layer detail view as a percentage of the available space.
     */
    private layerDetailViewHeightPercentage$: BehaviorSubject<number> = new BehaviorSubject(2 / 5);

    /**
     *  Sidenav content
     */
    private sidenavContentComponent$: Subject<SidenavConfig> = new ReplaySubject(1);

    private sidenavContentMaxWidth$: Subject<number> = new ReplaySubject(1);

    constructor(private config: Config) {
        this.setupSidenavWidthStream();
    }

    static remInPx(): number {
        return parseFloat(getComputedStyle(document.documentElement).fontSize);
    }

    static scrollbarWidthPx() {
        if (!this._scrollbarWidthPx) {
            const outer = document.createElement('div');
            outer.style.visibility = 'hidden';
            outer.style.width = '100px';
            outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps

            document.body.appendChild(outer);

            const widthNoScroll = outer.offsetWidth;
            // force scrollbars
            outer.style.overflow = 'scroll';

            // add innerdiv
            const inner = document.createElement('div');
            inner.style.width = '100%';
            outer.appendChild(inner);

            const widthWithScroll = inner.offsetWidth;

            // remove divs
            outer.parentNode.removeChild(outer);

            this._scrollbarWidthPx = widthNoScroll - widthWithScroll;
        }

        return this._scrollbarWidthPx;
    }

    static getToolbarHeightPx(): number {
        const mobileLandscape = window.matchMedia('(max-width: 960px) and (orientation: landscape)').matches;
        if (mobileLandscape) {
            return 48;
        }

        const mobilePortrait = window.matchMedia('(max-width: 600px) and (orientation: portrait)').matches;
        if (mobilePortrait) {
            return 56;
        }

        return 64;
    }

    static getLayerDetailViewBarHeightPx(): number {
        const mobileLandscape = window.matchMedia('(max-width: 960px) and (orientation: landscape)').matches;
        if (mobileLandscape) {
            return 2 * LayoutService.remInPx();
        }

        const mobilePortrait = window.matchMedia('(max-width: 600px) and (orientation: portrait)').matches;
        if (mobilePortrait) {
            return 2.5 * LayoutService.remInPx();
        }

        const borderSizePx = 1;

        return 3 * LayoutService.remInPx() + borderSizePx;
    }

    /**
     * Calculate the height of the data table.
     */
    private static calculateLayerDetailViewHeight(layerDetailViewHeightPercentage: number, totalAvailableHeight: number): number {
        return Math.max(
            Math.ceil(layerDetailViewHeightPercentage * totalAvailableHeight),
            LayoutService.getLayerDetailViewBarHeightPx()
        );
    }

    /**
     * Calculate the height of the map.
     */
    private static calculateMapHeight(layerDetailViewHeightPercentage: number, totalAvailableHeight: number): number {
        const layerDetailViewHeight = LayoutService.calculateLayerDetailViewHeight(
            layerDetailViewHeightPercentage, totalAvailableHeight
        );
        return totalAvailableHeight - layerDetailViewHeight;
    }

    getSidenavWidthStream(): Observable<number> {
        return this.sidenavContentMaxWidth$;
    }

    /**
     * Which component to show in the sidenav?
     */
    getSidenavContentComponentStream(): Observable<SidenavConfig> {
        return this.sidenavContentComponent$.pipe(distinctUntilChanged());
    }

    /**
     * Set the new Component to show in the sidenav
     * @param sidenavConfig
     */
    setSidenavContentComponent(sidenavConfig: SidenavConfig) {
        this.sidenavContentComponent$.next(sidenavConfig);
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
     * Is the layer detail view visible?
     */
    getLayerDetailViewVisibilityStream(): Observable<boolean> {
        return this.layerDetailViewVisible$;
    }

    /**
     * Is the layer detail view visible?
     */
    getLayerDetailViewVisibility(): boolean {
        return this.layerDetailViewVisible$.value;
    }

    /**
     * Sets the visibility of the layer detail view.
     */
    setLayerDetailViewVisibility(visible: boolean) {

        this.layerDetailViewVisible$.next(visible);
    }

    /**
     * Toggles the visibility of the layer detail view.
     */
    toggleLayerDetailViewVisibility() {
        this.setLayerDetailViewVisibility(!this.layerDetailViewVisible$.value);
    }

    /**
     * What is the current tab index?
     */
    getLayerDetailViewTabIndexStream(): Observable<number> {
        return this.layerDetailViewTabIndex$;
    }

    /**
     * What is the current tab index?
     */
    getLayerDetailViewTabIndex(): number {
        return this.layerDetailViewTabIndex$.value;
    }

    /**
     * Set the current tab index.
     */
    setLayerDetailViewTabIndex(index: number) {
        // ignore call if it is the same index.
        if (this.layerDetailViewTabIndex$.value === index) {
            return;
        }

        if (index < 0) {
            index = 0; // repair index
        }

        this.layerDetailViewTabIndex$.next(index);
    }

    /**
     * Sets the percentage of the vertical viewport that the data table covers.
     */
    setLayerDetailViewHeightPercentage(percentage: number) {

        if (percentage < 0 || percentage > 1) {
            throw Error('The data table percentage value must be between 0 and 1.');
        }

        this.layerDetailViewHeightPercentage$.next(percentage);
    }

    /**
     * Calculate the height of the data table.
     */
    getLayerDetailViewHeight(totalAvailableHeight: number): number {
        return LayoutService.calculateLayerDetailViewHeight(
            this.layerDetailViewVisible$.value ? this.layerDetailViewHeightPercentage$.value : 0,
            totalAvailableHeight
        );
    }

    /**
     * Calculate the height of the data table.
     */
    getLayerDetailViewStream(totalAvailableHeight$: Observable<number>): Observable<number> {
        return observableCombineLatest(
            this.layerDetailViewHeightPercentage$,
            totalAvailableHeight$,
            this.layerDetailViewVisible$,
            (layerDetailViewHeightPercentage, totalAvailableHeight, layerDetailViewVisible): number => {

                return LayoutService.calculateLayerDetailViewHeight(
                    layerDetailViewVisible ? layerDetailViewHeightPercentage : 0,
                    totalAvailableHeight
                );
            }
        );
    }

    /**
     * Calculate the height of the map.
     */
    getMapHeight(totalAvailableHeight: number): number {
        return LayoutService.calculateMapHeight(
            this.layerDetailViewVisible$.value ? this.layerDetailViewHeightPercentage$.value : 0,
            totalAvailableHeight
        );
    }

    /**
     * Calculate the height of the data table.
     */
    getMapHeightStream(totalAvailableHeight$: Observable<number>): Observable<number> {
        return observableCombineLatest(
            this.layerDetailViewHeightPercentage$,
            totalAvailableHeight$,
            this.layerDetailViewVisible$,
            (layerDetailViewHeightPercentage, totalAvailableHeight, layerDetailViewVisible): number => {
                return LayoutService.calculateMapHeight(
                    layerDetailViewVisible ? layerDetailViewHeightPercentage : 0,
                    totalAvailableHeight
                );
            }
        );
    }

    getLayoutDict(): LayoutDict {
        return {
            layerListVisible: this.getLayerListVisibility(),
            layerDetailViewVisible: this.getLayerDetailViewVisibility(),
            layerDetailViewTabIndex: this.getLayerDetailViewTabIndex(),
            layerDetailViewHeightPercentage: this.layerDetailViewHeightPercentage$.getValue(),
        };
    }

    getLayoutDictStream(): Observable<LayoutDict> {
        return observableCombineLatest(
            this.layerListVisible$,
            this.layerDetailViewVisible$,
            this.layerDetailViewTabIndex$,
            this.layerDetailViewHeightPercentage$,
            (layerListVisible,
             layerDetailViewVisible,
             layerDetailViewTabIndex,
             layerDetailViewHeightPercentage) => {
                return {
                    layerListVisible: layerListVisible,
                    layerDetailViewVisible: layerDetailViewVisible,
                    layerDetailViewTabIndex: layerDetailViewTabIndex,
                    layerDetailViewHeightPercentage: layerDetailViewHeightPercentage,
                };
            }
        );
    }

    setLayoutDict(dict: LayoutDict) {
        if (dict.layerListVisible) {
            this.setLayerListVisibility(dict.layerListVisible);
        }
        if (dict.layerDetailViewVisible) {
            this.setLayerDetailViewVisibility(dict.layerDetailViewVisible);
        }
        if (dict.layerDetailViewTabIndex) {
            this.setLayerDetailViewTabIndex(dict.layerDetailViewTabIndex);
        }
        if (dict.layerDetailViewHeightPercentage) {
            this.setLayerDetailViewHeightPercentage(dict.layerDetailViewHeightPercentage);
        }
    }

    /**
     * Initialize and update the sidenav INNER width stream
     */
    private setupSidenavWidthStream() {
        function getWidth(): number {
            const sidenavComponent = document.getElementsByTagName('mat-sidenav')[0];
            const sidenavStyle = window.getComputedStyle(sidenavComponent);
            const widthString = sidenavStyle.width;

            if (widthString.indexOf('px') === (widthString.length - 2)) {
                return parseFloat(widthString.substr(0, widthString.length - 2)) - 4 * LayoutService.remInPx();
            } else {
                throw new Error('sidenav width must be a `px` value');
            }
        }

        // this timeout prevents calling the `getWidth` function before the DOM is initialized
        setTimeout(() => {
            observableFromEvent(window, 'resize').pipe(
                debounceTime(this.config.DELAYS.DEBOUNCE))
                .subscribe(() => {
                    this.sidenavContentMaxWidth$.next(getWidth());
                });

            this.sidenavContentMaxWidth$.next(getWidth());
        });
    }

}
