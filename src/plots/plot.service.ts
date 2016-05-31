import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs/Rx';

import {Plot, PlotDict} from './plot.model';

import {MappingQueryService} from '../services/mapping-query.service';
import {ProjectService} from '../project/project.service';

/**
 * A service for managing plots.
 */
@Injectable()
export class PlotService {
    private plots$: BehaviorSubject<Array<Plot>> = new BehaviorSubject([]);

    constructor(
        private projectService: ProjectService,
        private mappingQueryService: MappingQueryService
    ) {}

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
     * Create the plot type and initialize the callbacks.
     */
    createPlotFromDict(dict: PlotDict): Plot {
        return Plot.fromDict(
            dict,
            operator => this.mappingQueryService.getPlotDataStream(operator)
        );
    }

}
