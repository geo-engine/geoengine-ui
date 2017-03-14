import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, ReplaySubject, Subscription, Observer, Subject} from 'rxjs/Rx';

import {Projections, Projection} from '../operators/projection.model';

import {Project} from './project.model';

import {Time, TimePoint} from '../time.model';
import * as moment from 'moment';
import {Config} from '../config.service';
import {Plot, PlotData} from '../plots/plot.model';
import {LoadingState} from './loading-state.model';
import {MappingQueryService} from '../../queries/mapping-query.service';
import {NotificationService} from '../notification.service';
import {Response} from '@angular/http';

@Injectable()
export class ProjectService {
    private project$: BehaviorSubject<Project>;
    private projection$: BehaviorSubject<Projection>;

    private time$: BehaviorSubject<Time>;

    private plots$: BehaviorSubject<Array<Plot>>;
    private plotData$: Map<Plot, ReplaySubject<PlotData>>;
    private plotDataState$: Map<Plot, ReplaySubject<LoadingState>>;
    private plotSubscriptions: Map<Plot, Subscription>;
    private newPlot$: Subject<void>;

    constructor(private config: Config,
                private notificationService: NotificationService,
                private mappingQueryService: MappingQueryService) {
        this.project$ = new BehaviorSubject(this.createDefaultProject());

        this.projection$ = new BehaviorSubject(this.project$.value.projection);
        this.time$ = new BehaviorSubject(this.project$.value.time);

        this.plots$ = new BehaviorSubject([]);
        this.plotData$ = new Map();
        this.plotDataState$ = new Map();
        this.plotSubscriptions = new Map();
        this.newPlot$ = new Subject<void>();

        this.project$.subscribe(project => {
            if (project.projection !== this.projection$.value) {
                this.projection$.next(project.projection);
            }
            if (!project.time.isSame(this.time$.value)) {
                this.time$.next(project.time);
            }
            if (project.plots !== this.plots$.getValue()) {
                this.plots$.next(project.plots);
            }
        });

    }

    createDefaultProject(): Project {
        return new Project({
            name: this.config.DEFAULTS.PROJECT.NAME,
            projection: Projections.fromCode(this.config.DEFAULTS.PROJECT.PROJECTION),
            time: new TimePoint(moment(this.config.DEFAULTS.PROJECT.TIME)),
        });
    }

    getProjectStream() {
        return this.project$;
    }

    getProject() {
        return this.project$.getValue();
    }

    setProject(project: Project) {
        this.clearPlots();
        this.project$.next(new Project({
            name: project.name,
            projection: project.projection,
            time: project.time,
            plots: [],
        }));
        for (const plot of project.plots.reverse()) {
            this.addPlot(plot, false);
        }
    }

    setTime(time: Time) {
        const oldTime = this.project$.getValue().time;
        if (time.isValid() && !time.isSame(oldTime)) {
            this.changeProjectConfig({
                time: time,
            });
        }
    }

    private changeProjectConfig(config: {name?: string, projection?: Projection, time?: Time, plots?: Array<Plot>}) {
        const project = this.project$.value;

        this.project$.next(new Project({
            name: config.name ? config.name : project.name,
            projection: config.projection ? config.projection : project.projection,
            time: config.time ? config.time : project.time,
            plots: config.plots ? config.plots : project.plots,
        }));
    }

    setName(name: string) {
        this.changeProjectConfig({name: name});
    }

    setProjection(projection: Projection) {
        this.changeProjectConfig({
            projection: projection
        });
    }

    getProjection(): Projection {
        return this.projection$.value;
    }

    getProjectionStream(): Observable<Projection> {
        return this.projection$;
    }

    getTimeStream(): Observable<Time> {
        return this.time$;
    }

    getTime(): Time {
        return this.time$.getValue();
    }

    /**
     * Add a plot to the project.
     * @param plot
     * @param notify
     */
    addPlot(plot: Plot, notify = true) {
        const loadingState$ = new ReplaySubject(1);
        const data$ = new ReplaySubject(1);

        const subscription = this.createPlotSubscription(plot, data$, loadingState$);

        this.plotSubscriptions.set(plot, subscription);

        const currentPlots = this.getProject().plots;
        this.changeProjectConfig({
            plots: [plot, ...currentPlots]
        });
        this.plotDataState$.set(plot, loadingState$);
        this.plotData$.set(plot, data$);

        if (notify) {
            this.newPlot$.next();
        }
    }

    /**
     * Remove a plot from the project.
     * @param plot
     */
    removePlot(plot: Plot) {
        const plots = this.getProject().plots;
        const plotIndex = plots.indexOf(plot);
        if (plotIndex >= 0) {
            plots.splice(plotIndex, 1);
            this.changeProjectConfig({
                plots: plots
            });

            this.plotSubscriptions.get(plot).unsubscribe();
            this.plotSubscriptions.delete(plot);

            this.plotDataState$.get(plot).complete();
            this.plotDataState$.delete(plot);

            this.plotData$.get(plot).complete();
            this.plotData$.delete(plot);
        }
    }

    /**
     * Reload the data for the plot manually (e.g. on error).
     * @param plot
     */
    reloadPlot(plot: Plot) {
        this.plotData$.get(plot).next(undefined); // send empty data

        this.plotSubscriptions.get(plot).unsubscribe();
        this.plotSubscriptions.delete(plot);

        const loadingState$ = this.plotDataState$.get(plot);

        const subscription = this.createPlotSubscription(plot, this.plotData$.get(plot), loadingState$);

        this.plotSubscriptions.set(plot, subscription);
    }

    /**
     * Create a subscription for plot data with loading state checks and error handling
     * @param plot
     * @param data$
     * @param loadingState$
     * @returns {Subscription}
     */
    private createPlotSubscription(plot: Plot, data$: Observer<PlotData>, loadingState$: Observer<LoadingState>): Subscription {
        return this.getTimeStream()
            .do(() => loadingState$.next(LoadingState.LOADING))
            .switchMap(time => {
                return this.mappingQueryService.getPlotData({
                    operator: plot.operator,
                    time: time,
                });
            })
            .do(
                () => loadingState$.next(LoadingState.OK),
                (reason: Response) => {
                    this.notificationService.error(`${plot.name}: ${reason.status} ${reason.statusText}`);
                    loadingState$.next(LoadingState.ERROR);
                }
            )
            .subscribe(
                data => data$.next(data),
                error => error // ignore error
            );
    }

    /**
     * Retrieve the plot models array as a stream.
     * @returns {BehaviorSubject<Array<Plot>>}
     */
    getPlotStream(): Observable<Array<Plot>> {
        return this.plots$;
    }

    /**
     * Retrieve the data of the plot as a stream.
     * @param plot
     * @returns {ReplaySubject<PlotData>}
     */
    getPlotDataStream(plot: Plot): Observable<PlotData> {
        return this.plotData$.get(plot);
    }

    /**
     * Retrieve the plot status as a stream.
     * @param plot
     * @returns {ReplaySubject<LoadingState>}
     */
    getPlotDataStatusStream(plot: Plot): Observable<LoadingState> {
        return this.plotDataState$.get(plot);
    }

    /**
     * Remove all plots from a project.
     */
    clearPlots() {
        for (const plot of this.plots$.getValue().slice(0)) {
            this.removePlot(plot);
        }
    }

    getNewPlotStream(): Observable<void> {
        return this.newPlot$;
    }

    /**
     * Changes the display name of a plot.
     * @param plot The plot to modify
     * @param newName The new layer name
     */
    changePlotName(plot: Plot, newName: string) {
        const newPlot = new Plot({
            name: newName,
            operator: plot.operator,
        });

        const plotIndex = this.plots$.getValue().indexOf(plot);
        this.changeProjectConfig({
            plots: this.plots$.getValue().splice(plotIndex, 1, newPlot),
        });

        this.plotSubscriptions.set(newPlot, this.plotSubscriptions.get(plot));
        this.plotSubscriptions.delete(plot);

        this.plotDataState$.set(newPlot, this.plotDataState$.get(plot));
        this.plotDataState$.delete(plot);

        this.plotData$.set(newPlot, this.plotData$.get(plot));
        this.plotData$.delete(plot);
    }

}
