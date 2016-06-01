import {Injectable} from '@angular/core';
import {Http, Headers, Response} from '@angular/http';
import {Observable} from 'rxjs/Rx';

import moment from 'moment';

import {ProjectService} from '../project/project.service';
import {UserService} from '../users/user.service';

import {Operator} from '../operators/operator.model';
import {Projection} from '../operators/projection.model';
import {ResultTypes} from '../operators/result-type.model';

import Config from '../app/config.model';
import {PlotData} from '../plots/plot.model';

import {GeoJsonFeatureCollection} from '../models/geojson.model';
import {Provenance} from '../provenance/provenance.model';

type ParametersType = {[index: string]: string | number | boolean};

export interface MappingColorizer {
    interpolation: string;
    breakpoints: Array<[number, string, string]>;
}

class MappingRequestParameters {
    private parameters: {[index: string]: string | boolean | number};

    constructor(config: {
        service: string;
        request: string,
        sessionToken: string,
        parameters?: {[index: string]: string | boolean | number}
    }) {
        this.parameters = {
            service: config.service,
            request: config.request,
            sessiontoken: config.sessionToken,
        };
        if (config.parameters) {
            Object.keys(config.parameters).forEach(
                key => this.parameters[key] = config.parameters[key]
            );
        }
    }

    toMessageBody(): string {
        return Object.keys(this.parameters).map(
            key => [key, this.parameters[key]].join('=')
        ).join('&');
    }

    getHeaders(): Headers {
        return new Headers({
           'Content-Type': 'application/x-www-form-urlencoded',
        });
    }
}

/**
 * WFS Output Formats
 */
class WFSOutputFormatCollection {
    private _JSON = new JSONWFSOutputFormat();
    private _CSV = new CSVWFSOutputFormat();
    get JSON(): WFSOutputFormat { return this._JSON; };
    get CSV(): WFSOutputFormat { return this._CSV; };
}

/**
 * Base class for WFS Output Formats
 */
abstract class WFSOutputFormat {
    protected abstract format: string;
    getFormat(): string {
        return this.format;
    }
}

/**
 * JSON Output format
 */
class JSONWFSOutputFormat extends WFSOutputFormat {
    protected format = 'application/json';
}

/**
 * CSV Output format
 */
class CSVWFSOutputFormat extends WFSOutputFormat {
    protected format = 'csv';
}

/**
 * Export WFSOutputFormat as singleton.
 */
// tslint:disable-next-line:variable-name
export const WFSOutputFormats = new WFSOutputFormatCollection();

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
        private projectService: ProjectService
    ) {}

    /**
     * Get a MAPPING url for the plot operator and time.
     * @param operator the operator graph
     * @param time the point in time
     * @returns the query url
     */
    getPlotQueryUrl(operator: Operator, time: moment.Moment): string {
        const parameters: ParametersType = {
            service: 'plot',
            query: operator.toQueryJSON(),
            time: time.toISOString(),
            crs: operator.projection.getCode(),
        };

        if (operator.getSources(ResultTypes.RASTER).size > 0) {
            parameters['height'] = 1024; // magic number
            parameters['width'] = 1024; // magic number
        }

        return Config.MAPPING_URL + '?' +
               Object.keys(parameters).map(key => key + '=' + parameters[key]).join('&');
    }

    /**
     * Retrieve the plot data by querying MAPPING.
     * @param operator the operator graph
     * @param time the point in time
     * @returns a Promise of PlotData
     */
    getPlotData(operator: Operator, time: moment.Moment): Promise<PlotData> {
        return this.http.get(this.getPlotQueryUrl(operator, time))
                        .toPromise()
                        .then(response => response.json());
    }

    /**
     * Create a stream of PlotData that emits data on every time change.
     * @param operator the operator graph
     * @returns an Observable of PlotData
     */
    getPlotDataStream(operator: Operator): Observable<PlotData> {
        return this.projectService.getTimeStream().switchMap(
            time => this.getPlotData(operator, time)
        );
    }

    /**
     * Get a MAPPING url for the WFS request.
     * @param operator the operator graph
     * @param time the point in time
     * @param projection the desired projection
     * @param outputFormat the output format
     * @returns the query url
     */
    getWFSQueryUrl(operator: Operator,
                   time: moment.Moment,
                   projection: Projection,
                   outputFormat: WFSOutputFormat): string {
        const projectedOperator = operator.getProjectedOperator(projection);

        const parameters: ParametersType = {
            service: 'WFS',
            version: Config.WFS.VERSION,
            request: 'GetFeature',
            typeNames: projectedOperator.resultType.getCode()
                       + ':'
                       + projectedOperator.toQueryJSON(),
            srsname: projection.getCode(),
            time: time.toISOString(),
            outputFormat: outputFormat.getFormat(),
        };

        return Config.MAPPING_URL + '?' +
               Object.keys(parameters).map(key => key + '=' + parameters[key]).join('&');
    }

    /**
     * Retrieve the WFS data by querying MAPPING.
     * @param operator the operator graph
     * @param time the point in time
     * @param projection the desired projection
     * @param outputFormat the output format
     * @returns a Promise of features
     */
    getWFSData(operator: Operator,
               time: moment.Moment,
               projection: Projection,
               outputFormat: WFSOutputFormat): Promise<string> {
        return this.http.get(this.getWFSQueryUrl(operator, time, projection, outputFormat))
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
    getWFSDataAsJson(operator: Operator,
                     time: moment.Moment,
                     projection: Projection): Promise<GeoJsonFeatureCollection> {
        return this.http.get(this.getWFSQueryUrl(operator, time, projection, WFSOutputFormats.JSON))
                        .toPromise()
                        .then(response => response.json());
    }

    /**
     * Create a stream of WFS data that emits data on every time change.
     * @param operator the operator graph
     * @param outputFormat the output format
     * @returns an Observable of features
     */
    getWFSDataStream(operator: Operator, outputFormat: WFSOutputFormat): Observable<string> {
        return Observable.combineLatest(
            this.projectService.getTimeStream(), this.projectService.getProjectionStream()
        ).switchMap(
            ([time, projection]) => this.getWFSData(operator, time, projection, outputFormat)
        );
    }

    getWFSDataStreamAsGeoJsonFeatureCollection(
        operator: Operator
    ): Observable<GeoJsonFeatureCollection> {
        return Observable.combineLatest(
            this.projectService.getTimeStream(), this.projectService.getProjectionStream()
        ).switchMap(
            ([time, projection]) => this.getWFSDataAsJson(operator, time, projection)
        ).map(result => {
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
    }

    /**
     * Get MAPPING query parameters for the WMS request.
     * @param operator the operator graph
     * @param time the point in time
     * @param projection the desired projection
     * @returns the query parameters
     */
    getWMSQueryParameters(operator: Operator,
                          time: moment.Moment,
                          projection: Projection): ParametersType {
        const projectedOperator = operator.getProjectedOperator(projection);

        return {
            service: 'WMS',
            version: Config.WMS.VERSION,
            request: 'GetMap',
            format: Config.WMS.FORMAT,
            transparent: true,
            layers: projectedOperator.toQueryJSON(),
            debug: (Config.DEBUG_MODE ? 1 : 0),
            time: time.toISOString(),
        };
    }

    /**
     * Get a MAPPING url for the WMS request.
     * @param operator the operator graph
     * @param time the point in time
     * @param projection the desired projection
     * @returns the query url
     */
    getWMSQueryUrl(operator: Operator,
                   time: moment.Moment,
                   projection: Projection): string {
        const parameters: ParametersType = this.getWMSQueryParameters(operator, time, projection);

        return Config.MAPPING_URL + '?' +
               Object.keys(parameters).map(key => key + '=' + parameters[key]).join('&');
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
                ): Promise<Provenance> {

        // const projectedOperator = operator.getProjectedOperator(projection);
        const serviceType = 'provenance';
        const provenanceRequest = Config.MAPPING_URL
            + '?' + 'SERVICE=' + serviceType
            + '&' + 'query=' + operator.toQueryJSON();
            // + '&' + 'CRS=' + projection.getCode()
            // + '&' + 'TIME=' + time.toISOString(); // TODO: observable-isieren
        console.log('getProvenance', provenanceRequest);
        return this.http.get(provenanceRequest)
            .map((res: Response) => res.json())
            .map((json: Provenance) => { return json; }).toPromise();
    }

    getProvenanceStream(operator: Operator): Observable<Provenance> {
        // return Observable.combineLatest(
        //     this.projectService.getTimeStream(), this.projectService.getProjectionStream()
        // ).switchMap(([time, projection]) => {
            return Observable.fromPromise(
                this.getProvenance(operator)
            );
        // }).publishReplay(1).refCount();
    }

}
