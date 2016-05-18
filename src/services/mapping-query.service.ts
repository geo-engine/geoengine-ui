import {Injectable} from 'angular2/core';
import {Http, Response} from 'angular2/http';
import {Observable} from 'rxjs/Rx';

import moment from 'moment';

import {Operator} from '../models/operator.model';
import {Projection} from '../models/projection.model';
import {ResultTypes} from '../models/result-type.model';

import Config from '../models/config.model';
import {PlotData} from '../plots/plot.model';

import {GeoJsonFeatureCollection} from '../models/geojson.model';

type ParametersType = {[index: string]: string | number | boolean};

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
export const WFSOutputFormats = new WFSOutputFormatCollection();

/**
 * A service that encapsulates MAPPING queries.
 */
@Injectable()
export class MappingQueryService {
    /**
     * Inject the Http-Provider for asynchronous requests.
     */
    constructor(private http: Http) {}

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
     * @param time$ a time observable
     * @returns an Observable of PlotData
     */
    getPlotDataStream(operator: Operator, time$: Observable<moment.Moment>): Observable<PlotData> {
        // TODO: remove  `fromPromise` when new rxjs version is used
        // TODO: use flatMapLatest
        return time$.map(time => Observable.fromPromise(this.getPlotData(operator, time))).switch();
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
               projection: Projection): Promise<JSON> {
        return this.http.get(this.getWFSQueryUrl(operator, time, projection, WFSOutputFormats.JSON))
                        .toPromise()
                        .then(response => response.json());
    }

    /**
     * Create a stream of WFS data that emits data on every time change.
     * @param operator the operator graph
     * @param time$ a time observable
     * @param projection$ a projection stream
     * @param outputFormat the output format
     * @returns an Observable of features
     */
    getWFSDataStream(operator: Operator,
                     time$: Observable<moment.Moment>,
                     projection$: Observable<Projection>,
                     outputFormat: WFSOutputFormat): Observable<string> {
        // TODO: remove  `fromPromise` when new rxjs version is used
        // TODO: use flatMapLatest
        return Observable.combineLatest(time$, projection$).map(([time, projection]) => {
            return Observable.fromPromise(
                this.getWFSData(operator, time, projection, outputFormat)
            );
        }).switch();
    }

    getWFSDataStreamAsGeoJsonFeatureCollection(operator: Operator,
                     time$: Observable<moment.Moment>,
                     projection$: Observable<Projection>): Observable<GeoJsonFeatureCollection> {
        return Observable.combineLatest(time$, projection$).map(([time, projection]) => {
            return Observable.fromPromise(
                this.getWFSDataAsJson(operator, time, projection)
            );
        }).switch().map(result => { return result as GeoJsonFeatureCollection; });
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
}
