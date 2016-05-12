import {Injectable} from 'angular2/core';
import {BehaviorSubject, Observable} from 'rxjs/Rx';

import {Plot} from './plot.model';

@Injectable()
export class PlotService {
    private plots$: BehaviorSubject<Array<Plot>> = new BehaviorSubject([]);

    private plotsVisible$: Observable<boolean>;
    private listVisible$: BehaviorSubject<boolean> = new BehaviorSubject(false);

    constructor() {
        this.plotsVisible$ = this.plots$.map(plots => plots.length > 0);

        // if plots are empty set visibility to true for new plots
        this.plotsVisible$.filter(visible => visible === false)
                          .map(() => true)
                          .subscribe(this.listVisible$);
    }

    /**
     * @returns The plot list.
     */
    getPlots(): Array<Plot> {
        return this.plots$.getValue();
    }

    /**
     * @returns The stream of the plot list.
     */
    getPlotsStream(): Observable<Array<Plot>> {
        return this.plots$;
    }

    /**
     * Insert a new array of plots. Resets the selected plot.
     * @param plots The plot list.
     */
    setPlots(plots: Array<Plot>) {
        this.plots$.next(plots);
    }

    /**
     * Adds a plot on top of the plot list.
     * @param plot The new plot.
     */
    addPlot(plot: Plot) {
       let plots = this.plots$.getValue();
       this.setPlots([plot, ...plots]);
    }

    /**
     * Removes a plot from the list.
     * @param plot The plot to remove.
     */
    removePlot(plot: Plot) {
        let plots = this.plots$.getValue();
        let index = plots.indexOf(plot);

        if (index >= 0) {
            plots.splice(index, 1);
            this.setPlots(plots);
        }
    }

    /**
     * Remove all plots.
     */
    clearPlots() {
        this.plots$.next([]);
    }

    /**
     * Changes the display name of a plot.
     * @param plot The plot to modify
     * @param newName The new layer name
     */
    changePlotName(plot: Plot, newName: string) {
      plot.name = newName;
      this.plots$.next(this.getPlots());
    }

    /**
     * Is the plot component visible?
     */
    getPlotsVisibleStream(): Observable<boolean> {
        return this.plotsVisible$;
    }

    /**
     * Is the plot list visible in the component?
     */
    getPlotListVisibleStream(): Observable<boolean> {
        return this.listVisible$;
    }

    /**
     * Sets the visibility of the plot list.
     */
    setPlotListVisibility(visible: boolean) {
        if (this.plots$.value.length > 0) {
            this.listVisible$.next(visible);
        }
    }

    /**
     * Toggles the visibility of the plot list.
     */
    togglePlotListVisibility() {
        this.setPlotListVisibility(!this.listVisible$.value);
    }
}
