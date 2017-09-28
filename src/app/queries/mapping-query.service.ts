import {Injectable} from '@angular/core';
import {Http, Response} from '@angular/http';
import {Observable} from 'rxjs/Rx';

import {WFSOutputFormat} from './output-formats/wfs-output-format.model';
import {WCSOutputFormat} from './output-formats/wcs-output-format.model';
import {MappingRequestParameters} from './request-parameters.model';
import {UserService} from '../users/user.service';
import {ViewportSize} from '../map/map.service';
import {NotificationService} from '../notification.service';

import {Operator} from '../operators/operator.model';
import {Projection} from '../operators/projection.model';
import {ResultTypes} from '../operators/result-type.model';
import {MappingColorizer} from '../layers/symbology/symbology.model';

import {PlotData} from '../plots/plot.model';
import {Provenance} from '../provenance/provenance.model';
import {Time, TimePoint} from '../time/time.model';
import {Config} from '../config.service';

import * as ol from 'openlayers';
import {TemporalAggregationType} from '../operators/types/temporal-aggregation-type';
// import projection = d3.geo.projection;

/**
 * A service that encapsulates MAPPING queries.
 */
@Injectable()
export class MappingQueryService {

    /**
     * Inject the Http-Provider for asynchronous requests.
     */
    constructor(private config: Config,
                private http: Http,
                private userService: UserService,
                private notificationService: NotificationService) {
    }

    /**
     * Get a MAPPING url for the plot operator and time.
     * @param config
     * @returns the query url
     */
    getPlotQueryUrl(config: { operator: Operator, time: Time }): string {
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
    getPlotData(config: { operator: Operator, time: Time }): Observable<PlotData> {
        return this.http.get(this.getPlotQueryUrl(config))
            .map(response => response.json());
    }

    /**
     * Get a MAPPING url for the WFS request.
     * @param config.operator the operator graph
     * @param config.time the point in time
     * @param config.projection the desired projection
     * @param config.outputFormat the output format
     * @param config.viewportSize the viewport size
     * @param config.clustered if the result should be clustered
     * @returns the query url
     */
    getWFSQueryUrl(config: {
        operator: Operator,
        time: Time,
        projection: Projection,
        outputFormat: WFSOutputFormat,
        viewportSize?: ViewportSize,
        clustered?: boolean
    }): string {
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
        if (config.clustered) {
            parameters.setParameter('clustered', config.clustered);
        } else {
            parameters.setParameter('clustered', false);
        }

        if (config.viewportSize) {

            const extent = (config.viewportSize as ViewportSize).extent;
            const resolution = (config.viewportSize as ViewportSize).resolution;

            if (config.projection.getCode() === 'EPSG:4326') {
                parameters.setParameter('bbox', extent[1] + ',' + extent[0] + ',' + extent[3] + ',' + extent[2]);
            } else {
                parameters.setParameter('bbox', extent.join(','));
            }
            parameters.setParameter('resolution', resolution);
            // parameters.setParameter('height', Math.max(1, resolution));
            // parameters.setParameter('width', Math.max(1, resolution));
        }

        return this.config.MAPPING_URL + '?' + parameters.toMessageBody();
    }

    /**
     * Retrieve the WFS data by querying MAPPING.
     * @param config.operator the operator graph
     * @param config.time the point in time
     * @param config.projection the desired projection
     * @param config.outputFormat the output format
     * @param config.viewportSize the viewport size
     * @param config.clustered if the result should be clustered
     * @returns a Promise of features
     */
    getWFSData(config: {
        operator: Operator,
        time: Time,
        projection: Projection,
        outputFormat: WFSOutputFormat,
        viewportSize: ViewportSize,
        clustered: boolean
    }): Observable<string> {
        return this.http.get(this.getWFSQueryUrl(config))
            .map(response => response.text());
    }

    /**
     * Get MAPPING query parameters for the WMS request.
     * @returns the query parameters
     * @param config
     */
    getWMSQueryParameters(config: {
        operator: Operator,
        time: Time,
        projection: Projection,
    }): MappingRequestParameters {
        const projectedOperator = config.operator.getProjectedOperator(config.projection);

        return new MappingRequestParameters({
            service: 'WMS',
            request: 'GetMap',
            sessionToken: this.userService.getSession().sessionToken,
            parameters: {
                version: this.config.WMS.VERSION,
                format: this.config.WMS.FORMAT,
                EXCEPTIONS: this.config.DEBUG_MODE.MAPPING ? 'INIMAGE' : 'BLANK',
                transparent: true,
                layers: projectedOperator.toQueryJSON(),
                debug: (this.config.DEBUG_MODE.MAPPING ? 1 : 0),
                // time: config.time.asRequestString(),
            },
        });
    }

    /**
     * Get a MAPPING url for the WMS request.
     * @returns the query url
     * @param config
     */
    getWMSQueryUrl(config: {
        operator: Operator,
        time: Time,
        projection: Projection
    }): string {
        if (config.time.getEnd().isAfter(config.time.getStart())) {
            const duration = config.time.getEnd().diff(config.time.getStart()) / 1000;
            console.log('Duration: ' + config.time.getStart() + ' to ' + config.time.getEnd() + ': ' + duration);

            const aggregationOperator2 = new Operator({
                operatorType: new TemporalAggregationType({
                    duration: duration,
                    aggregation: 'min',
                }),
                resultType: config.operator.resultType,
                projection: config.operator.projection,
                attributes: config.operator.attributes,
                dataTypes: config.operator.dataTypes,
                units: config.operator.units,
                rasterSources: config.operator.resultType === ResultTypes.RASTER ? [config.operator] : [],
                pointSources: config.operator.resultType === ResultTypes.POINTS ? [config.operator] : [],
                lineSources: config.operator.resultType === ResultTypes.LINES ? [config.operator] : [],
                polygonSources: config.operator.resultType === ResultTypes.POLYGONS ? [config.operator] : [],
            });

            /*const aggregationOperator = new Operator({
                operatorType: new TemporalAggregationType({
                    duration: duration,
                    aggregation: 'min',
                }),
                resultType: config.operator.resultType,
                projection: config.operator.projection,
                attributes: [],
                dataTypes: config.operator.dataTypes,
                units: config.operator.units,
                rasterSources: config.operator.getSources(ResultTypes.RASTER),
                pointSources: config.operator.getSources(ResultTypes.POINTS),
                lineSources: config.operator.getSources(ResultTypes.LINES),
                polygonSources: config.operator.getSources(ResultTypes.POLYGONS),
            });

            const originalOperator = new Operator({
                operatorType: config.operator.operatorType,
                resultType: config.operator.resultType,
                projection: config.operator.projection,
                attributes: config.operator.attributes,
                dataTypes: config.operator.dataTypes,
                units: config.operator.units,
                rasterSources: config.operator.resultType === ResultTypes.RASTER ? [aggregationOperator] : [],
                pointSources: config.operator.resultType === ResultTypes.POINTS ? [aggregationOperator] : [],
                lineSources: config.operator.resultType === ResultTypes.LINES ? [aggregationOperator] : [],
                polygonSources: config.operator.resultType === ResultTypes.POLYGONS ? [aggregationOperator] : [],
            });*/

            const newConfig = {
                operator: aggregationOperator2,
                time: new TimePoint(config.time.getStart()),
                projection: config.projection
            };

            console.log(newConfig.operator);

            const parameters = this.getWMSQueryParameters(newConfig);
            console.log("Time Interval: " + this.config.MAPPING_URL + '?' + parameters.toMessageBody());

            return this.config.MAPPING_URL + '?' + parameters.toMessageBody();
        } else {
            const parameters = this.getWMSQueryParameters(config);
            console.log("No Time Interval: " + this.config.MAPPING_URL + '?' + parameters.toMessageBody());

            return this.config.MAPPING_URL + '?' + parameters.toMessageBody();
        }
    }

    getWCSQueryUrl(config: {
        operator: Operator,
        time: Time,
        projection: Projection,
        outputFormat: WCSOutputFormat,
        size: {
            x: number,
            y: number,
        },
    }): string {
        const projectedOperator = config.operator.getProjectedOperator(config.projection);

        const extent = config.projection.getExtent();

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
                outputcrs: config.projection.getCrsURI(),
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
                 projection: Projection): Observable<MappingColorizer> {


        let timeStart;
        if (time.getEnd().isAfter(time.getStart())) {
            timeStart = new TimePoint(time.getStart());
        } else {
            timeStart = time;
        }

        const request = new MappingRequestParameters({
            service: 'WMS',
            request: 'GetColorizer',
            sessionToken: this.userService.getSession().sessionToken,
            parameters: {
                version: this.config.WMS.VERSION,
                layers: operator.getProjectedOperator(projection).toQueryJSON(),
                debug: (this.config.DEBUG_MODE.MAPPING ? 1 : 0),
                time: timeStart.asRequestString(),
                crs: projection.getCode(),
            },
        });
        // console.log('colorizerRequest', colorizerRequest);
        return this.http.get(this.config.MAPPING_URL + '?' + request.toMessageBody())
            .map((res: Response) => res.json() as MappingColorizer)
            .catch((error, {}) => {
                this.notificationService.error(`Could not load colorizer: »${error}«`);
                return Observable.of({interpolation: 'unknown', breakpoints: []});
            }).map(c => {

                if (c['result'] && c['result'] === 'No raster for the given time available.') {
                    this.notificationService.info('No raster for the given time available.');
                }

                if (c.breakpoints.length > 1 && c.breakpoints[0][0] < c.breakpoints[c.breakpoints.length - 1][0]) {
                    c.breakpoints = c.breakpoints.reverse();
                }
                return c;
            })
    }

    getProvenance(config: {
        operator: Operator,
        time: Time,
        projection: Projection,
        extent: ol.Extent,
    }): Promise<Array<Provenance>> {

        let timeStart;
        if (config.time.getEnd().isAfter(config.time.getStart())) {
            timeStart = new TimePoint(config.time.getStart());
        } else {
            timeStart = config.time;
        }

        const request = new MappingRequestParameters({
            service: 'provenance',
            request: '',
            sessionToken: this.userService.getSession().sessionToken,
            parameters: {
                query: encodeURIComponent(config.operator.getProjectedOperator(config.projection).toQueryJSON()),
                crs: config.projection.getCode(),
                time: timeStart.asRequestString(),
                bbox: config.projection.getCode() === 'EPSG:4326' ?
                    config.projection.getExtent()[1]
                    + ',' + config.projection.getExtent()[0] + ','
                    + config.projection.getExtent()[3] + ','
                    + config.projection.getExtent()[2]
                    : config.projection.getExtent().join(','),
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

    getGBIFDataSourceCounts(scientificName: string): Promise<Array<{ name: string, count: number }>> {
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
