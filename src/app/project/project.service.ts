import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, ReplaySubject, Subscription, Observer, Subject} from 'rxjs/Rx';

import {Projections, Projection} from '../operators/projection.model';

import {Project} from './project.model';

import {Time, TimePoint} from '../time/time.model';
import {Config} from '../config.service';
import {Plot, PlotData} from '../plots/plot.model';
import {LoadingState} from './loading-state.model';
import {MappingQueryService} from '../queries/mapping-query.service';
import {NotificationService} from '../notification.service';
import {Response} from '@angular/http';
import {Layer, RasterLayer, VectorLayer, LayerData, RasterData, VectorData} from '../layers/layer.model';
import {
    Symbology, MappingColorizer, RasterSymbology,
    AbstractVectorSymbology, SymbologyType
} from '../layers/symbology/symbology.model';
import {Provenance} from '../provenance/provenance.model';
import {MapService} from '../map/map.service';
import {WFSOutputFormats} from '../queries/output-formats/wfs-output-format.model';
import {ResultTypes} from '../operators/result-type.model';
import {LayerService} from '../layers/layer.service';

@Injectable()
export class ProjectService {
    private project$ = new ReplaySubject<Project>(1);

    private layerData$: Map<Layer<Symbology>, ReplaySubject<LayerData<any>>>;
    private layerDataState$: Map<Layer<Symbology>, ReplaySubject<LoadingState>>;
    private layerDataSubscriptions: Map<Layer<Symbology>, Subscription>;
    private layerSymbologyData$: Map<Layer<Symbology>, ReplaySubject<MappingColorizer>>;
    private layerSymbologyDataState$: Map<Layer<Symbology>, ReplaySubject<LoadingState>>;
    private layerSymbologyDataSubscriptions: Map<Layer<Symbology>, Subscription>;
    private layerProvenanceData$: Map<Layer<Symbology>, ReplaySubject<Array<Provenance>>>;
    private layerProvenanceDataState$: Map<Layer<Symbology>, ReplaySubject<LoadingState>>;
    private layerProvenanceDataSubscriptions: Map<Layer<Symbology>, Subscription>;
    private layerCombinedState$: Map<Layer<Symbology>, Observable<LoadingState>>;

    private newLayer$: Subject<Layer<Symbology>>;

    private plotData$: Map<Plot, ReplaySubject<PlotData>>;
    private plotDataState$: Map<Plot, ReplaySubject<LoadingState>>;
    private plotSubscriptions: Map<Plot, Subscription>;
    private newPlot$: Subject<void>;

    constructor(private config: Config,
                private notificationService: NotificationService,
                private mappingQueryService: MappingQueryService,
                private mapService: MapService,
                private layerService: LayerService) {
        this.plotData$ = new Map();
        this.plotDataState$ = new Map();
        this.plotSubscriptions = new Map();
        this.newPlot$ = new Subject<void>();

        this.layerData$ = new Map();
        this.layerDataState$ = new Map();
        this.layerDataSubscriptions = new Map();
        this.layerSymbologyData$ = new Map();
        this.layerSymbologyDataState$ = new Map();
        this.layerSymbologyDataSubscriptions = new Map();
        this.layerProvenanceData$ = new Map();
        this.layerProvenanceDataState$ = new Map();
        this.layerProvenanceDataSubscriptions = new Map();
        this.layerCombinedState$ = new Map();
        this.newLayer$ = new Subject<Layer<Symbology>>();
    }

    createDefaultProject(): Project {
        return new Project({
            name: this.config.DEFAULTS.PROJECT.NAME,
            projection: Projections.fromCode(this.config.DEFAULTS.PROJECT.PROJECTION),
            time: new TimePoint(this.config.DEFAULTS.PROJECT.TIME),
        });
    }

    getProjectStream(): Observable<Project> {
        return this.project$;
    }

    setProject(project: Project) {
        // console.log("`setProject`");

        // clear layer data
        this.layerData$.forEach(subject => subject.complete());
        this.layerData$.clear();
        this.layerDataState$.forEach(subject => subject.complete());
        this.layerDataState$.clear();
        this.layerDataSubscriptions.forEach(subscription => subscription.unsubscribe());
        this.layerDataSubscriptions.clear();
        this.layerProvenanceData$.forEach(subject => subject.complete());
        this.layerProvenanceData$.clear();
        this.layerProvenanceDataState$.forEach(subject => subject.complete());
        this.layerProvenanceDataState$.clear();
        this.layerProvenanceDataSubscriptions.forEach(subscription => subscription.unsubscribe());
        this.layerProvenanceDataSubscriptions.clear();
        this.layerSymbologyData$.forEach(subject => subject.complete());
        this.layerSymbologyData$.clear();
        this.layerSymbologyDataState$.forEach(subject => subject.complete());
        this.layerSymbologyDataState$.clear();
        this.layerSymbologyDataSubscriptions.forEach(subscription => subscription.unsubscribe());
        this.layerSymbologyDataSubscriptions.clear();
        this.layerCombinedState$.clear();

        // clear plot data
        this.plotData$.forEach(subject => subject.complete());
        this.plotData$.clear();
        this.plotDataState$.forEach(subject => subject.complete());
        this.plotDataState$.clear();
        this.plotSubscriptions.forEach(subscription => subscription.unsubscribe());
        this.plotSubscriptions.clear();

        // add plot streams
        for (const plot of project.plots) {
            this.createPlotDataStreams(plot);
        }

        // add layer streams
        for (const layer of project.layers) {
            this.createLayerDataStreams(layer);
        }

        this.project$.next(project);
    }

    setTime(time: Time) {
        this.project$.first().subscribe(project => {
            const oldTime = project.time;
            if (time && time.isValid() && !time.isSame(oldTime)) {
                this.changeProjectConfig({
                    time: time,
                });
            }
        });
    }

    private changeProjectConfig(config: {
        name?: string,
        projection?: Projection,
        time?: Time,
        plots?: Array<Plot>,
        layers?: Array<Layer<Symbology>>
    }): Observable<void> {
        // console.log('Project::ProjectService.changeProjectConfig', config);

        const subject: Subject<void> = new ReplaySubject<void>(1);

        this.project$.first().subscribe(
            project => {
                this.project$.next(new Project({
                    name: config.name ? config.name : project.name,
                    projection: config.projection ? config.projection : project.projection,
                    time: config.time ? config.time : project.time,
                    plots: config.plots ? config.plots : project.plots,
                    layers: config.layers ? config.layers : project.layers,
                }));
                subject.next();
                subject.complete();
            },
            error => subject.error(error)
        );

        return subject.asObservable();
    }

    setName(name: string) {
        this.changeProjectConfig({name: name});
    }

    setProjection(projection: Projection) {
        this.changeProjectConfig({
            projection: projection
        });
    }

    getProjectionStream(): Observable<Projection> {
        return this.project$.map(project => project.projection).distinctUntilChanged();
    }

    getTimeStream(): Observable<Time> {
        return this.project$.map(project => project.time).distinctUntilChanged();
    }

    /**
     * Add a plot to the project.
     * @param plot
     * @param notify
     */
    addPlot(plot: Plot, notify = true): Observable<void> {
        const subject: Subject<void> = new ReplaySubject<void>(1);

        this.project$.first().subscribe(
            project => {
                this.createPlotDataStreams(plot);

                const currentPlots = project.plots;
                this.changeProjectConfig({
                    plots: [plot, ...currentPlots]
                }).subscribe(() => {
                    if (notify) {
                        this.newPlot$.next();
                    }

                    subject.next();
                    subject.complete();
                });
            },
            error => subject.error(error));

        return subject.asObservable();
    }

    replacePlot(oldPlot: Plot, newPlot: Plot, notify = true): Observable<void> {
        const subject: Subject<void> = new ReplaySubject<void>(1);

        this.addPlot(newPlot, false).subscribe(() => {
            this.project$.first().subscribe(project => {
                const currentPlots = project.plots;
                const oldPlotIndex = currentPlots.indexOf(oldPlot);
                const newPlotIndex = currentPlots.indexOf(newPlot);
                currentPlots[oldPlotIndex] = newPlot;
                currentPlots[newPlotIndex] = oldPlot;

                this.removePlot(oldPlot).subscribe(() => {
                    if (notify) {
                        this.newPlot$.next();
                    }

                    subject.next();
                    subject.complete();
                });
            });
        });

        return subject.asObservable();
    }

    /**
     * Remove a plot from the project.
     * @param plot
     */
    removePlot(plot: Plot): Observable<void> {
        const subject: Subject<void> = new ReplaySubject<void>(1);

        this.project$.first().subscribe(project => {
            const plots = [...project.plots];
            const plotIndex = plots.indexOf(plot);
            if (plotIndex >= 0) {
                plots.splice(plotIndex, 1);
                this.changeProjectConfig({
                    plots: plots
                }).subscribe(() => {
                    this.plotSubscriptions.get(plot).unsubscribe();
                    this.plotSubscriptions.delete(plot);

                    this.plotDataState$.get(plot).complete();
                    this.plotDataState$.delete(plot);

                    this.plotData$.get(plot).complete();
                    this.plotData$.delete(plot);

                    subject.next();
                    subject.complete();
                });
            }
        });

        return subject.asObservable();
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

    private createPlotDataStreams(plot: Plot) {
        const loadingState$ = new ReplaySubject<LoadingState>(1);
        const data$ = new ReplaySubject<PlotData>(1);

        const subscription = this.createPlotSubscription(plot, data$, loadingState$);
        this.plotSubscriptions.set(plot, subscription);

        this.plotDataState$.set(plot, loadingState$);
        this.plotData$.set(plot, data$);
    }

    private deletePlotDataStreas(plot: Plot) {
        this.plotData$.get(plot).complete();
        this.plotData$.delete(plot);

        this.plotDataState$.get(plot).complete();
        this.plotDataState$.delete(plot);

        this.plotSubscriptions.get(plot).unsubscribe();
        this.plotSubscriptions.delete(plot);
    }

    private createLayerDataStreams(layer: Layer<Symbology>) {
        // each layer has data. The type depends on the layer type
        const layerDataLoadingState$ = new ReplaySubject<LoadingState>(1);
        const layerData$ = new ReplaySubject<LayerData<any>>(1);
        let layerDataSub: Subscription;
        switch (layer.getLayerType()) {
            case 'raster':
                layerDataSub = this.createRasterLayerDataSubscription(
                    layer as RasterLayer<RasterSymbology>, layerData$, layerDataLoadingState$
                );
                break;
            case 'vector':
                layerDataSub = this.createVectorLayerDataSubscription(
                    layer as VectorLayer<AbstractVectorSymbology>, layerData$, layerDataLoadingState$
                );
                break;
        }
        this.layerDataSubscriptions.set(layer, layerDataSub);
        this.layerDataState$.set(layer, layerDataLoadingState$);
        this.layerData$.set(layer, layerData$);

        const symbologyDataLoadingState$ = new ReplaySubject<LoadingState>(1);
        const symbologyData$ = new ReplaySubject<MappingColorizer>(1);
        this.layerSymbologyDataState$.set(layer, symbologyDataLoadingState$);
        this.layerSymbologyData$.set(layer, symbologyData$);

        if (layer.getLayerType() === 'raster') {
            const symbologyDataSubscription = this.createRasterLayerSymbologyDataSubscription(layer as RasterLayer<RasterSymbology>,
                symbologyData$,
                symbologyDataLoadingState$
            );
            this.layerSymbologyDataSubscriptions.set(layer, symbologyDataSubscription);
        } else {
            symbologyDataLoadingState$.next(LoadingState.OK);
        }

        // each layer has provenance...
        const provenanceDataLoadingState$ = new ReplaySubject<LoadingState>(1);
        const provenanceData$ = new ReplaySubject<Array<Provenance>>(1);
        const provenanceSub = this.createLayerProvenanceSubscription(layer, provenanceData$, provenanceDataLoadingState$);
        this.layerProvenanceDataSubscriptions.set(layer, provenanceSub);
        this.layerProvenanceDataState$.set(layer, provenanceDataLoadingState$);
        this.layerProvenanceData$.set(layer, provenanceData$);

        const combinedState$ = Observable.combineLatest(
            this.layerSymbologyDataState$.get(layer),
            this.layerDataState$.get(layer),
            this.layerProvenanceDataState$.get(layer))
            .map(([sym, data, prov]) => {
                //console.log("combinedLayerState", sym, data, prov);
                if (sym === LoadingState.LOADING
                    || data === LoadingState.LOADING
                /*|| prov === LoadingState.LOADING*/) {
                    return LoadingState.LOADING;
                }
                if (sym === LoadingState.ERROR
                    || data === LoadingState.ERROR
                /*|| prov === LoadingState.ERROR*/) {
                    return LoadingState.ERROR;
                }
                return LoadingState.OK;
            }).catch(err => {
                return Observable.of(LoadingState.ERROR);
            });

        this.layerCombinedState$.set(layer, combinedState$);
    }

    /**
     * Retrieve the plot models array as a stream.
     * @returns {BehaviorSubject<Array<Plot>>}
     */
    getPlotStream(): Observable<Array<Plot>> {
        return this.project$.map(project => project.plots).distinctUntilChanged();
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
        this.project$.first().subscribe(project => {
            for (const plot of project.plots.slice(0)) {
                this.removePlot(plot);
            }
        });
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

        this.project$.first().subscribe(project => {
            let plots = project.plots;
            const plotIndex = plots.indexOf(plot);
            plots.splice(plotIndex, 1, newPlot);

            this.changeProjectConfig({
                plots: [...plots],
            }).subscribe(() => {
                this.plotSubscriptions.set(newPlot, this.plotSubscriptions.get(plot));
                this.plotSubscriptions.delete(plot);

                this.plotDataState$.set(newPlot, this.plotDataState$.get(plot));
                this.plotDataState$.delete(plot);

                this.plotData$.set(newPlot, this.plotData$.get(plot));
                this.plotData$.delete(plot);
            });
        });
    }

    /**
     * Add a plot to the project.
     * @param layer
     * @param notify
     */
    addLayer(layer: Layer<Symbology>, notify = true): Observable<void> {
        this.createLayerDataStreams(layer);

        const subject: Subject<void> = new ReplaySubject<void>(1);

        this.project$.first().subscribe(project => {
            const currentLayers = project.layers;
            this.changeProjectConfig({
                layers: [layer, ...currentLayers]
            }).subscribe(() => {
                if (notify) {
                    this.newLayer$.next(layer);
                }

                // console.log("ADD LAYER", layer, this);

                subject.next();
                subject.complete();
            });
        });

        return subject.asObservable();
    }

    /**
     * Remove a plot from the project.
     * @param layer
     */
    removeLayer(layer: Layer<Symbology>): Observable<void> {
        const subject: Subject<void> = new ReplaySubject<void>(1);

        if (this.layerService.getSelectedLayer() === layer) {
            this.layerService.setSelectedLayer(undefined);
        }

        this.project$.first().subscribe(project => {
            // const layers = Array.from(this.getProject().layers);
            const layers = [...project.layers];
            const layerIndex = layers.indexOf(layer);
            // console.log("REMOVE LAYER", layer, layers, layerIndex);
            if (layerIndex >= 0) {
                layers.splice(layerIndex, 1);
                // console.log("REMOVE LAYER 2", removedLayers, layers);
                this.changeProjectConfig({
                    layers: layers
                }).subscribe(() => {
                    this.layerDataSubscriptions.get(layer).unsubscribe();
                    this.layerDataSubscriptions.delete(layer);
                    this.layerDataState$.get(layer).complete();
                    this.layerDataState$.delete(layer);
                    this.layerData$.get(layer).complete();
                    this.layerData$.delete(layer);

                    this.layerProvenanceDataSubscriptions.get(layer).unsubscribe();
                    this.layerProvenanceDataSubscriptions.delete(layer);
                    this.layerProvenanceDataState$.get(layer).complete();
                    this.layerProvenanceDataState$.delete(layer);
                    this.layerProvenanceData$.get(layer).complete();
                    this.layerProvenanceData$.delete(layer);

                    const symbologyDataSubscription = this.layerSymbologyDataSubscriptions.get(layer);
                    if (symbologyDataSubscription) {
                        symbologyDataSubscription.unsubscribe();
                    }
                    this.layerSymbologyDataSubscriptions.delete(layer);
                    const symbologyDataState = this.layerSymbologyDataState$.get(layer);
                    if (symbologyDataState) {
                        symbologyDataState.complete();
                    }
                    this.layerSymbologyDataState$.delete(layer);
                    const lsd = this.layerSymbologyData$.get(layer);
                    if (lsd) {
                        lsd.complete();
                    }
                    this.layerSymbologyData$.delete(layer);
                    this.layerCombinedState$.delete(layer);

                    subject.next();
                    subject.complete();
                });
            }
        });

        return subject.asObservable();
    }

    reloadLayerData(layer: Layer<Symbology>) {
        this.layerData$.get(layer).next(undefined); // send empty data

        if (this.layerDataSubscriptions.has(layer)) {
            this.layerDataSubscriptions.get(layer).unsubscribe();
            this.layerDataSubscriptions.delete(layer);
        }

        switch (layer.getLayerType()) {
            case 'raster': {
                this.layerDataSubscriptions.set(layer,
                    this.createRasterLayerDataSubscription(
                        layer as RasterLayer<RasterSymbology>,
                        (this.layerData$.get(layer) as Observer<RasterData>),
                        this.layerDataState$.get(layer)
                    )
                );
                break;
            }
            case 'vector': {
                this.layerDataSubscriptions.set(layer,
                    this.createVectorLayerDataSubscription(
                        layer as VectorLayer<AbstractVectorSymbology>,
                        (this.layerData$.get(layer) as Observer<VectorData>),
                        this.layerDataState$.get(layer)
                    )
                );
                break;
            }

        }
    }

    /**
     * Reload everything for the layer manually (e.g. on error).
     * @param layer
     */
    reloadLayer(layer: Layer<Symbology>) {
        this.layerData$.get(layer).next(undefined); // send empty data

        if (this.layerDataSubscriptions.has(layer)) {
            this.layerDataSubscriptions.get(layer).unsubscribe();
            this.layerDataSubscriptions.delete(layer);
        }

        if (this.layerProvenanceDataSubscriptions.has(layer)) {
            this.layerProvenanceDataSubscriptions.get(layer).unsubscribe();
            this.layerProvenanceDataSubscriptions.delete(layer);
        }

        if (this.layerSymbologyDataSubscriptions.has(layer)) {
            this.layerSymbologyDataSubscriptions.get(layer).unsubscribe();
            this.layerSymbologyDataSubscriptions.delete(layer);
        }

        switch (layer.getLayerType()) {
            case 'raster': {
                this.layerDataSubscriptions.set(layer,
                    this.createRasterLayerDataSubscription(
                        layer as RasterLayer<RasterSymbology>,
                        (this.layerData$.get(layer) as Observer<RasterData>),
                        this.layerDataState$.get(layer)
                    )
                );
                this.layerSymbologyDataSubscriptions.set(layer,
                    this.createRasterLayerSymbologyDataSubscription(
                        layer as RasterLayer<RasterSymbology>,
                        this.layerSymbologyData$.get(layer) as Observer<MappingColorizer>,
                        this.layerSymbologyDataState$.get(layer)));
                break;
            }
            case 'vector': {
                this.layerDataSubscriptions.set(layer,
                    this.createVectorLayerDataSubscription(
                        layer as VectorLayer<AbstractVectorSymbology>,
                        (this.layerData$.get(layer) as Observer<VectorData>),
                        this.layerDataState$.get(layer)
                    )
                );
                break;
            }

        }

        this.layerProvenanceDataSubscriptions.set(layer,
            this.createLayerProvenanceSubscription(
                layer,
                this.layerProvenanceData$.get(layer),
                this.layerProvenanceDataState$.get(layer)
            )
        );
    }


    /**
     * Create a subscription for layer data, symbology and provenance with loading state checks and error handling
     * @param layer
     * @param data$
     * @param loadingState$
     * @returns {Subscription}
     */
    private createRasterLayerDataSubscription(layer: RasterLayer<RasterSymbology>, data$: Observer<RasterData>,
                                              loadingState$: Observer<LoadingState>): Subscription {
        return Observable.combineLatest(
            this.getTimeStream(),
            this.getProjectionStream(),
        )
            .do(() => loadingState$.next(LoadingState.LOADING))
            .map(([time, projection]) => {
                return new RasterData(time, projection,
                    this.mappingQueryService.getWMSQueryUrl({
                        operator: layer.operator,
                        time: time,
                        projection: projection,
                    })
                );
            })
            .do(
                () => loadingState$.next(LoadingState.OK),
                (reason: Response) => {
                    this.notificationService.error(`${layer.name}: ${reason.status} ${reason.statusText}`);
                    loadingState$.next(LoadingState.ERROR);
                }
            )
            .subscribe(
                data => data$.next(data),
                error => error // ignore error
            );
    }

    /**
     * Create a subscription for layer data, symbology and provenance with loading state checks and error handling
     * @param layer
     * @param data$
     * @param loadingState$
     * @returns {Subscription}
     */
    private createVectorLayerDataSubscription(layer: VectorLayer<AbstractVectorSymbology>, data$: Observer<VectorData>,
                                              loadingState$: Observer<LoadingState>): Subscription {
        return Observable.combineLatest(
            this.getTimeStream(),
            this.getProjectionStream(),
            this.mapService.getViewportSizeStream().debounceTime(this.config.DELAYS.DEBOUNCE)
        )
            .do(() => loadingState$.next(LoadingState.LOADING))
            .switchMap(([time, projection, viewportSize]) => {
                const requestExtent: [number, number, number, number] = [0, 0, 0, 0];

                return this.mappingQueryService.getWFSData({
                    operator: layer.operator,
                    time: time,
                    projection: projection,
                    clustered: layer.symbology.getSymbologyType() === SymbologyType.CLUSTERED_POINT,
                    outputFormat: WFSOutputFormats.JSON,
                    viewportSize: viewportSize
                }).map(x => VectorData.olParse(time, projection, requestExtent, x));
            })
            .do(
                () => loadingState$.next(LoadingState.OK),
                (reason: Response) => {
                    this.notificationService.error(`${layer.name}: ${reason.status} ${reason.statusText}`);
                    loadingState$.next(LoadingState.ERROR);
                }
            )
            .subscribe(
                data => data$.next(data),
                error => error // ignore error
            );
    }

    /**
     * Create a subscription for layer data, symbology and provenance with loading state checks and error handling
     * @param layer
     * @param provenance$
     * @param loadingState$
     * @returns {Subscription}
     */
    private createLayerProvenanceSubscription(layer: Layer<Symbology>, provenance$: Observer<{}>,
                                              loadingState$: Observer<LoadingState>): Subscription {
        return Observable.combineLatest(this.getTimeStream(), this.getProjectionStream())
            .do(() => loadingState$.next(LoadingState.LOADING))
            .switchMap(([time, projection]) => {
                return this.mappingQueryService.getProvenance({
                    operator: layer.operator,
                    time: time,
                    projection: projection,
                    extent: projection.getExtent(),
                });
            })
            .do(
                () => loadingState$.next(LoadingState.OK),
                (reason: Response) => {
                    this.notificationService.error(`${layer.name}: ${reason.status} ${reason.statusText}`);
                    loadingState$.next(LoadingState.ERROR);
                }
            )
            .subscribe(
                data => provenance$.next(data),
                error => error // ignore error
            );
    }

    /**
     * Create a subscription for layer data, symbology and provenance with loading state checks and error handling
     * @param layer
     * @param data$
     * @param loadingState$
     * @returns {Subscription}
     */
    private createRasterLayerSymbologyDataSubscription(layer: RasterLayer<RasterSymbology>,
                                                       data$: Observer<MappingColorizer>,
                                                       loadingState$: Observer<LoadingState>): Subscription {
        return Observable.combineLatest(
            this.getTimeStream(),
            this.getProjectionStream(),
        )
            .do(() => loadingState$.next(LoadingState.LOADING))
            .switchMap(([time, projection]) => {
                const colorizer = this.mappingQueryService.getColorizer(
                    layer.operator,
                    time,
                    projection
                )
                    .do(() => loadingState$.next(LoadingState.OK))
                    .catch((reason: Response) => {
                    this.notificationService.error(`${layer.name}: ${reason.status} ${reason.statusText}`);
                    loadingState$.next(LoadingState.ERROR);
                    return Observable.of({interpolation: 'unknown', breakpoints: []});
                });
                return colorizer;
            })
            .subscribe(
                data => data$.next(data),
                error => error // ignore error
            );
    }

    /**
     * Retrieve the layer models array as a stream.
     * @returns {BehaviorSubject<Array<Layer<Symbology>>>}
     */
    getLayerStream(): Observable<Array<Layer<Symbology>>> {
        return this.project$.map(project => project.layers).distinctUntilChanged();
    }

    /**
     * Retrieve the data of the layer as a stream.
     * @param layer
     * @returns {ReplaySubject<LayerData<any>>}
     */
    getLayerDataStream(layer: Layer<Symbology>): Observable<LayerData<any>> {
        return this.layerData$.get(layer);
    }

    /**
     * Retrieve the layer data status as a stream.
     * @param layer
     * @returns {ReplaySubject<LoadingState>}
     */
    getLayerDataStatusStream(layer: Layer<Symbology>): Observable<LoadingState> {
        return this.layerDataState$.get(layer);
    }

    /**
     * Change the loading state of a raster layer
     * @param layer
     * @param state
     */
    changeRasterLayerDataStatus(layer: Layer<RasterSymbology>, state: LoadingState) {
        if (layer.operator.resultType === ResultTypes.RASTER) {
            this.layerDataState$.get(layer).next(state);
        } else {
            throw Error('It is only allowed to change the state of a raster layer');
        }
    }

    /**
     * Retrieve the symbology data of the layer as a stream.
     * @param layer
     * @returns {ReplaySubject<LayerData<any>>}
     */
    getLayerSymbologyDataStream(layer: Layer<Symbology>): Observable<MappingColorizer> {
        return this.layerSymbologyData$.get(layer);
    }

    /**
     * Retrieve the layer symbology data status as a stream.
     * @param layer
     * @returns {ReplaySubject<LoadingState>}
     */
    getLayerSymbologyDataStatusStream(layer: Layer<Symbology>): Observable<LoadingState> {
        return this.layerSymbologyDataState$.get(layer);
    }

    /**
     * Retrieve the provenance data of the layer as a stream.
     * @param layer
     * @returns {ReplaySubject<Array<Provenance>>}
     */
    getLayerProvenanceDataStream(layer: Layer<Symbology>): Observable<Array<Provenance>> {
        return this.layerProvenanceData$.get(layer);
    }

    /**
     * Retrieve the layer provenance status as a stream.
     * @param layer
     * @returns {ReplaySubject<LoadingState>}
     */
    getLayerProvenanceDataStatusStream(layer: Layer<Symbology>): Observable<LoadingState> {
        return this.layerProvenanceDataState$.get(layer);
    }

    getLayerCombinedStatusStream(layer: Layer<Symbology>): Observable<LoadingState> {
        const state =  this.layerCombinedState$.get(layer);
        //console.log(layer.name, state);
        return state;
    }

    /**
     * Remove all plots from a project.
     */
    clearLayers(): Observable<void> {
        const subject: Subject<void> = new ReplaySubject<void>(1);

        this.project$.first().subscribe(project => {
            let removeObservables = [];

            for (const layer of project.layers.slice(0)) {
                removeObservables.push(this.removeLayer(layer));
            }

            Observable
                .combineLatest(removeObservables)
                .first()
                .subscribe(
                    () => {
                        subject.next();
                        subject.complete();
                    },
                    error => subject.error(error)
                );
        });

        return subject.asObservable();
    }

    getNewLayerStream(): Observable<Layer<Symbology>> {
        return this.newLayer$;
    }


    /**
     * Sets the layers
     * @param layers
     */
    setLayers(layers: Array<Layer<Symbology>>) {
        this.project$.first().subscribe(project => {
            // console.log("setLayers", layers);
            if (project.layers !== layers) {
                // console.log("setLayers updates");
                this.changeProjectConfig({layers: layers});
            }
        });
    }

    /**
     * Changes the display name of a layer.
     * @param layer The layer to modify
     * @param changes
     */
    changeLayer(layer: Layer<Symbology>, changes: {
        name ?: string,
        symbology ?: Symbology,
        editSymbology ?: boolean,
        visible ?: boolean,
        expanded ?: boolean,
    }) {
        // change immutably
        //
        // let newLayer: Layer<Symbology>;
        // if (layer instanceof VectorLayer) {
        //     newLayer = new VectorLayer<AbstractVectorSymbology>({
        //         name: changes.name ? changes.name : layer.name,
        //         operator: layer.operator,
        //         symbology: changes.symbology ? changes.symbology : layer.symbology,
        //         editSymbology: changes.editSymbology !== undefined ? changes.editSymbology : layer.editSymbology,
        //         visible: changes.visible !== undefined ? changes.visible : layer.visible,
        //         expanded: changes.expanded !== undefined ? changes.expanded : layer.expanded,
        //     });
        // } else if (layer instanceof RasterLayer) {
        //     newLayer = new RasterLayer<RasterSymbology>({
        //         name: changes.name ? changes.name : layer.name,
        //         operator: layer.operator,
        //         symbology: (changes.symbology ? changes.symbology : layer.symbology) as RasterSymbology,
        //         editSymbology: changes.editSymbology !== undefined ? changes.editSymbology : layer.editSymbology,
        //         visible: changes.visible !== undefined ? changes.visible : layer.visible,
        //         expanded: changes.expanded !== undefined ? changes.expanded : layer.expanded,
        //     });
        // }
        //
        // if (layer) {
        //     this.project$.first().subscribe(project => {
        //         let layers = project.layers;
        //         const layerIndex = layers.indexOf(layer);
        //         layers.splice(layerIndex, 1, newLayer);
        //
        //         this.layerData$.set(newLayer, this.layerData$.get(layer));
        //         this.layerDataState$.set(newLayer, this.layerDataState$.get(layer));
        //         this.layerDataSubscriptions.set(newLayer, this.layerDataSubscriptions.get(layer));
        //
        //         if (layer instanceof RasterLayer) {
        //             this.layerSymbologyData$.set(newLayer, this.layerSymbologyData$.get(layer));
        //             this.layerSymbologyDataState$.set(newLayer, this.layerSymbologyDataState$.get(layer));
        //             this.layerSymbologyDataSubscriptions.set(newLayer, this.layerSymbologyDataSubscriptions.get(layer));
        //         }
        //
        //         this.layerProvenanceData$.set(newLayer, this.layerProvenanceData$.get(layer));
        //         this.layerProvenanceDataState$.set(newLayer, this.layerProvenanceDataState$.get(layer));
        //         this.layerProvenanceDataSubscriptions.set(newLayer, this.layerProvenanceDataSubscriptions.get(layer));
        //
        //         this.changeProjectConfig({
        //             layers: [...layers],
        //         }).subscribe(() => {
        //             this.layerData$.delete(layer);
        //             this.layerDataState$.delete(layer);
        //             this.layerDataSubscriptions.delete(layer);
        //
        //             if (layer instanceof RasterLayer) {
        //                 this.layerSymbologyData$.delete(layer);
        //                 this.layerSymbologyDataState$.delete(layer);
        //                 this.layerSymbologyDataSubscriptions.delete(layer);
        //             }
        //
        //             this.layerProvenanceData$.delete(layer);
        //             this.layerProvenanceDataState$.delete(layer);
        //             this.layerProvenanceDataSubscriptions.delete(layer);
        //         });
        //     });
        // }

        // change mutably
        layer._changeUnderlyingData(changes);

        if (layer instanceof RasterLayer) {
            const symbologyDataSybscription = this.createRasterLayerSymbologyDataSubscription(
                layer as RasterLayer<RasterSymbology>,
                this.layerSymbologyData$.get(layer),
                this.layerSymbologyDataState$.get(layer),
            );

            this.layerSymbologyDataSubscriptions.get(layer).unsubscribe();
            this.layerSymbologyDataSubscriptions.set(layer, symbologyDataSybscription);
        }

        this.getLayerStream().first().subscribe(layers => {
            this.changeProjectConfig({
                layers: [...layers],
            });
        });
    }

    /**
     * Toggle the layer (extension).
     * @param layer The layer to modify
     */
    toggleSymbology(layer: Layer<Symbology>) {
        this.changeLayer(layer, {expanded: !layer.expanded});
    }

    toggleEditSymbology(layer: Layer<Symbology>) {
        this.changeLayer(layer, {editSymbology: !layer.editSymbology});
    }

}
