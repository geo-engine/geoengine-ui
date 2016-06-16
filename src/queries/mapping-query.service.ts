import {Injectable} from '@angular/core';
import {Http, Response} from '@angular/http';
import {Observable, ReplaySubject} from 'rxjs/Rx';

import moment from 'moment';

import {WFSOutputFormats, WFSOutputFormat} from './output-formats/wfs-output-format.model';
import {WCSOutputFormat} from './output-formats/wcs-output-format.model';
import {MappingRequestParameters} from './request-parameters.model';

import {ProjectService} from '../project/project.service';
import {UserService} from '../users/user.service';
import {MapService, ViewportSize} from '../map/map.service';

import {Operator} from '../operators/operator.model';
import {Projection} from '../operators/projection.model';
import {ResultTypes} from '../operators/result-type.model';

import Config from '../app/config.model';
import {PlotData, PlotDataStream} from '../plots/plot.model';
import {VectorLayerDataStream} from '../layers/layer.model';

import {GeoJsonFeatureCollection} from '../models/geojson.model';
import {Provenance} from '../provenance/provenance.model';

export interface MappingColorizer {
    interpolation: string;
    breakpoints: Array<[number, string, string]>;
}

/**
 * A service that encapsulates MAPPING queries.
 */
@Injectable()
export class MappingQueryService {
    /**
     * Inject the Http-Provider for asynchronous requests.
     */
    constructor(
        private http: Http,
        private userService: UserService,
        private projectService: ProjectService,
        private mapService: MapService
    ) {}

    /**
     * Get a MAPPING url for the plot operator and time.
     * @param operator the operator graph
     * @param time the point in time
     * @returns the query url
     */
    getPlotQueryUrl(config: {
        operator: Operator,
        time?: moment.Moment,
    }): string {
        if (!config.time) {
            config.time = this.projectService.getTime();
        }
        const parameters = new MappingRequestParameters({
            service: 'plot',
            request: '',
            sessionToken: this.userService.getSession().sessionToken,
            parameters: {
                query: encodeURIComponent(config.operator.toQueryJSON()),
                time: config.time.toISOString(),
                crs: config.operator.projection.getCode(),
            },
        });

        if (config.operator.getSources(ResultTypes.RASTER).size > 0) {
            parameters.setParameter('height', 1024); // magic number
            parameters.setParameter('width', 1024); // magic number
        }

        return Config.MAPPING_URL + '?' + parameters.toMessageBody();
    }

    /**
     * Retrieve the plot data by querying MAPPING.
     * @param operator the operator graph
     * @param time the point in time
     * @returns a Promise of PlotData
     */
    getPlotData(config: {operator: Operator, time?: moment.Moment}): Promise<PlotData> {
        return this.http.get(this.getPlotQueryUrl(config))
                        .toPromise()
                        .then(response => response.json());
    }

    /**
     * Create a stream of PlotData that emits data on every time change.
     * @param operator the operator graph
     * @returns an Observable of PlotData
     */
    getPlotDataStream(operator: Operator): PlotDataStream {
        const loading$ = new ReplaySubject<boolean>(1);
        const data$ = this.projectService.getTimeStream().switchMap(time => {
            loading$.next(true);
            const promise = this.getPlotData({operator, time});
            promise.then(_ => loading$.next(false), _ => loading$.next(false));
            return promise;
        });
        return {
            data$: data$,
            loading$: loading$,
        };
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
        time?: moment.Moment,
        projection?: Projection,
        outputFormat: WFSOutputFormat,
        viewportSize?: boolean | ViewportSize
    }): string {
        if (!config.time) {
            config.time = this.projectService.getTime();
        }
        if (!config.projection) {
            config.projection = this.projectService.getProject().projection;
        }

        const projectedOperator = config.operator.getProjectedOperator(config.projection);

        const parameters = new MappingRequestParameters({
            service: 'WFS',
            request: 'GetFeature',
            sessionToken: this.userService.getSession().sessionToken,
            parameters: {
                version: Config.WFS.VERSION,
                typeNames: encodeURIComponent(projectedOperator.resultType.getCode()
                           + ':'
                           + projectedOperator.toQueryJSON()),
                srsname: config.projection.getCode(),
                time: config.time.toISOString(),
                outputFormat: config.outputFormat.getFormat(),
            },
        });

        if (config.viewportSize) {
            const extent = (config.viewportSize as ViewportSize).extent;
            const resolution = (config.viewportSize as ViewportSize).resolution;

            parameters.setParameter('clustered', true);
            parameters.setParameter('bbox', extent.join(','));
            parameters.setParameter('height', Math.max(1, resolution));
            parameters.setParameter('width', Math.max(1, resolution));
        }

        return Config.MAPPING_URL + '?' + parameters.toMessageBody();
    }

    /**
     * Get a MAPPING url stream for the WFS request.
     * @param operator the operator graph
     * @param outputFormat the output format
     * @returns the query url stream
     */
    getWFSQueryUrlStream(operator: Operator, outputFormat: WFSOutputFormat): Observable<string> {
        return Observable.combineLatest(
            this.projectService.getTimeStream(), this.projectService.getProjectionStream()
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
        time?: moment.Moment,
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
        time: moment.Moment,
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
            this.projectService.getTimeStream(), this.projectService.getProjectionStream()
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
    }): VectorLayerDataStream {
        const viewportSize$: Observable<boolean | ViewportSize> =
            config.clustered ? this.mapService.getViewportSizeStream() : Observable.of(false);

        const loading$ = new ReplaySubject<boolean>(1);
        const data$ = Observable.combineLatest(
            this.projectService.getTimeStream(),
            this.projectService.getProjectionStream(),
            viewportSize$
        ).switchMap(([time, projection, optionalViewport]) => {
            loading$.next(true);
            const promise = this.getWFSDataAsJson({
                operator: config.operator,
                time: time,
                projection: projection,
                viewportSize: optionalViewport,
            });
            promise.then(_ => loading$.next(false), _ => loading$.next(false));
            return promise;
        }).map(result => {
            const geojson = result as GeoJsonFeatureCollection;
            const features = geojson.features;
            for ( let localRowId = 0 ; localRowId < features.length; localRowId++ ) {
                const feature = features[localRowId];
                if (feature.id === undefined) {
                    feature.id = 'lrid_' + localRowId;
                }
            }
            return geojson;
        }).publishReplay(1).refCount(); // use publishReplay to avoid re-requesting

        return {
            data$: data$,
            loading$: loading$,
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
        time?: moment.Moment,
        projection?: Projection,
    }): MappingRequestParameters {
        if (!config.time) {
            config.time = this.projectService.getTime();
        }
        if (!config.projection) {
            config.projection = this.projectService.getProject().projection;
        }

        const projectedOperator = config.operator.getProjectedOperator(config.projection);

        return new MappingRequestParameters({
            service: 'WMS',
            request: 'GetMap',
            sessionToken: this.userService.getSession().sessionToken,
            parameters: {
                version: Config.WMS.VERSION,
                format: Config.WMS.FORMAT,
                transparent: true,
                layers: projectedOperator.toQueryJSON(),
                debug: (Config.MAPPING_DEBUG_MODE ? 1 : 0),
                time: config.time.toISOString(),
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
        time?: moment.Moment,
        projection?: Projection
    }): string {
        const parameters = this.getWMSQueryParameters(config);

        return Config.MAPPING_URL + '?' + parameters.toMessageBody();
    }

    getWCSQueryUrl(config: {
        operator: Operator,
        time?: moment.Moment,
        projection?: Projection,
        outputFormat: WCSOutputFormat,
        size: {
            x: number,
            y: number,
        },
    }): string {
        if (!config.time) {
            config.time = this.projectService.getTime();
        }
        if (!config.projection) {
            config.projection = this.projectService.getProject().projection;
        }

        const projectedOperator = config.operator.getProjectedOperator(config.projection);

        const extent = this.projectService.getProjection().getExtent();

        const parameters = new MappingRequestParameters({
            service: Config.WCS.SERVICE,
            request: 'getcoverage',
            sessionToken: this.userService.getSession().sessionToken,
            parameters: {
                version: Config.WCS.VERSION,
                format: config.outputFormat.getFormat(),
                coverageid: encodeURIComponent(projectedOperator.toQueryJSON()),
                subset_x: `(${extent[0]},${extent[2]})`,
                subset_y: `(${extent[1]},${extent[3]})`,
                outputcrs: this.projectService.getProjection().getCrsURI(),
                size_x: config.size.x,
                size_y: config.size.y,
                debug: (Config.MAPPING_DEBUG_MODE ? 1 : 0),
                time: config.time.toISOString(),
            },
        });

        return Config.MAPPING_URL + '?' + parameters.toMessageBody();
    }

    getColorizer(operator: Operator,
                 time: moment.Moment,
                 projection: Projection): Promise<MappingColorizer> {

        const projectedOperator = operator.getProjectedOperator(projection);
        const requestType = 'GetColorizer';
        const colorizerRequest = Config.MAPPING_URL
            + '?' + 'SERVICE=WMS'
            + '&' + 'VERSION=' + Config.WMS.VERSION
            + '&' + 'REQUEST=' + requestType
            + '&' + 'LAYERS=' + projectedOperator.toQueryJSON()
            + '&' + 'CRS=' + projection.getCode()
            + '&' + 'TIME=' + time.toISOString(); // TODO: observable-isieren
        // console.log('colorizerRequest', colorizerRequest);
        return this.http.get(colorizerRequest)
            .map((res: Response) => res.json())
            .map((json: MappingColorizer) => { return json; }).toPromise();
    }

    getColorizerStream(operator: Operator): Observable<MappingColorizer> {
        return Observable.combineLatest(
            this.projectService.getTimeStream(), this.projectService.getProjectionStream()
        ).switchMap(
            ([time, projection]) => this.getColorizer(operator, time, projection)
        ).publishReplay(1).refCount();
    }

    getProvenance(operator: Operator
                    // time: moment.Moment,
                    // projection: Projection
                ): Promise<Array<Provenance>> {

        // const projectedOperator = operator.getProjectedOperator(projection);
        const serviceType = 'provenance';
        const provenanceRequest = Config.MAPPING_URL
            + '?' + 'SERVICE=' + serviceType
            + '&' + 'query=' + encodeURIComponent(operator.toQueryJSON());
            // + '&' + 'CRS=' + projection.getCode()
            // + '&' + 'TIME=' + time.toISOString(); // TODO: observable-isieren
        console.log('getProvenance', provenanceRequest);
        return this.http.get(provenanceRequest)
            .map((res: Response) => res.json())
            .map(json => json as [Provenance]).toPromise();
    }

    getProvenanceStream(operator: Operator): Observable<Array<Provenance>> {
        // return Observable.combineLatest(
        //     this.projectService.getTimeStream(), this.projectService.getProjectionStream()
        // ).switchMap(([time, projection]) => {
            return Observable.fromPromise(
                this.getProvenance(operator)
            );
        // }).publishReplay(1).refCount();
    }

    getGBIFAutoCompleteResults(scientificName: string): Promise<Array<string>> {
        const serverURL = 'http://pc12388.mathematik.uni-marburg.de:81/GFBioJavaWS/Wizzard/';
        const service = 'searchSpecies';
        return this.http.get(serverURL + service + '?term=' + scientificName).toPromise().then(
            response => response.json()
        );
    }

    getGBIFDataSourceCounts(query: string): Promise<Array<{name: string, count: number}>> {
        const serverURL = 'http://pc12388.mathematik.uni-marburg.de:81/GFBioJavaWS/Wizzard/';
        const service = 'queryDataSources';
        return this.http.get(serverURL + service + '?query=' + encodeURI(query)).toPromise().then(
            response => response.json()
        );
    }

}
