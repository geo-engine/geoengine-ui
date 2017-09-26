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
import {Time} from '../time/time.model';
import {Config} from '../config.service';

import * as ol from 'openlayers';

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
     * Get a MAPPING parameters for the WFS request.
     * @param config.operator the operator graph
     * @param config.time the point in time
     * @param config.projection the desired projection
     * @param config.outputFormat the output format
     * @param config.viewportSize the viewport size
     * @param config.clustered if the result should be clustered
     * @returns the query parameters
     */
    getWFSQueryParameters(config: {
        operator: Operator,
        time: Time,
        projection: Projection,
        outputFormat: WFSOutputFormat,
        viewportSize?: ViewportSize,
        clustered?: boolean
    }): MappingRequestParameters {
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

        return parameters;
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
        return this.config.MAPPING_URL + '?' + this.getWFSQueryParameters(config).toMessageBody();
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
        const requestParameters = this.getWFSQueryParameters(config);
        return this.http.post(
            this.config.MAPPING_URL,
            requestParameters.toMessageBody(false),
            {headers: requestParameters.getHeaders()}
        ).map(response => response.text());
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
                time: config.time.asRequestString(),
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
        const parameters = this.getWMSQueryParameters(config);

        return this.config.MAPPING_URL + '?' + parameters.toMessageBody();
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

        const request = new MappingRequestParameters({
            service: 'WMS',
            request: 'GetColorizer',
            sessionToken: this.userService.getSession().sessionToken,
            parameters: {
                version: this.config.WMS.VERSION,
                layers: operator.getProjectedOperator(projection).toQueryJSON(),
                debug: (this.config.DEBUG_MODE.MAPPING ? 1 : 0),
                time: time.asRequestString(),
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
        const request = new MappingRequestParameters({
            service: 'provenance',
            request: '',
            sessionToken: this.userService.getSession().sessionToken,
            parameters: {
                query: encodeURIComponent(config.operator.getProjectedOperator(config.projection).toQueryJSON()),
                crs: config.projection.getCode(),
                time: config.time.asRequestString(),
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

        // return this.http.get(
        //     this.config.MAPPING_URL + '?' + request.toMessageBody()
        // ).map(
        //     (res: Response) => res.json()
        // ).map(
        //     json => json as [Provenance]
        // ).toPromise();

        return this.http.post(
                this.config.MAPPING_URL,
                request.toMessageBody(false),
                {headers: request.getHeaders()}
            ).map((res: Response) => res.json())
            .map(json => json as [Provenance])
            .toPromise();
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
