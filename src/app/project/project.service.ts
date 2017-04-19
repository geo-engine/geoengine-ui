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

@Injectable()
export class ProjectService {
    private project$: BehaviorSubject<Project>;
    private projection$: BehaviorSubject<Projection>;

    private time$: BehaviorSubject<Time>;

    private layers$: BehaviorSubject<Array<Layer<Symbology>>>;
    private layerData$: Map<Layer<Symbology>, ReplaySubject<LayerData<any>>>;
    private layerDataState$: Map<Layer<Symbology>, ReplaySubject<LoadingState>>;
    private layerDataSubscriptions: Map<Layer<Symbology>, Subscription>;
    private layerSymbologyData$: Map<Layer<Symbology>, ReplaySubject<MappingColorizer>>;
    private layerSymbologyDataState$: Map<Layer<Symbology>, ReplaySubject<LoadingState>>;
    private layerSymbologyDataSubscriptions: Map<Layer<Symbology>, Subscription>;
    private layerProvenanceData$: Map<Layer<Symbology>, ReplaySubject<Array<Provenance>>>;
    private layerProvenanceDataState$: Map<Layer<Symbology>, ReplaySubject<LoadingState>>;
    private layerProvenanceDataSubscriptions: Map<Layer<Symbology>, Subscription>;

    private newLayer$: Subject<Layer<Symbology>>;

    private plots$: BehaviorSubject<Array<Plot>>;
    private plotData$: Map<Plot, ReplaySubject<PlotData>>;
    private plotDataState$: Map<Plot, ReplaySubject<LoadingState>>;
    private plotSubscriptions: Map<Plot, Subscription>;
    private newPlot$: Subject<void>;

    constructor(private config: Config,
                private notificationService: NotificationService,
                private mappingQueryService: MappingQueryService,
                private mapservice: MapService) {
        this.project$ = new BehaviorSubject(this.createDefaultProject());

        this.projection$ = new BehaviorSubject(this.project$.value.projection);
        this.time$ = new BehaviorSubject(this.project$.value.time);

        this.plots$ = new BehaviorSubject([]);
        this.plotData$ = new Map();
        this.plotDataState$ = new Map();
        this.plotSubscriptions = new Map();
        this.newPlot$ = new Subject<void>();

        this.layers$ = new BehaviorSubject([]);
        this.layerData$ = new Map();
        this.layerDataState$ = new Map();
        this.layerDataSubscriptions = new Map();
        this.layerSymbologyData$ = new Map();
        this.layerSymbologyDataState$ = new Map();
        this.layerSymbologyDataSubscriptions = new Map();
        this.layerProvenanceData$ = new Map();
        this.layerProvenanceDataState$ = new Map();
        this.layerProvenanceDataSubscriptions = new Map();
        this.newLayer$ = new Subject<Layer<Symbology>>();

        this.project$.subscribe(project => {
            if (project.projection !== this.projection$.value) {
                this.projection$.next(project.projection);
            }
            if (project.time && project.time.isValid() && !project.time.isSame(this.time$.value)) {
                this.time$.next(project.time);
            }
            if (project.plots !== this.plots$.getValue()) {
                this.plots$.next(project.plots);
            }
            if (project.layers !== this.layers$.getValue()) {
                this.layers$.next(project.layers);
            }
        });

    }

    createDefaultProject(): Project {
        return new Project({
            name: this.config.DEFAULTS.PROJECT.NAME,
            projection: Projections.fromCode(this.config.DEFAULTS.PROJECT.PROJECTION),
            time: new TimePoint(this.config.DEFAULTS.PROJECT.TIME),
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
        if (time && time.isValid() && !time.isSame(oldTime)) {
            this.changeProjectConfig({
                time: time,
            });
        }
    }

    private changeProjectConfig(config: {
        name?: string,
        projection?: Projection,
        time?: Time,
        plots?: Array<Plot>,
        layers?: Array<Layer<Symbology>>
    }) {

        const project = this.project$.value;

        this.project$.next(new Project({
            name: config.name ? config.name : project.name,
            projection: config.projection ? config.projection : project.projection,
            time: config.time ? config.time : project.time,
            plots: config.plots ? config.plots : project.plots,
            layers: config.layers ? config.layers: project.layers,
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

    replacePlot(oldPlot: Plot, newPlot: Plot) {
        this.addPlot(newPlot, false);

        const currentPlots = this.getProject().plots;
        const oldPlotIndex = currentPlots.indexOf(oldPlot);
        currentPlots[oldPlotIndex] = newPlot;
        currentPlots.shift();

        this.removePlot(oldPlot);
        this.newPlot$.next();
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

    /**
     * Add a plot to the project.
     * @param layer
     * @param notify
     */
    addLayer(layer: Layer<Symbology>, notify = true) {
        // each layer has data. The type depends on the layer type
        const layerDataLoadingState$ = new ReplaySubject(1);
        const layerData$ = new ReplaySubject(1);
        let layerDataSub: Subscription;
        switch(layer.getLayerType()) {
            case 'raster':
                layerDataSub = this.createRasterLayerDataSubscription(
                    layer as RasterLayer<RasterSymbology>, layerData$, layerDataLoadingState$
                );
                break;
            default :
                layerDataSub = this.createVectorLayerDataSubscription(
                    layer as VectorLayer<AbstractVectorSymbology>, layerData$, layerDataLoadingState$
                );
        }
        this.layerDataSubscriptions.set(layer, layerDataSub);
        this.layerDataState$.set(layer, layerDataLoadingState$);
        this.layerData$.set(layer, layerData$);

        if(layer.getLayerType() === 'raster') {
            const symbologyDataLoadingState$ = new ReplaySubject(1);
            const symbologyData$ = new ReplaySubject(1);
            const symbologyDataSybscription = this.createRasterLayerSymbologyDataSubscription(layer as RasterLayer<RasterSymbology>,
                symbologyData$,
                symbologyDataLoadingState$
            );
            this.layerSymbologyDataSubscriptions.set(layer, symbologyDataSybscription);
            this.layerSymbologyDataState$.set(layer, symbologyDataLoadingState$);
            this.layerSymbologyData$.set(layer, symbologyData$);
        }

        // each layer has provenance...
        const provenanceDataLoadingState$ = new ReplaySubject(1);
        const provenanceData$ = new ReplaySubject(1);
        const provenanceSub = this.createLayerProvenanceSubscription(layer, provenanceData$, provenanceDataLoadingState$);
        this.layerProvenanceDataSubscriptions.set(layer, provenanceSub);
        this.layerProvenanceDataState$.set(layer, provenanceDataLoadingState$);
        this.layerProvenanceData$.set(layer, provenanceData$);

        const currentLayers = this.getProject().layers;
        this.changeProjectConfig({
            layers: [layer, ...currentLayers]
        });

        if (notify) {
            this.newLayer$.next(layer);
        }

        console.log("ADD LAYER", layer, this);
    }

    /**
     * Remove a plot from the project.
     * @param layer
     */
    removeLayer(layer: Layer<Symbology>) {
        const layers = this.getProject().layers;
        const layerIndex = layers.indexOf(layer);
        if (layerIndex >= 0) {
            layers.splice(layerIndex, 1);
            this.changeProjectConfig({
                layers: layers
            });

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

            const lsdsub = this.layerSymbologyDataSubscriptions.get(layer);
            if(lsdsub) lsdsub.unsubscribe();
            this.layerSymbologyDataSubscriptions.delete(layer);
            const lsds = this.layerSymbologyDataState$.get(layer);
            if(lsds) lsds.complete();
            this.layerSymbologyDataState$.delete(layer);
            const lsd = this.layerSymbologyData$.get(layer);
            if(lsd) lsd.complete();
            this.layerSymbologyData$.delete(layer);
        }
    }



    reloadLayerData(layer: Layer<Symbology>) {
        this.layerData$.get(layer).next(undefined); // send empty data

        this.layerDataSubscriptions.get(layer).unsubscribe();
        this.layerDataSubscriptions.delete(layer);

        switch(layer.getLayerType()) {
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

        this.layerDataSubscriptions.get(layer).unsubscribe();
        this.layerDataSubscriptions.delete(layer);

        this.layerProvenanceDataSubscriptions.get(layer).unsubscribe();
        this.layerProvenanceDataSubscriptions.delete(layer);

        if(this.layerSymbologyDataSubscriptions.has(layer)) {
            this.layerSymbologyDataSubscriptions.get(layer).unsubscribe();
            this.layerSymbologyDataSubscriptions.delete(layer);
        }

        switch(layer.getLayerType()) {
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
                        //time: time,
                        //projection: projection
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
            this.mapservice.getViewportSizeStream()
        )
            .do(() => loadingState$.next(LoadingState.LOADING))
            .switchMap(([time, projection, viewportSize]) => {
                const requestExtent: [number, number, number, number] = [0,0,0,0];

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
                                                       loadingState$: Observer<LoadingState>
    ): Subscription{
        return Observable.combineLatest(
            this.getTimeStream(),
            this.getProjectionStream(),
        )
            .do(() => loadingState$.next(LoadingState.LOADING))
            .switchMap(([time, projection]) => {
                return this.mappingQueryService.getColorizer(
                        layer.operator,
                        time,
                        projection
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
     * Retrieve the layer models array as a stream.
     * @returns {BehaviorSubject<Array<Layer<Symbology>>>}
     */
    getLayerStream(): Observable<Array<Layer<Symbology>>> {
        return this.layers$;
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

    /**
     * Remove all plots from a project.
     */
    clearLayers() {
        for (const layer of this.layers$.getValue().slice(0)) {
            this.removeLayer(layer);
        }
    }

    getNewLayerStream(): Observable<Layer<Symbology>> {
        return this.newLayer$;
    }

    /**
     * @returns The layer list.
     */
    getLayers(): Array<Layer<Symbology>> {
        console.log("getLayers");
        return this.layers$.getValue();
    }


    /**
     * Sets the layers
     * @param layers
     */
    setLayers(layers: Array<Layer<Symbology>>) {
        console.log("setLayers", layers);
        if(!(this.getLayers() == layers)) {
            this.changeProjectConfig({layers: layers});
        }
    }

    /**
     * Changes the display name of a layer.
     * @param layer The layer to modify
     * @param newName The new layer name
     */
    changeLayerName(layer: Layer<Symbology>, newName: string) {
        layer.name = newName;
        this.layers$.next(this.getLayers());
    }

    /**
     * Changes the symbology of a layer.
     * @param layer The layer to modify
     * @param symbology The new symbology
     */
    changeLayerSymbology(layer: Layer<Symbology>, symbology: Symbology) {
        // console.log('changeLayerSymbology', layer, symbology);
        layer.symbology = symbology;
        this.layers$.next(this.getLayers());
    }

    setLayerVisible(layer: Layer<Symbology>, visible: boolean) {
        layer.visible = visible;
        this.layers$.next(this.getLayers());
    }

    /**
     * Toggle the layer (extension).
     * @param layer The layer to modify
     */
    toggleLayer(layer: Layer<Symbology>) {
        layer.expanded = !layer.expanded;
        this.setLayerExpanded(layer, !layer.expanded);
    }

    setLayerExpanded(layer: Layer<Symbology>, expanded: boolean) {
        layer.expanded = expanded;
        this.layers$.next(this.getLayers());
    }

    toggleEditSymbology(layer: Layer<Symbology>) {
        this.setShowLayerSymbology(layer, !layer.editSymbology);
    }

    setShowLayerSymbology(layer: Layer<Symbology>, showSymbology: boolean) {
        layer.editSymbology = !layer.editSymbology;
        this.layers$.next(this.getLayers());
    }

}
