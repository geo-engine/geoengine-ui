import {Injectable, Inject, forwardRef, Injector} from '@angular/core';
import {Http, Response} from '@angular/http';
import {Observable, BehaviorSubject, ReplaySubject} from 'rxjs/Rx';

import {WFSOutputFormats, WFSOutputFormat} from './output-formats/wfs-output-format.model';
import {WCSOutputFormat} from './output-formats/wcs-output-format.model';
import {MappingRequestParameters} from './request-parameters.model';

import {ProjectService} from '../project/project.service';
import {UserService} from '../users/user.service';
import {MapService, ViewportSize} from '../map/map.service';
import {NotificationService} from '../notification.service';

import {Operator} from '../operators/operator.model';
import {Projection} from '../operators/projection.model';
import {ResultTypes} from '../operators/result-type.model';
import {MappingColorizer} from '../../symbology/symbology.model';

import {PlotData} from '../plots/plot.model';
import {VectorLayerData, LayerProvenance} from '../layers/layer.model';
import {LoadingState} from '../project/loading-state.model';

import {GeoJsonFeatureCollection} from '../../models/geojson.model';
import {Provenance} from '../provenance/provenance.model';
import {Time} from '../time.model';
import {Config} from '../config.service';
import Extent = ol.Extent;

/**
 * A service that encapsulates MAPPING queries.
 */
@Injectable()
export class MappingQueryService {

    private projectService: ProjectService;

    /**
     * Inject the Http-Provider for asynchronous requests.
     */
    constructor(private config: Config,
                private http: Http,
                private userService: UserService,
                // @Inject(forwardRef(() => ProjectService)) private projectService: ProjectService,
                private injector: Injector,
                private mapService: MapService,
                private notificationService: NotificationService) {
    }

    getProjectService(): ProjectService {
        if (!this.projectService) {
            this.projectService = this.injector.get(ProjectService);
        }
        return this.projectService;
    }

    /**
     * Get a MAPPING url for the plot operator and time.
     * @param config
     * @returns the query url
     */
    getPlotQueryUrl(config: {operator: Operator, time: Time}): string {
        const parameters = new MappingRequestParameters({
            service: 'plot',
            request: '',
            sessionToken: this.userService.getSession().sessionToken,
            parameters: {
                query: encodeURIComponent(config.operator.toQueryJSON()),
                time: config.time.asRequestString(),
                crs: config.operator.projection.getCode(),
            },
        });

        if (config.operator.getSources(ResultTypes.RASTER).size > 0) {
            // TODO: magic numbers
            parameters.setParameter('height', 1024);
            parameters.setParameter('width', 1024);
        }

        return this.config.MAPPING_URL + '?' + parameters.toMessageBody();
    }

    /**
     * Retrieve the plot data by querying MAPPING.
     * @param config
     * @returns a Promise of PlotData
     */
    getPlotData(config: {operator: Operator, time: Time}): Observable<PlotData> {
        return this.http.get(this.getPlotQueryUrl(config))
            .map(response => response.json());
    }

    /**
     * Get a MAPPING url for the WFS request.
     * @param operator the operator graph
     * @param time the point in time
     * @param projection the desired projection
     * @param outputFormat the output format
     * @returns the query url
     */
    getWFSQueryUrl(config: {
        operator: Operator,
        time?: Time,
        projection?: Projection,
        outputFormat: WFSOutputFormat,
        viewportSize?: boolean | ViewportSize
    }): string {
        if (!config.time) {
            config.time = this.getProjectService().getTime();
        }
        if (!config.projection) {
            config.projection = this.getProjectService().getProject().projection;
        }

        const projectedOperator = config.operator.getProjectedOperator(config.projection);

        const parameters = new MappingRequestParameters({
            service: 'WFS',
            request: 'GetFeature',
            sessionToken: this.userService.getSession().sessionToken,
            parameters: {
                version: this.config.WFS.VERSION,
                typeNames: encodeURIComponent(projectedOperator.resultType.getCode()
                    + ':'
                    + projectedOperator.toQueryJSON()),
                srsname: config.projection.getCode(),
                time: config.time.asRequestString(),
                outputFormat: config.outputFormat.getFormat(),
            },
        });

        if (config.viewportSize) {
            const extent = (config.viewportSize as ViewportSize).extent;
            const resolution = (config.viewportSize as ViewportSize).resolution;

            parameters.setParameter('clustered', true);
            parameters.setParameter('bbox', extent.join(','));
            parameters.setParameter('resolution', resolution);
            // parameters.setParameter('height', Math.max(1, resolution));
            // parameters.setParameter('width', Math.max(1, resolution));
        }

        return this.config.MAPPING_URL + '?' + parameters.toMessageBody();
    }

    /**
     * Get a MAPPING url stream for the WFS request.
     * @param operator the operator graph
     * @param outputFormat the output format
     * @returns the query url stream
     */
    getWFSQueryUrlStream(operator: Operator, outputFormat: WFSOutputFormat): Observable<string> {
        return Observable.combineLatest(
            this.getProjectService().getTimeStream(), this.getProjectService().getProjectionStream()
        ).map(
            ([time, projection]) => this.getWFSQueryUrl({operator, time, projection, outputFormat})
        );
    }

    /**
     * Retrieve the WFS data by querying MAPPING.
     * @param operator the operator graph
     * @param time the point in time
     * @param projection the desired projection
     * @param outputFormat the output format
     * @returns a Promise of features
     */
    getWFSData(config: {
        operator: Operator,
        time?: Time,
        projection?: Projection,
        outputFormat: WFSOutputFormat,
    }): Promise<string> {
        return this.http.get(this.getWFSQueryUrl(config))
            .toPromise()
            .then(response => response.text());
    }

    /**
     * Retrieve the WFS data as JSON by querying MAPPING.
     * @param operator the operator graph
     * @param time the point in time
     * @param projection the desired projection
     * @param outputFormat the output format
     * @returns a Promise of JSON
     */
    getWFSDataAsJson(config: {
        operator: Operator,
        time: Time,
        projection: Projection,
        viewportSize?: (boolean | ViewportSize)
    }): Promise<GeoJsonFeatureCollection> {
        return this.http.get(
            this.getWFSQueryUrl({
                operator: config.operator,
                time: config.time,
                projection: config.projection,
                outputFormat: WFSOutputFormats.JSON,
                viewportSize: config.viewportSize,
            })
        ).toPromise().then(response => response.json());
    }

    /**
     * Create a stream of WFS data that emits data on every time change.
     * @param operator the operator graph
     * @param outputFormat the output format
     * @returns an Observable of features
     */
    getWFSDataStream(config: {
        operator: Operator,
        outputFormat: WFSOutputFormat
    }): Observable<string> {
        return Observable.combineLatest(
            this.getProjectService().getTimeStream(), this.getProjectService().getProjectionStream()
        ).switchMap(
            ([time, projection]) => this.getWFSData({
                operator: config.operator,
                time: time,
                projection: projection,
                outputFormat: config.outputFormat,
            })
        );
    }

    getWFSDataStreamAsGeoJsonFeatureCollection(config: {
        operator: Operator,
        clustered?: boolean
    }): VectorLayerData {
        const viewportSize$: Observable<boolean | ViewportSize> =
            config.clustered ?
                this.mapService.getViewportSizeStream().debounceTime(this.config.DELAYS.DEBOUNCE)
                : Observable.of(false);

        const reload$ = new BehaviorSubject<void>(undefined);
        const state$ = new ReplaySubject<LoadingState>(1);
        const data$ = Observable.combineLatest(
            this.getProjectService().getTimeStream(),
            this.getProjectService().getProjectionStream(),
            viewportSize$,
            reload$
        ).switchMap(([time, projection, optionalViewport]) => {
            state$.next(LoadingState.LOADING);
            const promise = this.getWFSDataAsJson({
                operator: config.operator,
                time: time,
                projection: projection,
                viewportSize: optionalViewport,
            });
            return promise.then(
                result => {
                    state$.next(LoadingState.OK);
                    return result;
                },
                (reason: Error) => {
                    state$.next(LoadingState.ERROR);
                    this.notificationService.error(`${reason.message}`);
                    return undefined;
                }
            );
        }).map(result => {
            if (result) {
                const geojson = result as GeoJsonFeatureCollection;
                const features = geojson.features;
                for (let localRowId = 0; localRowId < features.length; localRowId++) {
                    const feature = features[localRowId];
                    if (feature.id === undefined) {
                        feature.id = 'lrid_' + localRowId;
                    }
                }
                return geojson;
            } else {
                return {
                    type: '',
                    features: [],
                } as GeoJsonFeatureCollection;
            }
        }).publishReplay(1).refCount(); // use publishReplay to avoid re-requesting

        return {
            data$: data$,
            state$: state$,
            reload$: reload$,
        };
    }

    /**
     * Get MAPPING query parameters for the WMS request.
     * @param operator the operator graph
     * @param time the point in time
     * @param projection the desired projection
     * @returns the query parameters
     */
    getWMSQueryParameters(config: {
        operator: Operator,
        time?: Time,
        projection?: Projection,
    }): MappingRequestParameters {
        if (!config.time) {
            config.time = this.getProjectService().getTime();
        }
        if (!config.projection) {
            config.projection = this.getProjectService().getProject().projection;
        }

        const projectedOperator = config.operator.getProjectedOperator(config.projection);

        return new MappingRequestParameters({
            service: 'WMS',
            request: 'GetMap',
            sessionToken: this.userService.getSession().sessionToken,
            parameters: {
                version: this.config.WMS.VERSION,
                format: this.config.WMS.FORMAT,
                transparent: true,
                layers: projectedOperator.toQueryJSON(),
                debug: (this.config.DEBUG_MODE.MAPPING ? 1 : 0),
                time: config.time.asRequestString(),
            },
        });
    }

    /**
     * Get a MAPPING url for the WMS request.
     * @param operator the operator graph
     * @param time the point in time
     * @param projection the desired projection
     * @returns the query url
     */
    getWMSQueryUrl(config: {
        operator: Operator,
        time?: Time,
        projection?: Projection
    }): string {
        const parameters = this.getWMSQueryParameters(config);

        return this.config.MAPPING_URL + '?' + parameters.toMessageBody();
    }

    getWCSQueryUrl(config: {
        operator: Operator,
        time?: Time,
        projection?: Projection,
        outputFormat: WCSOutputFormat,
        size: {
            x: number,
            y: number,
        },
    }): string {
        if (!config.time) {
            config.time = this.getProjectService().getTime();
        }
        if (!config.projection) {
            config.projection = this.getProjectService().getProject().projection;
        }

        const projectedOperator = config.operator.getProjectedOperator(config.projection);

        const extent = this.getProjectService().getProjection().getExtent();

        const parameters = new MappingRequestParameters({
            service: this.config.WCS.SERVICE,
            request: 'getcoverage',
            sessionToken: this.userService.getSession().sessionToken,
            parameters: {
                version: this.config.WCS.VERSION,
                format: config.outputFormat.getFormat(),
                coverageid: encodeURIComponent(projectedOperator.toQueryJSON()),
                subset_x: `(${extent[0]},${extent[2]})`,
                subset_y: `(${extent[1]},${extent[3]})`,
                outputcrs: this.getProjectService().getProjection().getCrsURI(),
                size_x: config.size.x,
                size_y: config.size.y,
                debug: (this.config.DEBUG_MODE.MAPPING ? 1 : 0),
                time: config.time.asRequestString(),
            },
        });

        return this.config.MAPPING_URL + '?' + parameters.toMessageBody();
    }

    getColorizer(operator: Operator,
                 time: Time,
                 projection: Projection): Promise<MappingColorizer> {

        const request = new MappingRequestParameters({
            service: 'WMS',
            request: 'GetColorizer',
            sessionToken: this.userService.getSession().sessionToken,
            parameters: {
                version: this.config.WMS.VERSION,
                layers: operator.getProjectedOperator(projection).toQueryJSON(),
                debug: (this.config.DEBUG_MODE.MAPPING ? 1 : 0),
                time: time.asRequestString(),
            },
        });
        // console.log('colorizerRequest', colorizerRequest);
        return this.http.get(this.config.MAPPING_URL + '?' + request.toMessageBody())
            .map((res: Response) => res.json() as MappingColorizer)
            .catch((err, cought) => {
                console.log("getColorizer", err, cought); //TODO: notification?
                return Observable.of({interpolation: 'unknown', breakpoints: []});
            }).map(c => {
                if(c.breakpoints.length > 1 && c.breakpoints[0][0] < c.breakpoints[c.breakpoints.length-1][0]) {
                    c.breakpoints = c.breakpoints.reverse();
                }
                return c;
            })
            .toPromise();
    }

    getColorizerStream(operator: Operator): Observable<MappingColorizer> {
        return Observable.combineLatest(
            this.getProjectService().getTimeStream(), this.getProjectService().getProjectionStream()
        ).switchMap(
            ([time, projection]) => this.getColorizer(operator, time, projection)
        ).publishReplay(1).refCount();
    }

    getProvenance(config: {
        operator: Operator,
        time: Time,
        projection: Projection,
        extent: Extent,
    }): Promise<Array<Provenance>> {
        const request = new MappingRequestParameters({
            service: 'provenance',
            request: '',
            sessionToken: this.userService.getSession().sessionToken,
            parameters: {
                query: encodeURIComponent(config.operator.getProjectedOperator(config.projection).toQueryJSON()),
                crs: config.projection.getCode(),
                time: config.time.asRequestString(),
                bbox: config.extent.join(','),
                type: config.operator.resultType.getCode(),
            },
        });

        if (config.operator.resultType === ResultTypes.RASTER) {
            // TODO: magic numbers
            request.setParameter('height', 1024);
            request.setParameter('width', 1024);
        }

        return this.http.get(
            this.config.MAPPING_URL + '?' + request.toMessageBody()
        ).map(
            (res: Response) => res.json()
        ).map(
            json => json as [Provenance]
        ).toPromise();
    }

    getProvenanceStream(operator: Operator): LayerProvenance {
        // TODO: incorporate time and projection streams

        const state$ = new BehaviorSubject<LoadingState>(LoadingState.OK); // TODO: good default?
        const reload$ = new BehaviorSubject<void>(undefined);
        const provenanceStream = Observable.combineLatest(
            this.getProjectService().getTimeStream(),
            this.getProjectService().getProjectionStream(),
            this.mapService.getViewportSizeStream(),
            reload$
        ).switchMap(([time, projection, viewportSize]) => {
            state$.next(LoadingState.LOADING);
            return this.getProvenance({
                operator: operator,
                time: time,
                projection: projection,
                extent: viewportSize.extent,
            }).then(
                result => {
                    state$.next(LoadingState.OK);
                    return result;
                },
                reason => {
                    state$.next(LoadingState.ERROR);
                    return [];
                }
            );
        });

        return {
            provenance$: provenanceStream.publishReplay(1).refCount(),
            state$: state$,
            reload$: reload$,
        };
    }

    getGBIFAutoCompleteResults(scientificName: string): Promise<Array<string>> {
        const parameters = new MappingRequestParameters({
            service: 'gfbio',
            request: 'searchSpecies',
            sessionToken: this.userService.getSession().sessionToken,
            parameters: {
                term: scientificName,
            },
        });

        const queryUrl = this.config.MAPPING_URL + '?' + parameters.toMessageBody();

        // TODO: react on failures of this weired protocol
        return this.http.get(queryUrl).toPromise().then(
            response => response.json()['speciesNames']
        );
    }

    getGBIFDataSourceCounts(scientificName: string): Promise<Array<{name: string, count: number}>> {
        const parameters = new MappingRequestParameters({
            service: 'gfbio',
            request: 'queryDataSources',
            sessionToken: this.userService.getSession().sessionToken,
            parameters: {
                term: scientificName,
            },
        });

        const queryUrl = this.config.MAPPING_URL + '?' + parameters.toMessageBody();

        // TODO: react on failures of this weired protocol
        return this.http.get(queryUrl).toPromise().then(
            response => response.json()['dataSources']
        );
    }

}
