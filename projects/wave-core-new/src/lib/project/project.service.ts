import {BehaviorSubject, combineLatest, Observable, Observer, of, ReplaySubject, Subject, Subscription} from 'rxjs';
import {debounceTime, distinctUntilChanged, first, map, mergeMap, switchMap, tap} from 'rxjs/operators';

import {Injectable} from '@angular/core';

import {SpatialReference, SpatialReferences} from '../operators/spatial-reference.model';
import {Project} from './project.model';
import {Time, TimeStepDuration, timeStepDurationToTimeStepDict} from '../time/time.model';
import {Config} from '../config.service';
import {LoadingState} from './loading-state.model';
import {NotificationService} from '../notification.service';
import {HttpErrorResponse} from '@angular/common/http';
import {LayoutService} from '../layout.service';
import {HasLayerId, HasLayerType, Layer, RasterLayer, VectorLayer} from '../layers/layer.model';
import {BackendService} from '../backend/backend.service';
import {
    LayerDict,
    OperatorDict,
    PlotDict,
    RasterResultDescriptorDict,
    ResultDescriptorDict,
    SourceOperatorDict,
    ToDict,
    UUID,
    VectorResultDescriptorDict,
    WorkflowDict,
} from '../backend/backend.model';
import {UserService} from '../users/user.service';
import {LayerData, RasterData, VectorData} from '../layers/layer-data.model';
import {extentToBboxDict} from '../util/conversions';
import {MapService} from '../map/map.service';
import {Session} from '../users/session.model';
import {HasPlotId, Plot} from '../plots/plot.model';
import {LayerMetadata, RasterLayerMetadata, VectorLayerMetadata} from '../layers/layer-metadata.model';
import {Symbology} from '../layers/symbology/symbology.model';
import OlFeature from 'ol/Feature';
import {getProjectionTarget} from '../util/spatial_reference';

export type FeatureId = string | number;

export interface FeatureSelection {
    feature?: FeatureId;
}

/***
 * The ProjectService is the main housekeeping component of WAVE.
 * All layers, plots, and provenance are registered with the ProjectService.
 */
@Injectable()
export class ProjectService {
    private project$ = new ReplaySubject<Project>(1);

    private readonly layers = new Map<number, ReplaySubject<Layer>>();
    private readonly layerState$ = new Map<number, Observable<LoadingState>>();

    private readonly layerMetadata$ = new Map<number, ReplaySubject<LayerMetadata>>();
    private readonly layerMetadataState$ = new Map<number, ReplaySubject<LoadingState>>();

    private readonly layerData$ = new Map<number, ReplaySubject<LayerData>>();
    private readonly layerDataState$ = new Map<number, ReplaySubject<LoadingState>>();
    private readonly layerDataSubscriptions = new Map<number, Subscription>();

    private readonly newLayer$ = new Subject<void>();

    private readonly plotData$ = new Map<number, ReplaySubject<any>>();
    private readonly plotDataState$ = new Map<number, ReplaySubject<LoadingState>>();
    private readonly plotDataSubscriptions = new Map<number, Subscription>();
    private readonly newPlot$ = new Subject<void>();

    private readonly selectedFeature$ = new BehaviorSubject<FeatureSelection>({feature: undefined});

    constructor(
        protected config: Config,
        protected notificationService: NotificationService,
        protected mapService: MapService,
        protected backend: BackendService,
        protected userService: UserService,
        protected layoutService: LayoutService,
    ) {
        // set the starting project upon login
        this.userService
            .getSessionStream()
            .pipe(mergeMap((session) => this.loadMostRecentProject(session)))
            .subscribe((project) => this.setProject(project));
    }

    /**
     * Generate a default Project with values from the config file.
     */
    createDefaultProject(): Observable<Project> {
        const name = this.config.DEFAULTS.PROJECT.NAME;
        const spatialReference = SpatialReferences.fromCode(this.config.DEFAULTS.PROJECT.PROJECTION);
        const time = new Time(this.config.DEFAULTS.PROJECT.TIME, this.config.DEFAULTS.PROJECT.TIME);
        const timeStepDuration = this.getDefaultTimeStep();

        // TODO: solidify default project creation

        return this.createProject({
            name,
            description: 'Default project',
            spatialReference,
            time,
            timeStepDuration,
        });
    }

    /**
     * Generate a default Project with values from the config file.
     */
    createProject(config: {
        name: string;
        description: string;
        spatialReference: SpatialReference;
        time: Time;
        timeStepDuration: TimeStepDuration;
    }): Observable<Project> {
        return this.userService.getSessionTokenForRequest().pipe(
            mergeMap((sessionToken) =>
                this.backend.createProject(
                    {
                        name: config.name,
                        description: config.description,
                        bounds: {
                            boundingBox: extentToBboxDict(config.spatialReference.getExtent()),
                            spatialReference: config.spatialReference.getCode(),
                            timeInterval: config.time.toDict(),
                        },
                        timeStep: timeStepDurationToTimeStepDict(config.timeStepDuration),
                    },
                    sessionToken,
                ),
            ),
            map(
                ({id}) =>
                    new Project({
                        id,
                        name: config.name,
                        description: config.description,
                        spatialReference: config.spatialReference,
                        layers: [],
                        plots: [],
                        time: config.time,
                        timeStepDuration: config.timeStepDuration,
                    }),
            ),
        );
    }

    cloneProject(newName: string): Observable<Project> {
        return this.getProjectOnce().pipe(
            mergeMap((project) =>
                combineLatest([
                    of(project),
                    this.createProject({
                        name: newName,
                        description: project.description,
                        spatialReference: project.spatialReference,
                        time: project.time,
                        timeStepDuration: project.timeStepDuration,
                    }),
                ]),
            ),
            mergeMap(([oldProject, newPartialProject]) =>
                combineLatest([
                    of(
                        newPartialProject.updateFields({
                            layers: oldProject.layers,
                            plots: oldProject.plots,
                        }),
                    ),
                    this.userService.getSessionTokenForRequest(),
                ]),
            ),
            mergeMap(([project, sessionToken]) =>
                combineLatest([
                    of(project),
                    this.backend.updateProject(
                        {
                            id: project.id,
                            layers: project.layers.map((layer) => layer.toDict()),
                            // TODO: plots
                        },
                        sessionToken,
                    ),
                ]),
            ),
            map(([project, _]) => project),
        );
    }

    /**
     * Get a stream of Projects. This way compments can react to new Projects.
     */
    getProjectStream(): Observable<Project> {
        return this.project$;
    }

    /**
     * Get the current project and no further updates, e.g. for requests.
     */
    getProjectOnce(): Observable<Project> {
        return this.project$.pipe(first());
    }

    /**
     * Set a new Project. The ProjectService will clear all layer, plots, and provenance.
     * Does *not* store the project.
     */
    setProject(project: Project): void {
        // clear all subjects
        for (const subjectMap of [this.layers, this.layerData$, this.layerDataState$] as Array<Map<number, ReplaySubject<any>>>) {
            subjectMap.forEach((subject) => subject.complete());
            subjectMap.clear();
        }

        // clear all subscriptions
        for (const subscriptionMap of [this.layerDataSubscriptions]) {
            subscriptionMap.forEach((subscription) => subscription.unsubscribe());
            subscriptionMap.clear();
        }

        // add layer streams
        for (const layer of project.layers) {
            this.createLayerDataStreams(layer);
            this.createLayerChangesStream(layer);
            this.createLayerMetadataStreams(layer);
            this.createCombinedLoadingState(layer);
        }

        // add plot streams
        for (const plot of project.plots) {
            this.createPlotDataStreams(plot);
        }

        // propagate new project
        this.project$.next(project);

        // store current project in session
        this.userService.getSessionTokenForRequest().subscribe((sessionToken) => this.backend.setSessionProject(project.id, sessionToken));
    }

    /**
     * Set the time of the current project.
     */
    setTime(time: Time): Observable<void> {
        const subject = new Subject<void>();
        this.getProjectOnce()
            .pipe(
                map((project) => project.time),
                mergeMap((oldTime) => {
                    if (time && time.isValid() && !time.isSame(oldTime)) {
                        return this.changeProjectConfig({time});
                    } else {
                        return of<void>();
                    }
                }),
            )
            .subscribe(
                () => subject.next(),
                (error) => subject.error(error),
                () => subject.complete(),
            );
        return subject.asObservable();
    }

    /**
     * Set a time duration for the current project.
     */
    setTimeStepDuration(timeStepDuration: TimeStepDuration): void {
        this.changeProjectConfig({timeStepDuration});
    }

    /**
     * Set the name of the current Project.
     */
    setName(name: string): Observable<void> {
        return this.changeProjectConfig({name});
    }

    /**
     * Set the projection used by the current project.
     */
    setSpatialReference(spatialReference: SpatialReference): Observable<void> {
        return this.changeProjectConfig({spatialReference});
    }

    /**
     * Get a stream of the projects projection.
     */
    getSpatialReferenceStream(): Observable<SpatialReference> {
        return this.project$.pipe(
            map((project) => project.spatialReference),
            distinctUntilChanged(),
        );
    }

    /**
     * Get a stream of the projects time.
     */
    getTimeStream(): Observable<Time> {
        return this.project$.pipe(
            map((project) => project.time),
            distinctUntilChanged(),
        );
    }

    getTimeOnce(): Observable<Time> {
        return this.project$.pipe(
            first(),
            map((project) => project.time),
        );
    }

    /**
     * Get a stream of the projects time step size.
     */
    getTimeStepDurationStream(): Observable<TimeStepDuration> {
        return this.project$.pipe(
            map((project) => project.timeStepDuration),
            distinctUntilChanged(),
        );
    }

    registerWorkflow(workflow: WorkflowDict): Observable<UUID> {
        return this.userService.getSessionStream().pipe(
            mergeMap((session) => this.backend.registerWorkflow(workflow, session.sessionToken)),
            map((response) => response.id),
        );
    }

    getWorkflow(workflowId: UUID): Observable<WorkflowDict> {
        return this.userService.getSessionStream().pipe(mergeMap((session) => this.backend.getWorkflow(workflowId, session.sessionToken)));
    }

    getWorkflowMetaData(workflowId: UUID): Observable<ResultDescriptorDict> {
        return this.userService
            .getSessionStream()
            .pipe(mergeMap((session) => this.backend.getWorkflowMetadata(workflowId, session.sessionToken)));
    }

    /**
     * Determines a common projection for all layers and return their operator with an added a propjection if necessary
     */
    getAutomaticallyProjectedOperatorsFromLayers(layers: Array<Layer>): Observable<Array<OperatorDict | SourceOperatorDict>> {
        const meta: Array<Observable<ResultDescriptorDict>> = layers.map((l) => this.getWorkflowMetaData(l.workflowId));

        return combineLatest(meta).pipe(
            mergeMap((descriptors: Array<ResultDescriptorDict>) => {
                const srefs = descriptors.map((l) => SpatialReferences.fromCode(l.spatialReference));
                const targetSref = getProjectionTarget(srefs);

                const workflowsObservable = layers.map((l) => this.getWorkflow(l.workflowId));

                return combineLatest(workflowsObservable).pipe(
                    map((workflows: Array<WorkflowDict>) => {
                        const projectedOperators: Array<OperatorDict | SourceOperatorDict> = [];

                        for (let i = 0; i < workflows.length; i++) {
                            const sref: SpatialReference = srefs[i];
                            const workflow = workflows[i];
                            const operator: OperatorDict | SourceOperatorDict = workflow.operator;
                            if (sref === targetSref) {
                                projectedOperators.push(operator);
                            } else {
                                projectedOperators.push({
                                    type: 'Reprojection',
                                    params: {
                                        targetSpatialReference: targetSref.getCode(),
                                    },
                                    vectorSources: workflow.type === 'Vector' ? [operator] : [],
                                    rasterSources: workflow.type === 'Raster' ? [operator] : [],
                                });
                            }
                        }

                        return projectedOperators;
                    }),
                );
            }),
        );
    }

    /**
     * Add a a new layer to the project.
     */
    addLayer(layer: Layer, notify = true): Observable<void> {
        this.createLayerDataStreams(layer);
        this.createLayerChangesStream(layer);
        this.createLayerMetadataStreams(layer);
        this.createCombinedLoadingState(layer);

        const result = this.getProjectOnce().pipe(
            mergeMap((project) =>
                this.changeProjectConfig({
                    layers: [layer, ...project.layers],
                }),
            ),
            tap(() => {
                if (notify) {
                    this.newLayer$.next();
                }
            }),
        );

        return ProjectService.subscribeAndProvide(result);
    }

    /**
     * Add a plot to the project.
     */
    addPlot(plot: Plot, notify = true): Observable<void> {
        this.createPlotDataStreams(plot);

        const result = this.getProjectOnce().pipe(
            mergeMap((project) =>
                this.changeProjectConfig({
                    plots: [plot, ...project.plots],
                }),
            ),
            tap(() => {
                if (notify) {
                    this.newPlot$.next();
                }
            }),
        );

        return ProjectService.subscribeAndProvide(result);
    }

    /**
     * Reload the data of a layer.
     */
    reloadLayerData(layer: Layer): void {
        const layerData$ = this.layerData$.get(layer.id);
        const layerDataState$ = this.layerDataState$.get(layer.id);

        if (!layerData$ || !layerDataState$) {
            return;
        }

        layerData$.next(undefined); // send empty data

        if (this.layerDataSubscriptions.has(layer.id)) {
            this.layerDataSubscriptions.get(layer.id)?.unsubscribe();
            this.layerDataSubscriptions.delete(layer.id);
        }

        switch (layer.layerType) {
            case 'raster': {
                this.layerDataSubscriptions.set(
                    layer.id,
                    this.createRasterLayerDataSubscription(layer as RasterLayer, layerData$ as Observer<RasterData>, layerDataState$),
                );
                break;
            }
            case 'vector': {
                this.layerDataSubscriptions.set(
                    layer.id,
                    this.createVectorLayerDataSubscription(layer as VectorLayer, layerData$ as Observer<VectorData>, layerDataState$),
                );
                break;
            }
        }
    }

    /**
     * Reload everything for the layer manually (e.g. on error).
     */
    reloadLayer(layer: Layer): void {
        const layerMetadata$ = this.layerMetadata$.get(layer.id);
        const layerMetadataState$ = this.layerMetadataState$.get(layer.id);

        if (!layerMetadata$ || !layerMetadataState$) {
            return;
        }

        this.reloadLayerData(layer);
        this.retrieveLayerMetadata(layer, layerMetadata$, layerMetadataState$);
    }

    /**
     * Reload the data for the plot manually (e.g. on error).
     */
    reloadPlot(plot: Plot): void {
        const plotData$ = this.plotData$.get(plot.id);
        const loadingState$ = this.plotDataState$.get(plot.id);

        if (!plotData$ || !loadingState$) {
            return;
        }

        plotData$.next(undefined); // send empty data

        this.plotDataSubscriptions.get(plot.id)?.unsubscribe();
        this.plotDataSubscriptions.delete(plot.id);

        const subscription = this.createPlotSubscription(plot, plotData$, loadingState$);

        this.plotDataSubscriptions.set(plot.id, subscription);
    }

    /**
     * Remove a plot from the project.
     */
    removePlot(plot: HasPlotId): Observable<void> {
        const result = this.getProjectOnce().pipe(
            mergeMap((project) => {
                const plots = [...project.plots];
                const plotIndex = plots.indexOf(plot);
                if (plotIndex >= 0) {
                    plots.splice(plotIndex, 1);
                    return this.changeProjectConfig({
                        plots,
                    });
                } else {
                    // avoid request if there is nothing to do
                    return of<void>();
                }
            }),
            tap(() => this.removePlotSubscriptions(plot)),
        );

        return ProjectService.subscribeAndProvide(result);
    }

    /**
     * Retrieve the layer models array as a stream.
     */
    getLayerStream(): Observable<Array<Layer>> {
        return this.project$.pipe(
            map((project) => project.layers),
            distinctUntilChanged(),
        );
    }

    /**
     * Retrieve the plot models array as a stream.
     */
    getPlotStream(): Observable<Array<Plot>> {
        return this.project$.pipe(
            map((project) => project.plots),
            distinctUntilChanged(),
        );
    }

    /**
     * Notification stream of newly added plots
     */
    getNewPlotStream(): Observable<void> {
        return this.newPlot$;
    }

    /**
     * Notification stream of newly added layers
     */
    getNewLayerStream(): Observable<void> {
        return this.newLayer$;
    }

    getLayerMetadata(layer: Layer): Observable<LayerMetadata> {
        const metaData = this.layerMetadata$.get(layer.id);

        if (!metaData) {
            throw Error(`layer metadata for layer with id ${layer.id} is undefined`);
        }

        return metaData;
    }

    getVectorLayerMetadata(layer: VectorLayer): Observable<VectorLayerMetadata> {
        return this.getLayerMetadata(layer).pipe(map((metadata) => metadata as VectorLayerMetadata));
    }

    getRasterLayerMetadata(layer: RasterLayer): Observable<RasterLayerMetadata> {
        return this.getLayerMetadata(layer).pipe(map((metadata) => metadata as RasterLayerMetadata));
    }

    /**
     * Retrieve the data of the layer as a stream.
     */
    getLayerDataStream(layer: HasLayerId): Observable<any> {
        const data = this.layerData$.get(layer.id);

        if (!data) {
            throw Error(`layer data for layer with id ${layer.id} is undefined`);
        }

        return data;
    }

    /**
     * Retrieve the data of the plot as a stream.
     */
    getPlotDataStream(plot: HasPlotId): Observable<any> {
        const data = this.plotData$.get(plot.id);

        if (!data) {
            throw Error(`plot data for plot with id ${plot.id} is undefined`);
        }

        return data;
    }

    /**
     * Retrieve the layer status as a stream.
     */
    getLayerStatusStream(layer: HasLayerId): Observable<LoadingState> {
        const status = this.layerState$.get(layer.id);

        if (!status) {
            throw Error(`status for id ${layer.id} is undefined`);
        }

        return status;
    }

    /**
     * Retrieve the layer data status as a stream.
     */
    getLayerDataStatusStream(layer: HasLayerId): Observable<LoadingState> {
        const status = this.layerDataState$.get(layer.id);

        if (!status) {
            throw Error(`status for id ${layer.id} is undefined`);
        }

        return status;
    }

    /**
     * Retrieve the plot data status as a stream.
     */
    getPlotDataStatusStream(plot: HasPlotId): Observable<LoadingState> {
        const status = this.plotDataState$.get(plot.id);

        if (!status) {
            throw Error(`status for id ${plot.id} is undefined`);
        }

        return status;
    }

    /**
     * Change the loading state of a raster layer
     */
    changeRasterLayerDataStatus(layer: HasLayerId & HasLayerType, state: LoadingState): void {
        if (layer.layerType === 'raster') {
            this.layerDataState$.get(layer.id)?.next(state);
        } else {
            throw Error('It is only allowed to change the state of a raster layer');
        }
    }

    /**
     * Removes a layer from the current project.
     */
    removeLayer(layer: Layer): Observable<void> {
        const subject = new Subject<void>();

        // TODO: un-select selected layer

        this.getProjectOnce()
            .pipe(
                mergeMap((project) => {
                    const layers = project.layers.filter((l) => l.id !== layer.id);

                    if (project.layers.length === layers.length) {
                        // nothing filtered, so no request
                        return of();
                    }

                    return this.changeProjectConfig({layers});
                }),
            )
            .subscribe(
                () => {
                    this.removeLayerSubscriptions(layer);
                    this.removeMetadataObservables(layer);
                    this.layerState$.delete(layer.id);
                    subject.next();
                },
                (error) => subject.error(error),
                () => subject.complete(),
            );

        return subject.asObservable();
    }

    /**
     * Remove all layers from the current project.
     */
    clearLayers(): Observable<void> {
        const subject = new Subject<void>();

        let removedLayers: Array<Layer>;

        this.getProjectOnce()
            .pipe(
                mergeMap((project) => {
                    removedLayers = project.layers;

                    return this.changeProjectConfig({
                        layers: [],
                    });
                }),
            )
            .subscribe(
                () => {
                    removedLayers.forEach((layer) => {
                        this.removeLayerSubscriptions(layer);
                        this.removeMetadataObservables(layer);
                        this.layerState$.delete(layer.id);
                    });
                    subject.next();
                },
                (error) => subject.error(error),
                () => subject.complete(),
            );

        return subject.asObservable();
    }

    /**
     * Remove all plots from the current project.
     */
    clearPlots(): Observable<void> {
        let removedPlots: Array<Layer>;

        const result = this.getProjectOnce().pipe(
            mergeMap((project) => {
                removedPlots = project.plots;

                return this.changeProjectConfig({
                    plots: [],
                });
            }),
            tap(() => removedPlots.forEach((plot) => this.removePlotSubscriptions(plot))),
        );

        return ProjectService.subscribeAndProvide(result);
    }

    /**
     * Sets the layers
     */
    setLayers(layers: Array<Layer>): void {
        this.project$.pipe(first()).subscribe((project) => {
            if (project.layers !== layers) {
                this.changeProjectConfig({layers});
            }
        });
    }

    changeLayer(
        layer: Layer,
        changes: {
            name?: string;
            workflowId?: UUID;
            symbology?: Symbology;
            isVisible?: boolean;
            isLegendVisible?: boolean;
        },
    ): Observable<void> {
        const subject = new Subject<void>();

        if (Object.keys(changes).length === 0) {
            subject.next();
            subject.complete();
            return subject;
        }

        layer = layer.updateFields(changes);

        this.getProjectOnce()
            .pipe(
                map((project) => project.layers.map((l) => (l.id === layer.id ? layer : l))),
                mergeMap((layers) => this.changeProjectConfig({layers})),
                tap(() => {
                    // propagate layer changes
                    this.layers.get(layer.id)?.next(layer);
                }),
            )
            .subscribe(
                () => subject.next(),
                (error) => subject.error(error),
                () => subject.complete(),
            );

        return subject;
    }

    /**
     * Get a stream of LayerChanges for a specified layer.
     */
    getLayerChangesStream(layer: Layer): Observable<Layer> {
        const changes = this.layers.get(layer.id);

        if (!changes) {
            throw new Error(`changes for id ${layer.id} are is undefined`);
        }

        return changes;
    }

    /**
     * Toggle the layer's legend visibility.
     */
    toggleLegend(layer: Layer): Observable<void> {
        return this.changeLayer(layer, {isLegendVisible: !layer.isLegendVisible});
    }

    // private static isNoRasterForGivenTimeException(response: HttpErrorResponse): boolean {
    //     if (!response.error || !response.error.nested_exception) {
    //         return false;
    //     }
    //     const nested_exception: { message: string, type: string } = response.error.nested_exception;
    //     return nested_exception.message.indexOf('NoRasterForGivenTimeException') >= 0;
    // }

    loadAndSetProject(projectId: UUID): Observable<Project> {
        const result = this.userService.getSessionTokenForRequest().pipe(
            mergeMap((sessionToken) => this.backend.loadProject(projectId, sessionToken)),
            map(Project.fromDict),
            tap((project) => this.setProject(project)),
        );

        return ProjectService.subscribeAndProvide(result);
    }

    /**
     * @returns The currently selected feature as stream.
     */
    getSelectedFeatureStream(): Observable<FeatureSelection> {
        return this.selectedFeature$.asObservable();
    }

    setSelectedFeature(feature?: OlFeature): void {
        this.selectedFeature$.next({feature: feature?.getId()});
    }

    getSelectedFeature(): FeatureSelection {
        return this.selectedFeature$.value;
    }

    /**
     * Subscribes to the observable and consumes it completely.
     * Returns a new observable to listen to the values.
     */
    protected static subscribeAndProvide<T>(observable: Observable<T>): Observable<T> {
        const subject = new Subject<T>();
        observable.subscribe(
            (value) => subject.next(value),
            (error) => subject.error(error),
            () => subject.complete(),
        );
        return subject.asObservable();
    }

    protected loadMostRecentProject(session: Session): Observable<Project> {
        let projectIdLookup: Observable<UUID | undefined>;

        if (session.lastProjectId) {
            // use the project id from the session
            projectIdLookup = of(session.lastProjectId);
        } else {
            // try to find the least recently used project id
            projectIdLookup = this.backend
                .listProjects(
                    {
                        permissions: ['Owner'],
                        filter: 'None',
                        order: 'DateDesc',
                        offset: 0,
                        limit: 1,
                    },
                    session.sessionToken,
                )
                .pipe(
                    map((listings) => {
                        if (listings.length > 0) {
                            return listings[0].id;
                        } else {
                            return undefined;
                        }
                    }),
                );
        }

        return projectIdLookup.pipe(
            mergeMap((projectId) => {
                if (projectId) {
                    return this.backend.loadProject(projectId, session.sessionToken).pipe(map(Project.fromDict));
                } else {
                    return this.createDefaultProject();
                }
            }),
        );
    }

    protected removeLayerSubscriptions(layer: HasLayerId): void {
        // subjects
        for (const subjectMap of [this.layers, this.layerData$, this.layerDataState$]) {
            subjectMap.get(layer.id)?.complete();
            subjectMap.delete(layer.id);
        }

        // subscriptions
        for (const subscriptionMap of [this.layerDataSubscriptions]) {
            subscriptionMap.get(layer.id)?.unsubscribe();
            subscriptionMap.delete(layer.id);
        }
    }

    protected removeMetadataObservables(layer: HasLayerId): void {
        this.layerMetadata$.get(layer.id)?.complete();
        this.layerMetadata$.delete(layer.id);

        this.layerMetadataState$.get(layer.id)?.complete();
        this.layerMetadataState$.delete(layer.id);
    }

    protected removePlotSubscriptions(plot: HasPlotId): void {
        // subjects
        for (const subjectMap of [this.plotData$, this.plotDataState$]) {
            subjectMap.get(plot.id)?.complete();
            subjectMap.delete(plot.id);
        }

        // subscriptions
        for (const subscriptionMap of [this.plotDataSubscriptions]) {
            subscriptionMap.get(plot.id)?.unsubscribe();
            subscriptionMap.delete(plot.id);
        }
    }

    protected static optimizeVecUpdates<Content extends ToDict<ContentDict> & {equals(other: Content): boolean}, ContentDict>(
        oldLayers: Array<Content>,
        newLayers: Array<Content>,
    ): Array<ContentDict | 'none' | 'delete'> {
        return newLayers.map((layer, i) => (layer.equals(oldLayers[i]) ? 'none' : layer.toDict()));

        // TODO: optimize deletions, etc.
    }

    protected changeProjectConfig(changes: {
        id?: UUID;
        name?: string;
        spatialReference?: SpatialReference;
        time?: Time;
        plots?: Array<any>;
        layers?: Array<Layer>;
        timeStepDuration?: TimeStepDuration;
    }): Observable<void> {
        const subject = new Subject<void>();

        // don't request the server if there are no changes
        if (Object.keys(changes).length === 0) {
            subject.next();
            subject.complete();
            return subject.asObservable();
        }

        let project: Project;

        combineLatest([this.getProjectOnce(), this.userService.getSessionTokenForRequest()])
            .pipe(
                mergeMap(([oldProject, sessionToken]) => {
                    project = oldProject.updateFields(changes);

                    return this.backend.updateProject(
                        {
                            id: project.id,
                            name: changes.name,
                            layers: changes.layers
                                ? ProjectService.optimizeVecUpdates<Layer, LayerDict>(oldProject.layers, project.layers)
                                : undefined,
                            plots: changes.plots
                                ? ProjectService.optimizeVecUpdates<Plot, PlotDict>(oldProject.plots, project.plots)
                                : undefined,
                            // TODO: add bbox
                            bounds: changes.time || changes.spatialReference ? project.toBoundsDict() : undefined,
                            // TODO: description: changes.description,
                            timeStep: changes.timeStepDuration ? timeStepDurationToTimeStepDict(changes.timeStepDuration) : undefined,
                        },
                        sessionToken,
                    );
                }),
            )
            .subscribe(
                () => {
                    this.project$.next(project);
                    subject.next();
                },
                (error) => subject.error(error),
                () => subject.complete(),
            );

        return subject.asObservable();
    }

    private createCombinedLoadingState(layer: HasLayerId): void {
        const layerMetadataState$ = this.layerMetadataState$.get(layer.id);
        const layerDataState$ = this.layerDataState$.get(layer.id);

        if (!layerMetadataState$ || !layerDataState$) {
            throw Error(`undefined states for layer ${layer.id}`);
        }

        const loadingState$ = combineLatest([layerMetadataState$, layerDataState$]).pipe(
            map((loadingStates) => {
                if (loadingStates.includes(LoadingState.LOADING)) {
                    return LoadingState.LOADING;
                }

                if (loadingStates.includes(LoadingState.ERROR)) {
                    return LoadingState.ERROR;
                }

                if (loadingStates.includes(LoadingState.NODATAFORGIVENTIME)) {
                    return LoadingState.NODATAFORGIVENTIME;
                }

                return LoadingState.OK;
            }),
        );
        this.layerState$.set(layer.id, loadingState$);
    }

    private createLayerDataStreams(layer: Layer): void {
        // each layer has data. The type depends on the layer type
        const layerDataLoadingState$ = new ReplaySubject<LoadingState>(1);
        const layerData$ = new ReplaySubject<LayerData>(1);
        let layerDataSub: Subscription;
        switch (layer.layerType) {
            case 'raster':
                layerDataSub = this.createRasterLayerDataSubscription(layer as RasterLayer, layerData$, layerDataLoadingState$);
                break;
            case 'vector':
                layerDataSub = this.createVectorLayerDataSubscription(layer as VectorLayer, layerData$, layerDataLoadingState$);
                break;
        }
        this.layerDataSubscriptions.set(layer.id, layerDataSub);
        this.layerDataState$.set(layer.id, layerDataLoadingState$);
        this.layerData$.set(layer.id, layerData$);
    }

    private createLayerMetadataStreams(layer: Layer): void {
        const layerMetadataLoadingState$ = new ReplaySubject<LoadingState>(1);
        const layerMetadata$ = new ReplaySubject<LayerMetadata>(1);

        this.retrieveLayerMetadata(layer, layerMetadata$, layerMetadataLoadingState$);

        this.layerMetadata$.set(layer.id, layerMetadata$);
        this.layerMetadataState$.set(layer.id, layerMetadataLoadingState$);
    }

    /**
     * Create a subscription for layer data, symbology and provenance with loading state checks and error handling
     */
    private createRasterLayerDataSubscription(
        layer: RasterLayer,
        data$: Observer<RasterData>,
        loadingState$: Observer<LoadingState>,
    ): Subscription {
        return combineLatest([this.getTimeStream(), this.getSpatialReferenceStream()])
            .pipe(
                tap(() => loadingState$.next(LoadingState.LOADING)),
                map(
                    ([time, projection]) =>
                        new RasterData(
                            time,
                            projection,
                            // this.mappingQueryService.getWMSQueryUrl({
                            //     operator: layer.operator,
                            //     time,
                            //     projection,
                            // })
                            this.backend.wmsUrl,
                        ),
                ),
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
                    },
                ),
            )
            .subscribe(
                (data) => data$.next(data),
                (error) => error, // ignore error
            );
    }

    /**
     * Retrieve metadata for layer data
     */
    private retrieveLayerMetadata(layer: Layer, metadata$: Observer<LayerMetadata>, loadingState$: Observer<LoadingState>): void {
        this.userService
            .getSessionTokenForRequest()
            .pipe(
                tap(() => loadingState$.next(LoadingState.LOADING)),
                mergeMap((sessionToken) => this.backend.getWorkflowMetadata(layer.workflowId, sessionToken)),
                map((workflowMetadataDict) => {
                    switch (layer.layerType) {
                        case 'vector':
                            return VectorLayerMetadata.fromDict(workflowMetadataDict as VectorResultDescriptorDict);
                        case 'raster':
                            return RasterLayerMetadata.fromDict(workflowMetadataDict as RasterResultDescriptorDict);
                    }
                }),
                tap(
                    () => loadingState$.next(LoadingState.OK),
                    (reason: Response) => {
                        this.notificationService.error(`${layer.name}: ${reason}`);
                        loadingState$.next(LoadingState.ERROR);
                    },
                ),
            )
            .subscribe(
                (metadata) => metadata$.next(metadata),
                (error) => error, // ignore error
            );
    }

    /**
     * Create a subscription for layer data, symbology and provenance with loading state checks and error handling
     */
    private createVectorLayerDataSubscription(
        layer: VectorLayer,
        data$: Observer<VectorData>,
        loadingState$: Observer<LoadingState>,
    ): Subscription {
        return combineLatest([
            this.getTimeStream(),
            combineLatest([this.getSpatialReferenceStream(), this.mapService.getViewportSizeStream()]).pipe(
                debounceTime(this.config.DELAYS.DEBOUNCE),
            ),
            this.userService.getSessionTokenForRequest(),
        ])
            .pipe(
                tap(() => loadingState$.next(LoadingState.LOADING)),
                switchMap(([time, [projection, viewport], sessionToken]) => {
                    const requestExtent: [number, number, number, number] = [0, 0, 0, 0];

                    // TODO: add resolution
                    return this.backend
                        .wfsGetFeature(
                            {
                                typeNames: `registry:${layer.workflowId}`,
                                bbox: extentToBboxDict(viewport.extent),
                                time: time.toDict(),
                                srsName: projection.getCode(),
                                queryResolution: viewport.resolution, // TODO: use two seperate values for x and y
                            },
                            sessionToken,
                        )
                        .pipe(map((x) => VectorData.olParse(time, projection, requestExtent, x)));
                }),
                tap(
                    () => loadingState$.next(LoadingState.OK),
                    (reason: Response) => {
                        this.notificationService.error(`${layer.name}: ${reason.statusText}`);
                        loadingState$.next(LoadingState.ERROR);
                    },
                ),
            )
            .subscribe(
                (data) => data$.next(data),
                (error) => error, // ignore error
            );
    }

    private createLayerChangesStream(layer: Layer): void {
        if (this.layers.get(layer.id)) {
            throw new Error('Layer changes stream already registered');
        }

        this.layers.set(layer.id, new ReplaySubject<Layer>(1));

        // emit first change
        this.layers.get(layer.id)?.next(layer);
    }

    private getDefaultTimeStep(): TimeStepDuration {
        switch (this.config.DEFAULTS.PROJECT.TIMESTEP) {
            case '15 minutes':
                return {durationAmount: 15, durationUnit: 'minutes'};
            case '1 hour':
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

    private createPlotDataStreams(plot: Plot): void {
        const loadingState$ = new ReplaySubject<LoadingState>(1);
        const data$ = new ReplaySubject<any>(1);

        const subscription = this.createPlotSubscription(plot, data$, loadingState$);
        this.plotDataSubscriptions.set(plot.id, subscription);

        this.plotDataState$.set(plot.id, loadingState$);
        this.plotData$.set(plot.id, data$);
    }

    /**
     * Create a subscription for plot data with loading state checks and error handling
     */
    private createPlotSubscription(plot: Plot, data$: Observer<any>, loadingState$: Observer<LoadingState>): Subscription {
        const observables: Array<Observable<any>> = [
            this.getTimeStream(),
            this.mapService.getViewportSizeStream(),
            this.userService.getSessionTokenForRequest(),
        ];

        return combineLatest(observables)
            .pipe(
                debounceTime(this.config.DELAYS.DEBOUNCE),
                tap(() => loadingState$.next(LoadingState.LOADING)),
                switchMap(([time, viewport, sessionToken]) =>
                    // TODO: add image size for png

                    this.backend.getPlot(
                        plot.workflowId,
                        {
                            time,
                            bbox: extentToBboxDict(viewport.extent),
                            spatialResolution: [viewport.resolution, viewport.resolution], // TODO: check if resolution needs two numbers
                        },
                        sessionToken,
                    ),
                ),
                tap(
                    () => loadingState$.next(LoadingState.OK),
                    (reason: Response) => {
                        this.notificationService.error(`${plot.name}: ${reason.status} ${reason.statusText}`);
                        loadingState$.next(LoadingState.ERROR);
                    },
                ),
            )
            .subscribe(
                (data) => data$.next(data),
                (error) => error, // ignore error
            );
    }
}
