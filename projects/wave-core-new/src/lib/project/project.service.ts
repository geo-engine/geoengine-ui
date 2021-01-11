import {
    combineLatest,
    Observable,
    Observer,
    ReplaySubject,
    Subject,
    Subscription
} from 'rxjs';

import {debounceTime, distinctUntilChanged, first, map, mergeMap, switchMap, tap} from 'rxjs/operators';
import {Injectable} from '@angular/core';

import {SpatialReference, SpatialReferences} from '../operators/spatial-reference.model';

import {Project} from './project.model';

import {Time, TimeStepDuration} from '../time/time.model';
import {Config} from '../config.service';
import {LoadingState} from './loading-state.model';
import {NotificationService} from '../notification.service';
import {HttpErrorResponse} from '@angular/common/http';
import {LayoutService} from '../layout.service';
import {Layer, RasterLayer, VectorLayer} from '../layers/layer.model';
import {BackendService} from '../backend/backend.service';
import {UUID} from '../backend/backend.model';
import {UserService} from '../users/user.service';
import {LayerData, RasterData, VectorData} from '../layers/layer-data.model';
import {extentToBboxDict} from '../util/conversions';
import {MapService} from '../map/map.service';
import {AbstractSymbology, MappingRasterSymbology, VectorSymbology} from '../layers/symbology/symbology.model';

/***
 * The ProjectService is the main housekeeping component of WAVE.
 * All layers, plots, and provenance are registered with the ProjectService.
 */
@Injectable()
export class ProjectService {
    private project$ = new ReplaySubject<Project>(1);

    private layerData$ = new Map<number, ReplaySubject<LayerData>>();
    private layerDataState$ = new Map<number, ReplaySubject<LoadingState>>();
    private layerDataSubscriptions = new Map<number, Subscription>();
    private layers = new Map<number, ReplaySubject<Layer>>();

    // private layerSymbologyData$: Map<Layer, ReplaySubject<DeprecatedMappingColorizerDoNotUse>>;
    // private layerSymbologyDataState$: Map<Layer, ReplaySubject<LoadingState>>;
    // private layerSymbologyDataSubscriptions: Map<Layer, Subscription>;
    // private layerProvenanceData$: Map<Layer, ReplaySubject<Array<Provenance>>>;
    // private layerProvenanceDataState$: Map<Layer, ReplaySubject<LoadingState>>;
    // private layerProvenanceDataSubscriptions: Map<Layer, Subscription>;
    // private layerCombinedState$: Map<Layer, Observable<LoadingState>>;

    // private newLayer$: Subject<Layer<AbstractSymbology>>;

    // private plotData$: Map<Plot, ReplaySubject<PlotData>>;
    // private plotDataState$: Map<Plot, ReplaySubject<LoadingState>>;
    // private plotSubscriptions: Map<Plot, Subscription>;
    // private newPlot$: Subject<void>;

    constructor(private config: Config,
                private notificationService: NotificationService,
                // protected mappingQueryService: MappingQueryService,
                protected mapService: MapService,
                // protected layerService: LayerService,
                protected backend: BackendService,
                protected userService: UserService,
                protected layoutService: LayoutService) {
        // this.plotData$ = new Map();
        // this.plotDataState$ = new Map();
        // this.plotSubscriptions = new Map();
        // this.newPlot$ = new Subject<void>();

        // this.layerData$ = new Map();
        // this.layerDataState$ = new Map();
        // this.layerDataSubscriptions = new Map();
        // this.layerSymbologyData$ = new Map();
        // this.layerSymbologyDataState$ = new Map();
        // this.layerSymbologyDataSubscriptions = new Map();
        // this.layerProvenanceData$ = new Map();
        // this.layerProvenanceDataState$ = new Map();
        // this.layerProvenanceDataSubscriptions = new Map();
        // this.layerCombinedState$ = new Map();
        // this.newLayer$ = new Subject<Layer<AbstractSymbology>>();
        // this.layerChanges$ = new Map();
    }

    /**
     * Generate a default Project with values from the config file.
     */
    createDefaultProject(): Observable<Project> {
        const name = this.config.DEFAULTS.PROJECT.NAME;
        const spatialReference = SpatialReferences.fromCode(this.config.DEFAULTS.PROJECT.PROJECTION);
        const layers = [];
        const time = new Time(this.config.DEFAULTS.PROJECT.TIME, this.config.DEFAULTS.PROJECT.TIME);
        const timeStepDuration = this.getDefaultTimeStep();

        return this.userService.getSessionTokenForRequest().pipe(
            // TODO: solidify default project creation
            mergeMap(sessionToken => this.backend.createProject({
                name,
                description: 'default project',
                bounds: {
                    bounding_box: extentToBboxDict(spatialReference.getExtent()),
                    spatial_reference: spatialReference.getCode(),
                    time_interval: time.toDict(),
                },
            }, sessionToken)),
            map(({id}) => new Project({
                id,
                name,
                spatialReference,
                layers,
                time,
                timeStepDuration,
            })),
        );
    }

    private getDefaultTimeStep(): TimeStepDuration {
        switch (this.config.DEFAULTS.PROJECT.TIMESTEP) {
            case '15 minutes':
                return {durationAmount: 15, durationUnit: 'minutes'};
            case '1 hour' :
                return {durationAmount: 1, durationUnit: 'hour'};
            case '1 day':
                return {durationAmount: 1, durationUnit: 'day'};
            case '1 month':
                return {durationAmount: 1, durationUnit: 'month'};
            case '6 months':
                return {durationAmount: 6, durationUnit: 'months'};
            case '1 year':
                return {durationAmount: 1, durationUnit: 'year'};
            default:
                return {durationAmount: 1, durationUnit: 'month'};
        }
    }

    /**
     * Get a stream of Projects. This way compments can react to new Projects.
     */
    getProjectStream(): Observable<Project> {
        return this.project$;
    }

    /**
     * Set a new Project. The ProjectService will clear all layer, plots, and provenance.
     */
    setProject(project: Project) {
        // clear layer data
        this.layerData$.forEach(subject => subject.complete());
        this.layerData$.clear();
        this.layerDataState$.forEach(subject => subject.complete());
        this.layerDataState$.clear();
        this.layerDataSubscriptions.forEach(subscription => subscription.unsubscribe());
        this.layerDataSubscriptions.clear();
        // this.layerProvenanceData$.forEach(subject => subject.complete());
        // this.layerProvenanceData$.clear();
        // this.layerProvenanceDataState$.forEach(subject => subject.complete());
        // this.layerProvenanceDataState$.clear();
        // this.layerProvenanceDataSubscriptions.forEach(subscription => subscription.unsubscribe());
        // this.layerProvenanceDataSubscriptions.clear();
        // this.layerSymbologyData$.forEach(subject => subject.complete());
        // this.layerSymbologyData$.clear();
        // this.layerSymbologyDataState$.forEach(subject => subject.complete());
        // this.layerSymbologyDataState$.clear();
        // this.layerSymbologyDataSubscriptions.forEach(subscription => subscription.unsubscribe());
        // this.layerSymbologyDataSubscriptions.clear();
        // this.layerCombinedState$.clear();

        // clears all layer changes subscriptions, but completes them first
        this.layers.forEach(subject => subject.complete());
        this.layers.clear();

        // clear plot data
        // this.plotData$.forEach(subject => subject.complete());
        // this.plotData$.clear();
        // this.plotDataState$.forEach(subject => subject.complete());
        // this.plotDataState$.clear();
        // this.plotSubscriptions.forEach(subscription => subscription.unsubscribe());
        // this.plotSubscriptions.clear();

        // add plot streams
        // for (const plot of project.plots) {
        //     this.createPlotDataStreams(plot);
        // }

        // add layer streams
        for (const layer of project.layers) {
            this.createLayerDataStreams(layer);
            this.createLayerChangesStream(layer);
        }

        this.project$.next(project);

        // TODO: remove log
        console.log('store project', project.id);

        // store current project in session
        this.userService.getSessionTokenForRequest().subscribe(
            sessionToken => this.backend.setSessionProject(project.id, sessionToken)
        );
    }

    /**
     * Set the time of the current project.
     */
    setTime(time: Time) {
        // TODO: server communication
        // this.project$.pipe(first()).subscribe(project => {
        //     const oldTime = project.time;
        //     if (time && time.isValid() && !time.isSame(oldTime)) {
        //         this.changeProjectConfig({
        //             time,
        //         });
        //     }
        // });
    }

    /**
     * Set a time duration for the current project.
     */
    setTimeStepDuration(timeStepDuration: TimeStepDuration) {
        // TODO: server communication
        // this.changeProjectConfig({
        //     timeStepDuration,
        // });
    }

    /**
     * Set the name of the current Project.
     */
    setName(name: string) {
        // TODO: server communication
        // this.changeProjectConfig({name});
    }

    /**
     * Set the projection used by the current project.
     */
    setProjection(projection: SpatialReference) {
        // TODO: server communication
        // this.changeProjectConfig({
        //     projection
        // });
    }

    /**
     * Get a stream of the projects projection.
     */
    getProjectionStream(): Observable<SpatialReference> {
        return this.project$.pipe(map(project => project.spatialReference), distinctUntilChanged());
    }

    /**
     * Get a stream of the projects time.
     */
    getTimeStream(): Observable<Time> {
        return this.project$.pipe(map(project => project.time), distinctUntilChanged());
    }

    /**
     * Get a stream of the projects time step size.
     */
    getTimeStepDurationStream(): Observable<TimeStepDuration> {
        return this.project$.pipe(map(project => project.timeStepDuration), distinctUntilChanged());
    }

    // /**
    //  * Add a plot to the project.
    //  */
    // addPlot(plot: Plot, notify = true): Observable<void> {
    //     const subject: Subject<void> = new ReplaySubject<void>(1);
    //
    //     this.project$.pipe(first()).subscribe(
    //         project => {
    //             this.createPlotDataStreams(plot);
    //
    //             const currentPlots = project.plots;
    //             this.changeProjectConfig({
    //                 plots: [plot, ...currentPlots]
    //             }).subscribe(() => {
    //                 if (notify) {
    //                     this.newPlot$.next();
    //                 }
    //
    //                 subject.next();
    //                 subject.complete();
    //             });
    //         },
    //         error => subject.error(error));
    //
    //     return subject.asObservable();
    // }
    //
    // /**
    //  * Replace a Plot with another one.
    //  */
    // replacePlot(oldPlot: Plot, newPlot: Plot, notify = true): Observable<void> {
    //     const subject: Subject<void> = new ReplaySubject<void>(1);
    //
    //     this.addPlot(newPlot, false).subscribe(() => {
    //         this.project$.pipe(first()).subscribe(project => {
    //             const currentPlots = project.plots;
    //             const oldPlotIndex = currentPlots.indexOf(oldPlot);
    //             const newPlotIndex = currentPlots.indexOf(newPlot);
    //             currentPlots[oldPlotIndex] = newPlot;
    //             currentPlots[newPlotIndex] = oldPlot;
    //
    //             this.removePlot(oldPlot).subscribe(() => {
    //                 if (notify) {
    //                     this.newPlot$.next();
    //                 }
    //
    //                 subject.next();
    //                 subject.complete();
    //             });
    //         });
    //     });
    //
    //     return subject.asObservable();
    // }
    //
    // /**
    //  * Remove a plot from the project.
    //  */
    // removePlot(plot: Plot): Observable<void> {
    //     const subject: Subject<void> = new ReplaySubject<void>(1);
    //
    //     this.project$.pipe(first()).subscribe(project => {
    //         const plots = [...project.plots];
    //         const plotIndex = plots.indexOf(plot);
    //         if (plotIndex >= 0) {
    //             plots.splice(plotIndex, 1);
    //             this.changeProjectConfig({
    //                 plots
    //             }).subscribe(() => {
    //                 this.plotSubscriptions.get(plot).unsubscribe();
    //                 this.plotSubscriptions.delete(plot);
    //
    //                 this.plotDataState$.get(plot).complete();
    //                 this.plotDataState$.delete(plot);
    //
    //                 this.plotData$.get(plot).complete();
    //                 this.plotData$.delete(plot);
    //
    //                 subject.next();
    //                 subject.complete();
    //             });
    //         }
    //     });
    //
    //     return subject.asObservable();
    // }
    //
    // /**
    //  * Reload the data for the plot manually (e.g. on error).
    //  */
    // reloadPlot(plot: Plot) {
    //     this.plotData$.get(plot).next(undefined); // send empty data
    //
    //     this.plotSubscriptions.get(plot).unsubscribe();
    //     this.plotSubscriptions.delete(plot);
    //
    //     const loadingState$ = this.plotDataState$.get(plot);
    //
    //     const subscription = this.createPlotSubscription(plot, this.plotData$.get(plot), loadingState$);
    //
    //     this.plotSubscriptions.set(plot, subscription);
    // }
    //
    // /**
    //  * Retrieve the plot models array as a stream.
    //  */
    // getPlotStream(): Observable<Array<Plot>> {
    //     return this.project$.pipe(map(project => project.plots), distinctUntilChanged());
    // }
    //
    // /**
    //  * Retrieve the data of the plot as a stream.
    //  */
    // getPlotDataStream(plot: Plot): Observable<PlotData> {
    //     return this.plotData$.get(plot);
    // }
    //
    // /**
    //  * Retrieve the plot status as a stream.
    //  */
    // getPlotDataStatusStream(plot: Plot): Observable<LoadingState> {
    //     return this.plotDataState$.get(plot);
    // }
    //
    // /**
    //  * Remove all plots from a project.
    //  */
    // clearPlots() {
    //     this.project$.pipe(first()).subscribe(project => {
    //         for (const plot of project.plots.slice(0)) {
    //             this.removePlot(plot);
    //         }
    //     });
    // }
    //
    // /**
    //  * Get a stream which is triggered when a new plot is generated.
    //  */
    // getNewPlotStream(): Observable<void> {
    //     return this.newPlot$;
    // }
    //
    // /**
    //  * Changes the display name of a plot.
    //  * @param plot The plot to modify
    //  * @param newName The new layer name
    //  */
    // changePlotName(plot: Plot, newName: string) {
    //     const newPlot = new Plot({
    //         name: newName,
    //         operator: plot.operator,
    //     });
    //
    //     this.project$.pipe(first()).subscribe(project => {
    //         const plots = project.plots;
    //         const plotIndex = plots.indexOf(plot);
    //         plots.splice(plotIndex, 1, newPlot);
    //
    //         this.changeProjectConfig({
    //             plots: [...plots],
    //         }).subscribe(() => {
    //             this.plotSubscriptions.set(newPlot, this.plotSubscriptions.get(plot));
    //             this.plotSubscriptions.delete(plot);
    //
    //             this.plotDataState$.set(newPlot, this.plotDataState$.get(plot));
    //             this.plotDataState$.delete(plot);
    //
    //             this.plotData$.set(newPlot, this.plotData$.get(plot));
    //             this.plotData$.delete(plot);
    //         });
    //     });
    // }

    registerWorkflow(workflow: { [key: string]: any }): Observable<UUID> {
        return this.userService.getSessionStream().pipe(
            mergeMap(session => this.backend.registerWorkflow(workflow, session.sessionToken)),
            map(response => response.id),
        );
    }

    /**
     * Add a a new layer to the project.
     */
    addLayer(layer: Layer, notify = true): Observable<void> {
        this.createLayerDataStreams(layer);
        this.createLayerChangesStream(layer);

        const subject = new Subject<void>();

        combineLatest([
            this.userService.getSessionStream().pipe(
                first(),
                map(session => session.sessionToken),
            ),
            this.project$.pipe(first()),
        ]).pipe(
            mergeMap(([sessionToken, project]) => this.backend.updateProject({
                id: project.id,
                layers: [
                    layer.toDict(),
                    ...project.layers.map(l => l.toDict()),
                ],
            }, sessionToken).pipe(
                map(() => project)
            )),
            mergeMap(project => this.changeProjectConfig({
                layers: [layer, ...project.layers]
            }))
        ).subscribe(
            () => subject.next(),
            error => subject.error(error),
            () => subject.complete()
        );

        // const subject: Subject<void> = new ReplaySubject<void>(1);
        //
        // this.project$.pipe(first()).subscribe(project => {
        //     const currentLayers = project.layers;
        //     this.changeProjectConfig({
        //         layers: [layer, ...currentLayers]
        //     }).subscribe(() => {
        //         if (notify) {
        //             this.newLayer$.next(layer);
        //         }
        //
        //         // console.log("ADD LAYER", layer, this);
        //
        //         subject.next();
        //         subject.complete();
        //     });
        // });

        return subject.asObservable();
    }

    // /**
    //  * Remove a plot from the project.
    //  */
    // removeLayer(layer: Layer<AbstractSymbology>): Observable<void> {
    //     const subject: Subject<void> = new ReplaySubject<void>(1);
    //
    //     if (this.layerService.getSelectedLayer() === layer) {
    //         this.layerService.setSelectedLayer(undefined);
    //     }
    //
    //     this.project$.pipe(first()).subscribe(project => {
    //         // const layers = Array.fromRgbaLike(this.getProject().layers);
    //         const layers = [...project.layers];
    //         const layerIndex = layers.indexOf(layer);
    //         // console.log("REMOVE LAYER", layer, layers, layerIndex);
    //         if (layerIndex >= 0) {
    //             layers.splice(layerIndex, 1);
    //             // console.log("REMOVE LAYER 2", removedLayers, layers);
    //             this.changeProjectConfig({
    //                 layers
    //             }).subscribe(() => {
    //                 this.layerDataSubscriptions.get(layer).unsubscribe();
    //                 this.layerDataSubscriptions.delete(layer);
    //                 this.layerDataState$.get(layer).complete();
    //                 this.layerDataState$.delete(layer);
    //                 this.layerData$.get(layer).complete();
    //                 this.layerData$.delete(layer);
    //
    //                 this.layerProvenanceDataSubscriptions.get(layer).unsubscribe();
    //                 this.layerProvenanceDataSubscriptions.delete(layer);
    //                 this.layerProvenanceDataState$.get(layer).complete();
    //                 this.layerProvenanceDataState$.delete(layer);
    //                 this.layerProvenanceData$.get(layer).complete();
    //                 this.layerProvenanceData$.delete(layer);
    //
    //                 const symbologyDataSubscription = this.layerSymbologyDataSubscriptions.get(layer);
    //                 if (symbologyDataSubscription) {
    //                     symbologyDataSubscription.unsubscribe();
    //                 }
    //                 this.layerSymbologyDataSubscriptions.delete(layer);
    //                 const symbologyDataState = this.layerSymbologyDataState$.get(layer);
    //                 if (symbologyDataState) {
    //                     symbologyDataState.complete();
    //                 }
    //                 this.layerSymbologyDataState$.delete(layer);
    //                 const lsd = this.layerSymbologyData$.get(layer);
    //                 if (lsd) {
    //                     lsd.complete();
    //                 }
    //                 this.layerSymbologyData$.delete(layer);
    //                 this.layerCombinedState$.delete(layer);
    //
    //                 subject.next();
    //                 subject.complete();
    //             });
    //         }
    //     });
    //
    //     this.layerChanges$.get(layer).complete();
    //     this.layerChanges$.delete(layer);
    //
    //     return subject.asObservable();
    // }
    //
    // /**
    //  * Reload the data of a layer.
    //  */
    // reloadLayerData(layer: Layer<AbstractSymbology>) {
    //     this.layerData$.get(layer).next(undefined); // send empty data
    //
    //     if (this.layerDataSubscriptions.has(layer)) {
    //         this.layerDataSubscriptions.get(layer).unsubscribe();
    //         this.layerDataSubscriptions.delete(layer);
    //     }
    //
    //     switch (layer.getLayerType()) {
    //         case 'raster': {
    //             this.layerDataSubscriptions.set(layer,
    //                 this.createRasterLayerDataSubscription(
    //                     layer as RasterLayer<AbstractRasterSymbology>,
    //                     (this.layerData$.get(layer) as Observer<RasterData>),
    //                     this.layerDataState$.get(layer)
    //                 )
    //             );
    //             break;
    //         }
    //         case 'vector': {
    //             this.layerDataSubscriptions.set(layer,
    //                 this.createVectorLayerDataSubscription(
    //                     layer as VectorLayer<AbstractVectorSymbology>,
    //                     (this.layerData$.get(layer) as Observer<VectorData>),
    //                     this.layerDataState$.get(layer)
    //                 )
    //             );
    //             break;
    //         }
    //
    //     }
    // }
    //
    // /**
    //  * Reload everything for the layer manually (e.g. on error).
    //  */
    // reloadLayer(layer: Layer<AbstractSymbology>) {
    //     this.layerData$.get(layer).next(undefined); // send empty data
    //
    //     if (this.layerDataSubscriptions.has(layer)) {
    //         this.layerDataSubscriptions.get(layer).unsubscribe();
    //         this.layerDataSubscriptions.delete(layer);
    //     }
    //
    //     if (this.layerProvenanceDataSubscriptions.has(layer)) {
    //         this.layerProvenanceDataSubscriptions.get(layer).unsubscribe();
    //         this.layerProvenanceDataSubscriptions.delete(layer);
    //     }
    //
    //     if (this.layerSymbologyDataSubscriptions.has(layer)) {
    //         this.layerSymbologyDataSubscriptions.get(layer).unsubscribe();
    //         this.layerSymbologyDataSubscriptions.delete(layer);
    //     }
    //
    //     switch (layer.getLayerType()) {
    //         case 'raster': {
    //             this.layerDataSubscriptions.set(layer,
    //                 this.createRasterLayerDataSubscription(
    //                     layer as RasterLayer<AbstractRasterSymbology>,
    //                     (this.layerData$.get(layer) as Observer<RasterData>),
    //                     this.layerDataState$.get(layer)
    //                 )
    //             );
    //             this.layerSymbologyDataSubscriptions.set(layer,
    //                 this.createRasterLayerSymbologyDataSubscription(
    //                     layer as RasterLayer<AbstractRasterSymbology>,
    //                     this.layerSymbologyData$.get(layer) as Observer<DeprecatedMappingColorizerDoNotUse>,
    //                     this.layerSymbologyDataState$.get(layer)));
    //             break;
    //         }
    //         case 'vector': {
    //             this.layerDataSubscriptions.set(layer,
    //                 this.createVectorLayerDataSubscription(
    //                     layer as VectorLayer<AbstractVectorSymbology>,
    //                     (this.layerData$.get(layer) as Observer<VectorData>),
    //                     this.layerDataState$.get(layer)
    //                 )
    //             );
    //             break;
    //         }
    //
    //     }
    //
    //     this.layerProvenanceDataSubscriptions.set(layer,
    //         this.createLayerProvenanceSubscription(
    //             layer,
    //             this.layerProvenanceData$.get(layer),
    //             this.layerProvenanceDataState$.get(layer)
    //         )
    //     );
    // }

    /**
     * Retrieve the layer models array as a stream.
     */
    getLayerStream(): Observable<Array<Layer>> {
        return this.project$.pipe(map(project => project.layers), distinctUntilChanged());
    }

    /**
     * Retrieve the data of the layer as a stream.
     */
    getLayerDataStream(layer: Layer): Observable<any> {
        return this.layerData$.get(layer.id);
    }

    /**
     * Retrieve the layer data status as a stream.
     */
    getLayerDataStatusStream(layer: Layer): Observable<LoadingState> {
        return this.layerDataState$.get(layer.id);
    }

    /**
     * Change the loading state of a raster layer
     */
    changeRasterLayerDataStatus(layer: Layer, state: LoadingState) {
        if (layer.layerType === 'raster') {
            this.layerDataState$.get(layer.id).next(state);
        } else {
            throw Error('It is only allowed to change the state of a raster layer');
        }
    }

    // /**
    //  * Retrieve the symbology data of the layer as a stream.
    //  */
    // getLayerSymbologyDataStream(layer: Layer<AbstractSymbology>): Observable<DeprecatedMappingColorizerDoNotUse> {
    //     return this.layerSymbologyData$.get(layer);
    // }
    //
    // /**
    //  * Retrieve the layer symbology data status as a stream.
    //  */
    // getLayerSymbologyDataStatusStream(layer: Layer<AbstractSymbology>): Observable<LoadingState> {
    //     return this.layerSymbologyDataState$.get(layer);
    // }
    //
    // /**
    //  * Retrieve the provenance data of the layer as a stream.
    //  */
    // getLayerProvenanceDataStream(layer: Layer<AbstractSymbology>): Observable<Array<Provenance>> {
    //     return this.layerProvenanceData$.get(layer);
    // }
    //
    // /**
    //  * Retrieve the layer provenance status as a stream.
    //  */
    // getLayerProvenanceDataStatusStream(layer: Layer<AbstractSymbology>): Observable<LoadingState> {
    //     return this.layerProvenanceDataState$.get(layer);
    // }
    //
    // getLayerCombinedStatusStream(layer: Layer<AbstractSymbology>): Observable<LoadingState> {
    //     return this.layerCombinedState$.get(layer);
    // }
    //
    // /**
    //  * Remove all layers from a project.
    //  */
    // clearLayers(): Observable<void> {
    //     const subject: Subject<void> = new ReplaySubject<void>(1);
    //
    //     this.project$.pipe(first()).subscribe(project => {
    //         const removeObservables = [];
    //
    //         for (const layer of project.layers.slice(0)) {
    //             removeObservables.push(this.removeLayer(layer));
    //         }
    //
    //         observableCombineLatest(removeObservables).pipe(
    //             first())
    //             .subscribe(
    //                 () => {
    //                     subject.next();
    //                     subject.complete();
    //                 },
    //                 error => subject.error(error)
    //             );
    //     });
    //
    //     return subject.asObservable();
    // }
    //
    // /**
    //  * Get the stream of new layers.
    //  */
    // getNewLayerStream(): Observable<Layer<AbstractSymbology>> {
    //     return this.newLayer$;
    // }

    /**
     * Sets the layers
     */
    setLayers(layers: Array<Layer>) {
        this.project$.pipe(first()).subscribe(project => {
            if (project.layers !== layers) {
                this.changeProjectConfig({layers});
            }
        });
    }

    // /**
    //  * Changes the display name of a layer.
    //  * @param layer The layer to modify
    //  * @param changes A set of changes to apply to the layer
    //  */
    // changeLayer(layer: Layer<AbstractSymbology>, changes: LayerChanges<AbstractSymbology>) {
    //     // change mutably
    //     const validChanges = layer._changeUnderlyingData(changes);
    //
    //     // FIXME: we don't use the mappig colorizer anymore
    //     if (layer instanceof RasterLayer && layer.symbology instanceof AbstractRasterSymbology) {
    //         const symbologyDataSybscription = this.createRasterLayerSymbologyDataSubscription(
    //             layer as RasterLayer<AbstractRasterSymbology>,
    //             this.layerSymbologyData$.get(layer),
    //             this.layerSymbologyDataState$.get(layer),
    //         );
    //
    //         this.layerSymbologyDataSubscriptions.get(layer).unsubscribe();
    //         this.layerSymbologyDataSubscriptions.set(layer, symbologyDataSybscription);
    //     }
    //
    //     // check if there are valid changes and update the project
    //     if (Object.keys(validChanges).length > 0) {
    //         this.getLayerStream().pipe(first()).subscribe(layers => {
    //             this.changeProjectConfig({
    //                 layers,
    //             });
    //         });
    //
    //         // populate the valid changes
    //         this.layerChanges$.get(layer).next(validChanges);
    //     }
    // }

    changeLayerMetadata(layer: Layer, changes: {
        name?: string,
        workflowId?: UUID,
        symbology?: AbstractSymbology,
    }): Observable<void> {
        const subject = new Subject<void>();

        if (Object.keys(changes).length === 0) {
            subject.next();
            subject.complete();
            return subject;
        }

        combineLatest([
            this.userService.getSessionTokenForRequest(),
            this.project$,
        ]).pipe(
            first(),
            mergeMap(([sessionToken, project]) => {
                let newLayer: Layer;

                if (layer instanceof VectorLayer) {
                    newLayer = new VectorLayer({
                        id: layer.id,
                        name: changes.name || layer.name,
                        workflowId: changes.workflowId || layer.workflowId,
                        isVisible: layer.isVisible,
                        isLegendVisible: layer.isLegendVisible,
                        symbology: changes.symbology as VectorSymbology || layer.symbology,
                    });
                } else if (layer instanceof RasterLayer) {
                    newLayer = new RasterLayer({
                        id: layer.id,
                        name: changes.name || layer.name,
                        workflowId: changes.workflowId || layer.workflowId,
                        isVisible: layer.isVisible,
                        isLegendVisible: layer.isLegendVisible,
                        symbology: changes.symbology as MappingRasterSymbology || layer.symbology,
                    });
                } else {
                    throw new Error('unknown layer type');
                }

                const newLayers = project.layers.map(oldLayer => {
                    if (oldLayer.id === newLayer.id) {
                        return newLayer;
                    } else {
                        return oldLayer;
                    }
                });

                return this.backend.updateProject({
                    id: project.id,
                    layers: newLayers.map(l => l.toDict()),
                }, sessionToken).pipe(
                    tap(() => {
                        this.layers.get(newLayer.id).next(newLayer);
                        // TODO: call `changeProjectConfig`
                        this.project$.next(new Project({
                            id: project.id,
                            name: project.name,
                            spatialReference: project.spatialReference,
                            time: project.time,
                            plots: project.plots,
                            layers: newLayers,
                            timeStepDuration: project.timeStepDuration,
                        }));
                    })
                );
            }),
        ).subscribe(
            () => subject.next(),
            error => subject.error(error),
            () => subject.complete(),
        );

        return subject;
    }

    /**
     * Get a stream of LayerChanges for a specified layer.
     */
    getLayerChangesStream(layer: Layer): Observable<Layer> {
        return this.layers.get(layer.id);
    }

    // /**
    //  * Toggle the layer (extension).
    //  * @param layer The layer to modify
    //  */
    // toggleSymbology(layer: Layer<AbstractSymbology>) {
    //     this.changeLayer(layer, {expanded: !layer.expanded});
    // }
    //
    // /**
    //  * Toggle layer symbology edit.
    //  */
    // toggleEditSymbology(layer: Layer<AbstractSymbology>) {
    //     this.changeLayer(layer, {editSymbology: !layer.editSymbology});
    // }

    private changeProjectConfig(config: {
        id?: UUID,
        name?: string,
        spatialReference?: SpatialReference,
        time?: Time,
        plots?: Array<any>,
        layers?: Array<Layer>,
        timeStepDuration?: TimeStepDuration,
    }): Observable<void> {
        // console.log('Project::ProjectService.changeProjectConfig', config);

        const subject: Subject<void> = new ReplaySubject<void>(1);

        this.project$.pipe(first()).subscribe(
            project => {
                this.project$.next(new Project({
                    id: config.id ? config.id : project.id,
                    name: config.name ? config.name : project.name,
                    spatialReference: config.spatialReference ? config.spatialReference : project.spatialReference,
                    time: config.time ? config.time : project.time,
                    plots: config.plots ? config.plots : project.plots,
                    layers: config.layers ? config.layers : project.layers,
                    timeStepDuration: config.timeStepDuration ? config.timeStepDuration : project.timeStepDuration,
                }));
                subject.next();
                subject.complete();
            },
            error => subject.error(error)
        );

        return subject.asObservable();
    }

    // /**
    //  * Create a subscription for plot data with loading state checks and error handling
    //  */
    // private createPlotSubscription(plot: Plot, data$: Observer<PlotData>, loadingState$: Observer<LoadingState>): Subscription {
    //     const operatorType = plot.operator.operatorType;
    //     const operatorTypeMappingDict = operatorType.toMappingDict();
    //     const isRScriptPlot = operatorType.getMappingName() === 'r_script' && operatorTypeMappingDict['result'] === 'plot';
    //
    //     const observables: Array<Observable<any>> = [
    //         this.getTimeStream(),
    //         this.mapService.getViewportSizeStream(),
    //         this.getProjectionStream(),
    //     ];
    //     if (isRScriptPlot) {
    //         observables.push();
    //         observables.push(this.layoutService.getSidenavWidthStream());
    //     }
    //
    //     return observableCombineLatest(observables).pipe(
    //         debounceTime(this.config.DELAYS.DEBOUNCE),
    //         tap(() => loadingState$.next(LoadingState.LOADING)),
    //         switchMap(([time, viewport, projection, sidenavWidth]) => {
    //             let plotWidth;
    //             let plotHeight;
    //
    //             if (isRScriptPlot) {
    //                 const margin = 2 * LayoutService.remInPx;
    //                 plotWidth = sidenavWidth - margin;
    //                 plotHeight = sidenavWidth - margin;
    //             }
    //
    //             return this.mappingQueryService.getPlotData({
    //                 operator: plot.operator,
    //                 time,
    //                 extent: viewport.extent,
    //                 projection,
    //                 plotWidth,
    //                 plotHeight,
    //             });
    //         }),
    //         tap(
    //             () => loadingState$.next(LoadingState.OK),
    //             (reason: Response) => {
    //                 this.notificationService.error(`${plot.name}: ${reason.status} ${reason.statusText}`);
    //                 loadingState$.next(LoadingState.ERROR);
    //             }
    //         ),
    //     ).subscribe(
    //         data => data$.next(data),
    //         error => error // ignore error
    //     );
    // }
    //
    // private createPlotDataStreams(plot: Plot) {
    //     const loadingState$ = new ReplaySubject<LoadingState>(1);
    //     const data$ = new ReplaySubject<PlotData>(1);
    //
    //     const subscription = this.createPlotSubscription(plot, data$, loadingState$);
    //     this.plotSubscriptions.set(plot, subscription);
    //
    //     this.plotDataState$.set(plot, loadingState$);
    //     this.plotData$.set(plot, data$);
    // }
    //
    // private deletePlotDataStreams(plot: Plot) {
    //     this.plotData$.get(plot).complete();
    //     this.plotData$.delete(plot);
    //
    //     this.plotDataState$.get(plot).complete();
    //     this.plotDataState$.delete(plot);
    //
    //     this.plotSubscriptions.get(plot).unsubscribe();
    //     this.plotSubscriptions.delete(plot);
    // }

    private createLayerDataStreams(layer: Layer) {
        // each layer has data. The type depends on the layer type
        const layerDataLoadingState$ = new ReplaySubject<LoadingState>(1);
        const layerData$ = new ReplaySubject<LayerData>(1);
        let layerDataSub: Subscription;
        switch (layer.layerType) {
            case 'raster':
                layerDataSub = this.createRasterLayerDataSubscription(
                    layer as RasterLayer, layerData$, layerDataLoadingState$
                );
                break;
            case 'vector':
                layerDataSub = this.createVectorLayerDataSubscription(
                    layer as VectorLayer, layerData$, layerDataLoadingState$
                );
                break;
        }
        this.layerDataSubscriptions.set(layer.id, layerDataSub);
        this.layerDataState$.set(layer.id, layerDataLoadingState$);
        this.layerData$.set(layer.id, layerData$);

        // const symbologyDataLoadingState$ = new ReplaySubject<LoadingState>(1);
        // const symbologyData$ = new ReplaySubject<DeprecatedMappingColorizerDoNotUse>(1);
        // this.layerSymbologyDataState$.set(layer, symbologyDataLoadingState$);
        // this.layerSymbologyData$.set(layer, symbologyData$);

        // if (layer.getLayerType() === 'raster') {
        //     const symbologyDataSubscription = this.createRasterLayerSymbologyDataSubscription(layer
        //     as RasterLayer<AbstractRasterSymbology>,
        //         symbologyData$,
        //         symbologyDataLoadingState$
        //     );
        //     this.layerSymbologyDataSubscriptions.set(layer, symbologyDataSubscription);
        // } else {
        //     symbologyDataLoadingState$.next(LoadingState.OK);
        // }

        // each layer has provenance...
        // const provenanceDataLoadingState$ = new ReplaySubject<LoadingState>(1);
        // const provenanceData$ = new ReplaySubject<Array<Provenance>>(1);
        // const provenanceSub = this.createLayerProvenanceSubscription(layer, provenanceData$, provenanceDataLoadingState$);
        // this.layerProvenanceDataSubscriptions.set(layer, provenanceSub);
        // this.layerProvenanceDataState$.set(layer, provenanceDataLoadingState$);
        // this.layerProvenanceData$.set(layer, provenanceData$);
        //
        // const combinedState$ = observableCombineLatest([
        //     this.layerSymbologyDataState$.get(layer),
        //     this.layerDataState$.get(layer),
        //     this.layerProvenanceDataState$.get(layer),
        // ]).pipe(
        //     map(([sym, data, prov]) => {
        //         // console.log("combinedLayerState", sym, data, prov);
        //
        //         if (sym === LoadingState.LOADING || data === LoadingState.LOADING /*|| prov === LoadingState.LOADING*/) {
        //             return LoadingState.LOADING;
        //         }
        //
        //         if (sym === LoadingState.ERROR || data === LoadingState.ERROR /*|| prov === LoadingState.ERROR*/) {
        //             return LoadingState.ERROR;
        //         }
        //
        //         if (sym === LoadingState.NODATAFORGIVENTIME || data === LoadingState.NODATAFORGIVENTIME) {
        //             return LoadingState.NODATAFORGIVENTIME;
        //         }
        //
        //         return LoadingState.OK;
        //     }),
        //     catchError(err => {
        //         return observableOf(LoadingState.ERROR);
        //     }),
        // );
        //
        // this.layerCombinedState$.set(layer, combinedState$);
    }

    /**
     * Create a subscription for layer data, symbology and provenance with loading state checks and error handling
     */
    private createRasterLayerDataSubscription(layer: RasterLayer, data$: Observer<RasterData>,
                                              loadingState$: Observer<LoadingState>): Subscription {
        return combineLatest([
            this.getTimeStream(),
            this.getProjectionStream(),
        ]).pipe(
            tap(() => loadingState$.next(LoadingState.LOADING)),
            map(([time, projection]) => new RasterData(
                time,
                projection,
                // this.mappingQueryService.getWMSQueryUrl({
                //     operator: layer.operator,
                //     time,
                //     projection,
                // })
                this.backend.wmsUrl,
            )),
            tap(
                () => loadingState$.next(LoadingState.OK),
                (reason: HttpErrorResponse) => {
                    // if (ProjectService.isNoRasterForGivenTimeException(reason)) {
                    //     this.notificationService.error(`${layer.name}: No Raster for the given Time`);
                    //     loadingState$.next(LoadingState.NODATAFORGIVENTIME);
                    // } else {
                    this.notificationService.error(`${layer.name}: ${reason.status} ${reason.statusText}`);
                    loadingState$.next(LoadingState.ERROR);
                    // }
                }
            ),
        ).subscribe(
            data => data$.next(data),
            error => error // ignore error
        );
    }

    /**
     * Create a subscription for layer data, symbology and provenance with loading state checks and error handling
     */
    private createVectorLayerDataSubscription(layer: VectorLayer,
                                              data$: Observer<VectorData>,
                                              loadingState$: Observer<LoadingState>): Subscription {
        return combineLatest([
            this.getTimeStream(),
            combineLatest([
                this.getProjectionStream(),
                this.mapService.getViewportSizeStream()
            ]).pipe(
                debounceTime(this.config.DELAYS.DEBOUNCE)
            ),
            this.userService.getSessionTokenForRequest(),
        ]).pipe(
            tap(() => loadingState$.next(LoadingState.LOADING)),
            switchMap(([time, [projection, viewportSize], sessionToken]) => {
                const requestExtent: [number, number, number, number] = [0, 0, 0, 0];

                // let clusteredOption;
                // TODO: is clustering a property of a layer or the symbology?
                // if (layer.clustered && layer.symbology instanceof PointSymbology) {
                //     clusteredOption = {
                //         minRadius: layer.symbology.radius,
                //     };
                // }

                return this.backend.wfsGetFeature({
                    typeNames: `registry:${layer.workflowId}`,
                    bbox: extentToBboxDict(viewportSize.extent),
                    time: time.toDict(),
                    srsName: projection.getCode(),
                }, sessionToken).pipe(
                    map(x => VectorData.olParse(time, projection, requestExtent, x))
                );

                // return this.mappingQueryService.getWFSData({
                //     operator: layer.operator,
                //     time,
                //     projection,
                //     clusteredOption,
                //     outputFormat: WFSOutputFormats.JSON,
                //     viewportSize
                // }).pipe(map(x => VectorData.olParse(time, projection, requestExtent, x)));
            }),
            tap(
                () => loadingState$.next(LoadingState.OK),
                (reason: Response) => {
                    this.notificationService.error(`${layer.name}: ${reason}`);
                    loadingState$.next(LoadingState.ERROR);
                }
            ),
        ).subscribe(
            data => data$.next(data),
            error => error // ignore error
        );
    }

    // /**
    //  * Create a subscription for layer data, symbology and provenance with loading state checks and error handling
    //  */
    // private createLayerProvenanceSubscription(layer: Layer<AbstractSymbology>, provenance$: Observer<{}>,
    //                                           loadingState$: Observer<LoadingState>): Subscription {
    //     return observableCombineLatest([
    //         this.getTimeStream(),
    //         this.getProjectionStream(),
    //     ]).pipe(
    //         tap(() => loadingState$.next(LoadingState.LOADING)),
    //         switchMap(([time, projection]) => {
    //             return this.mappingQueryService.getProvenance({
    //                 operator: layer.operator,
    //                 time,
    //                 projection,
    //                 extent: projection.getExtent(),
    //             });
    //         }),
    //         tap(
    //             () => loadingState$.next(LoadingState.OK),
    //             (reason: HttpErrorResponse) => {
    //                 if (ProjectService.isNoRasterForGivenTimeException(reason)) {
    //                     this.notificationService.error(`${layer.name}: No Raster for the given Time`);
    //                     loadingState$.next(LoadingState.NODATAFORGIVENTIME);
    //                 } else {
    //                     this.notificationService.error(`${layer.name}: ${reason.status} ${reason.statusText}`);
    //                     loadingState$.next(LoadingState.ERROR);
    //                 }
    //             }
    //         ),
    //     ).subscribe(
    //         data => provenance$.next(data),
    //         error => error // ignore error
    //     );
    // }
    //
    // /**
    //  * Create a subscription for layer data, symbology and provenance with loading state checks and error handling
    //  */
    // private createRasterLayerSymbologyDataSubscription(layer: RasterLayer<AbstractRasterSymbology>,
    //                                                    data$: Observer<DeprecatedMappingColorizerDoNotUse>,
    //                                                    loadingState$: Observer<LoadingState>): Subscription {
    //     return observableCombineLatest([
    //         this.getTimeStream(),
    //         this.getProjectionStream(),
    //     ]).pipe(
    //         tap(() => loadingState$.next(LoadingState.LOADING)),
    //         switchMap(([time, projection]) => {
    //             return this.mappingQueryService.getColorizer(layer.operator, time, projection).pipe(
    //                 tap(() => loadingState$.next(LoadingState.OK)),
    //                 catchError((reason: HttpErrorResponse) => {
    //                     if (ProjectService.isNoRasterForGivenTimeException(reason)) {
    //                         this.notificationService.error(`${layer.name}: No Raster for the given Time`);
    //                         loadingState$.next(LoadingState.NODATAFORGIVENTIME);
    //                     } else {
    //                         this.notificationService.error(`${layer.name}: ${reason.status} ${reason.statusText}`);
    //                         loadingState$.next(LoadingState.ERROR);
    //                     }
    //                     return observableOf({interpolation: 'unknown', breakpoints: []});
    //                 }),
    //             );
    //         }),
    //     ).subscribe(
    //         data => data$.next(data),
    //         error => error // ignore error
    //     );
    // }

    private createLayerChangesStream(layer: Layer) {
        if (this.layers.get(layer.id)) {
            throw new Error('Layer changes stream already registered');
        }
        this.layers.set(layer.id, new ReplaySubject<Layer>(1));
    }

    // private static isNoRasterForGivenTimeException(response: HttpErrorResponse): boolean {
    //     if (!response.error || !response.error.nested_exception) {
    //         return false;
    //     }
    //     const nested_exception: { message: string, type: string } = response.error.nested_exception;
    //     return nested_exception.message.indexOf('NoRasterForGivenTimeException') >= 0;
    // }
}
