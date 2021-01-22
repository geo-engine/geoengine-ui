import {
    combineLatest,
    Observable,
    Observer, of,
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
import {HasLayerId, HasLayerType, Layer, RasterLayer, VectorLayer} from '../layers/layer.model';
import {BackendService} from '../backend/backend.service';
import {LayerDict, UUID} from '../backend/backend.model';
import {UserService} from '../users/user.service';
import {LayerData, RasterData, VectorData} from '../layers/layer-data.model';
import {extentToBboxDict} from '../util/conversions';
import {MapService} from '../map/map.service';
import {AbstractSymbology} from '../layers/symbology/symbology.model';

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

    constructor(protected config: Config,
                protected notificationService: NotificationService,
                protected mapService: MapService,
                protected backend: BackendService,
                protected userService: UserService,
                protected layoutService: LayoutService) {
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
        name: string,
        description: string,
        spatialReference: SpatialReference,
        time: Time,
        timeStepDuration: TimeStepDuration,
    }): Observable<Project> {
        return this.userService.getSessionTokenForRequest().pipe(
            mergeMap(sessionToken => this.backend.createProject({
                name: config.name,
                description: config.description,
                bounds: {
                    bounding_box: extentToBboxDict(config.spatialReference.getExtent()),
                    spatial_reference: config.spatialReference.getCode(),
                    time_interval: config.time.toDict(),
                },
                // TODO: add timeStepDuration
            }, sessionToken)),
            map(({id}) => new Project({
                id,
                name: config.name,
                description: config.description,
                spatialReference: config.spatialReference,
                layers: [],
                time: config.time,
                timeStepDuration: config.timeStepDuration,
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

    cloneProject(newName: string): Observable<Project> {
        return this.getProjectOnce().pipe(
            mergeMap(project => combineLatest([
                of(project),
                this.createProject({
                    name: newName,
                    description: project.description,
                    spatialReference: project.spatialReference,
                    time: project.time,
                    timeStepDuration: project.timeStepDuration,
                }),
            ])),
            mergeMap(([oldProject, newPartialProject]) => combineLatest([
                of(newPartialProject.updateFields({
                    layers: oldProject.layers,
                    plots: oldProject.plots,
                })),
                this.userService.getSessionTokenForRequest(),
            ])),
            mergeMap(([project, sessionToken]) => combineLatest([
                of(project),
                this.backend.updateProject({
                    id: project.id,
                    layers: project.layers.map(layer => layer.toDict()),
                    // TODO: plots
                }, sessionToken)
            ])),
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
    setProject(project: Project) {
        // clear all subjects
        for (const subjectMap of [this.layers, this.layerData$, this.layerDataState$]) {
            subjectMap.forEach(subject => subject.complete());
            subjectMap.clear();
        }

        // clear all subscriptions
        for (const subscriptionMap of [this.layerDataSubscriptions]) {
            subscriptionMap.forEach(subscription => subscription.unsubscribe());
            subscriptionMap.clear();
        }

        // add layer streams
        for (const layer of project.layers) {
            this.createLayerDataStreams(layer);
            this.createLayerChangesStream(layer);
        }

        // propagate new project
        this.project$.next(project);

        // store current project in session
        this.userService.getSessionTokenForRequest().subscribe(
            sessionToken => this.backend.setSessionProject(project.id, sessionToken)
        );
    }

    /**
     * Set the time of the current project.
     */
    setTime(time: Time): Observable<void> {
        const subject = new Subject<void>();
        this.getProjectOnce().pipe(
            map(project => project.time),
            mergeMap(oldTime => {
                if (time && time.isValid() && !time.isSame(oldTime)) {
                    return this.changeProjectConfig({time});
                } else {
                    return of<void>();
                }
            }),
        ).subscribe(
            () => subject.next(),
            error => subject.error(error),
            () => subject.complete(),
        );
        return subject.asObservable();
    }

    /**
     * Set a time duration for the current project.
     */
    setTimeStepDuration(timeStepDuration: TimeStepDuration) {
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
    setSpatialReference(spatialReference: SpatialReference) {
        return this.changeProjectConfig({spatialReference});
    }

    /**
     * Get a stream of the projects projection.
     */
    getSpatialReferenceStream(): Observable<SpatialReference> {
        return this.project$.pipe(map(project => project.spatialReference), distinctUntilChanged());
    }

    /**
     * Get a stream of the projects time.
     */
    getTimeStream(): Observable<Time> {
        return this.project$.pipe(map(project => project.time), distinctUntilChanged());
    }

    getTimeOnce(): Observable<Time> {
        return this.project$.pipe(first(), map(project => project.time));
    }

    /**
     * Get a stream of the projects time step size.
     */
    getTimeStepDurationStream(): Observable<TimeStepDuration> {
        return this.project$.pipe(map(project => project.timeStepDuration), distinctUntilChanged());
    }

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

        //         if (notify) {
        //             this.newLayer$.next(layer);
        //         }

        return subject.asObservable();
    }

    /**
     * Reload the data of a layer.
     */
    reloadLayerData(layer: Layer) {
        this.layerData$.get(layer.id).next(undefined); // send empty data

        if (this.layerDataSubscriptions.has(layer.id)) {
            this.layerDataSubscriptions.get(layer.id).unsubscribe();
            this.layerDataSubscriptions.delete(layer.id);
        }

        switch (layer.layerType) {
            case 'raster': {
                this.layerDataSubscriptions.set(layer.id,
                    this.createRasterLayerDataSubscription(
                        layer as RasterLayer,
                        (this.layerData$.get(layer.id) as Observer<RasterData>),
                        this.layerDataState$.get(layer.id)
                    )
                );
                break;
            }
            case 'vector': {
                this.layerDataSubscriptions.set(layer.id,
                    this.createVectorLayerDataSubscription(
                        layer as VectorLayer,
                        (this.layerData$.get(layer.id) as Observer<VectorData>),
                        this.layerDataState$.get(layer.id)
                    )
                );
                break;
            }

        }
    }

    /**
     * Reload everything for the layer manually (e.g. on error).
     */
    reloadLayer(layer: Layer) {
        this.reloadLayerData(layer);
    }

    /**
     * Retrieve the layer models array as a stream.
     */
    getLayerStream(): Observable<Array<Layer>> {
        return this.project$.pipe(map(project => project.layers), distinctUntilChanged());
    }

    /**
     * Retrieve the data of the layer as a stream.
     */
    getLayerDataStream(layer: HasLayerId): Observable<any> {
        return this.layerData$.get(layer.id);
    }

    /**
     * Retrieve the layer data status as a stream.
     */
    getLayerDataStatusStream(layer: HasLayerId): Observable<LoadingState> {
        return this.layerDataState$.get(layer.id);
    }

    /**
     * Change the loading state of a raster layer
     */
    changeRasterLayerDataStatus(layer: HasLayerId & HasLayerType, state: LoadingState) {
        if (layer.layerType === 'raster') {
            this.layerDataState$.get(layer.id).next(state);
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
                mergeMap(project => {
                    const layers = project.layers.filter(l => l.id !== layer.id);

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
                    subject.next();
                },
                error => subject.error(error),
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
                mergeMap(project => {
                    removedLayers = project.layers;

                    return this.changeProjectConfig({
                        layers: [],
                    });
                }),
            )
            .subscribe(
                () => {
                    removedLayers.forEach(layer => this.removeLayerSubscriptions(layer));
                    subject.next();
                },
                error => subject.error(error),
                () => subject.complete(),
            );

        return subject.asObservable();
    }

    protected removeLayerSubscriptions(layer: Layer) {
        // subjects
        for (const subjectMap of [this.layers, this.layerData$, this.layerDataState$]) {
            subjectMap.get(layer.id).complete();
            subjectMap.delete(layer.id);
        }

        // subscriptions
        for (const subscriptionMap of [this.layerDataSubscriptions]) {
            subscriptionMap.get(layer.id).unsubscribe();
            subscriptionMap.delete(layer.id);
        }
    }

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

    changeLayer(layer: Layer, changes: {
        name?: string,
        workflowId?: UUID,
        symbology?: AbstractSymbology,
        isVisible?: boolean,
        isLegendVisible?: boolean,
    }): Observable<void> {
        const subject = new Subject<void>();

        if (Object.keys(changes).length === 0) {
            subject.next();
            subject.complete();
            return subject;
        }

        layer = layer.updateFields(changes);

        this.getProjectOnce().pipe(
            map(project => project.layers.map(l => (l.id === layer.id) ? layer : l)),
            mergeMap(layers => this.changeProjectConfig({layers})),
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

    /**
     * Toggle the layer's legend visibility.
     */
    toggleLegend(layer: Layer): Observable<void> {
        return this.changeLayer(layer, {isLegendVisible: !layer.isLegendVisible});
    }

    protected static optimizeLayerUpdates(oldLayers: Array<Layer>, newLayers: Array<Layer>): Array<LayerDict | 'none' | 'delete'> {
        if (newLayers.length === (oldLayers.length + 1)) {
            // layer addition optimization

            return [
                newLayers[0].toDict(),
                ...oldLayers.map((oldLayer, i) => oldLayer.equals(newLayers[i + 1]) ? 'none' : newLayers[i + 1].toDict()),
            ];
        }

        return newLayers.map((layer, i) => layer.equals(oldLayers[i]) ? 'none' : layer.toDict());

        // TODO: optimize deletions, etc.
    }

    protected changeProjectConfig(changes: {
        id?: UUID,
        name?: string,
        spatialReference?: SpatialReference,
        time?: Time,
        plots?: Array<any>,
        layers?: Array<Layer>,
        timeStepDuration?: TimeStepDuration,
    }): Observable<void> {
        const subject = new Subject<void>();

        // don't request the server if there are no changes
        if (Object.keys(changes).length === 0) {
            subject.next();
            subject.complete();
            return subject.asObservable();
        }

        let project: Project;

        combineLatest([
            this.getProjectOnce(),
            this.userService.getSessionTokenForRequest(),
        ]).pipe(
            mergeMap(([oldProject, sessionToken]) => {
                project = oldProject.updateFields(changes);

                return this.backend.updateProject({
                    id: project.id,
                    name: changes.name,
                    layers: changes.layers ? ProjectService.optimizeLayerUpdates(oldProject.layers, project.layers) : undefined,
                    // TODO: add bbox
                    bounds: (changes.time || changes.spatialReference) ? project.toBoundsDict() : undefined,
                    // TODO: description: changes.description,
                    // TODO: time step duration
                }, sessionToken);
            }),
        ).subscribe(
            () => {
                this.project$.next(project);
                subject.next();
            },
            error => subject.error(error),
            () => subject.complete(),
        );

        return subject.asObservable();
    }

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
    }

    /**
     * Create a subscription for layer data, symbology and provenance with loading state checks and error handling
     */
    private createRasterLayerDataSubscription(layer: RasterLayer, data$: Observer<RasterData>,
                                              loadingState$: Observer<LoadingState>): Subscription {
        return combineLatest([
            this.getTimeStream(),
            this.getSpatialReferenceStream(),
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
                this.getSpatialReferenceStream(),
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

                // TODO: add resolution
                return this.backend.wfsGetFeature({
                    typeNames: `registry:${layer.workflowId}`,
                    bbox: extentToBboxDict(viewportSize.extent),
                    time: time.toDict(),
                    srsName: projection.getCode(),
                }, sessionToken).pipe(
                    map(x => VectorData.olParse(time, projection, requestExtent, x))
                );
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

    loadAndSetProject(projectId: UUID): Observable<Project> {
        const result = this.userService.getSessionTokenForRequest().pipe(
            mergeMap(sessionToken => this.backend.loadProject(projectId, sessionToken)),
            map(Project.fromDict),
            tap(project => this.setProject(project)),
        );

        return ProjectService.subscribeAndProvide(result);
    }

    /**
     * Subscribes to the observable and consumes it completely.
     * Returns a new observable to listen to the values.
     */
    protected static subscribeAndProvide<T>(observable: Observable<T>): Observable<T> {
        const subject = new Subject<T>();
        observable.subscribe(
            value => subject.next(value),
            error => subject.error(error),
            () => subject.complete(),
        );
        return subject.asObservable();
    }
}
