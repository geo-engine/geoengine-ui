
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {WFSOutputFormat} from './output-formats/wfs-output-format.model';
import {WCSOutputFormat} from './output-formats/wcs-output-format.model';
import {MappingRequestParameters} from './request-parameters.model';
import {UserService} from '../users/user.service';
import {ViewportSize} from '../map/map.service';

import {Operator} from '../operators/operator.model';
import {Projection} from '../operators/projection.model';
import {ResultTypes} from '../operators/result-type.model';
import {DeprecatedMappingColorizerDoNotUse} from '../colors/colorizer-data.model';

import {PlotData} from '../plots/plot.model';
import {Provenance} from '../provenance/provenance.model';
import {Time, TimePoint} from '../time/time.model';
import {Config} from '../config.service';

import ol from 'ol';
import {TemporalAggregationType} from '../operators/types/temporal-aggregation-type';
import {
    Basket,
    BasketResult,
    BasketsOverview,
    IBasketAbcdResult,
    IBasketGroupedAbcdResult
} from '../operators/dialogs/baskets/gfbio-basket.model';
import * as moment from 'moment';
import {Extent} from 'ol/extent';

@Injectable()
export class MappingQueryService {
    /**
     * Inject the HttpClient-Provider for asynchronous requests.
     */
    constructor(private config: Config,
                private http: HttpClient,
                private userService: UserService) {
    }

    /**
     * A service that encapsulates MAPPING queries.
     */

    private static stripEndingTime(time: Time) {
        let timeStart;
        if (time.getEnd().isAfter(time.getStart())) {
            timeStart = new TimePoint(time.getStart());
        } else {
            timeStart = time;
        }
        return timeStart;
    }

    /**
     * Get a MAPPING url for the plot operator and time.
     * @param config.operator plot operator
     * @param config.time time interval for the plot
     * @param config.extent the map extent
     * @param config.projection [IMAGE ONLY] current projection
     * @param config.plotWidth [IMAGE ONLY] width for image plot request
     * @param config.plotHeight [IMAGE ONLY] height for image plot request
     * @returns the query url
     */
    getPlotQueryUrl(config: {
        operator: Operator,
        time: Time,
        extent: Extent,
        projection: Projection,
        plotWidth?: number,
        plotHeight?: number,
    }): string {
        // plot request with temporal information
        const request = new MappingRequestParameters({
            service: 'plot',
            request: '',
            sessionToken: this.userService.getSession().sessionToken,
            parameters: {
                time: config.time.asRequestString(),
            }
        });

        // raster sizes
        if (config.operator.getSources(ResultTypes.RASTER).size > 0) {
            // TODO: magic numbers
            request.setParameter('width', 1024);
            request.setParameter('height', 1024);
        }

        // projection and extent
        request.setParameter('crs', config.projection.getCode());
        if (config.projection.getCode() === 'EPSG:4326') {
            request.setParameter('bbox', config.extent[1] + ',' + config.extent[0] + ',' + config.extent[3] + ',' + config.extent[2]);
        } else {
            request.setParameter('bbox', config.extent.join(','));
        }

        // re-create operator with projected sources
        // TODO: gerenalize this behavior or rework plotting
        const operator = new Operator({
            operatorType: config.operator.operatorType,
            resultType: config.operator.resultType,
            projection: config.projection,
            attributes: config.operator.attributes,
            dataTypes: config.operator.dataTypes,
            units: config.operator.units,
            rasterSources: config.operator.getSources(ResultTypes.RASTER)
                .map(rasterSource => rasterSource.getProjectedOperator(config.projection))
                .toArray(),
            pointSources: config.operator.getSources(ResultTypes.POINTS)
                .map(rasterSource => rasterSource.getProjectedOperator(config.projection))
                .toArray(),
            lineSources: config.operator.getSources(ResultTypes.LINES)
                .map(rasterSource => rasterSource.getProjectedOperator(config.projection))
                .toArray(),
            polygonSources: config.operator.getSources(ResultTypes.POLYGONS)
                .map(rasterSource => rasterSource.getProjectedOperator(config.projection))
                .toArray(),
        });

        const isRScriptPlot = config.operator.operatorType.getMappingName() === 'r_script'
            && config.operator.operatorType.toMappingDict()['result'] === 'plot';
        if (isRScriptPlot) {
            if (!config.plotWidth || !config.plotHeight) {
                throw new Error('There must be `width`, `height` and `projection` set for an `r_script` plot request.')
            }

            const operatorQueryDict = operator.toQueryDict();

            // TODO: find more elegant way
            operatorQueryDict.params['plot_width'] = config.plotWidth;
            operatorQueryDict.params['plot_height'] = config.plotHeight;

            request.setParameter('query', encodeURIComponent(JSON.stringify(operatorQueryDict)));
        } else {
            request.setParameter('query', encodeURIComponent(operator.toQueryJSON()));
        }

        return this.config.MAPPING_URL + '?' + request.toMessageBody();
    }

    /**
     * Retrieve the plot data by querying MAPPING.
     * @param config
     * @returns a Promise of PlotData
     */
    getPlotData(config: {
        operator: Operator,
        time: Time,
        extent: Extent,
        projection: Projection,
        plotWidth?: number,
        plotHeight?: number,
    }): Observable<PlotData> {
        return this.http.get<PlotData>(this.getPlotQueryUrl(config));
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
        viewportSize?: ViewportSize,
        clustered: boolean
    }): Observable<string> {
        const requestParameters = this.getWFSQueryParameters(config);
        return this.http.post<string>(
            this.config.MAPPING_URL,
            requestParameters.toMessageBody(false),
            {headers: requestParameters.getHeaders()}
        );
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
                EXCEPTIONS: this.config.DEBUG_MODE.MAPPING ? 'INIMAGE' : 'INIMAGE',
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
        let parameters: MappingRequestParameters;

        if (config.time.getEnd().isAfter(config.time.getStart())) {
            const duration = config.time.getEnd().diff(config.time.getStart()) / 1000;

            const aggregationOperator = new Operator({
                operatorType: new TemporalAggregationType({
                    duration: duration,
                    aggregation: 'avg',
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

            parameters = this.getWMSQueryParameters({
                operator: aggregationOperator,
                time: new TimePoint(config.time.getStart()),
                projection: config.projection
            });
        } else {
            parameters = this.getWMSQueryParameters(config);
        }

        // console.log(config.time, parameters.toMessageBody());
        return this.config.MAPPING_URL + '?' + parameters.toMessageBody(true);
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
                 projection: Projection): Observable<DeprecatedMappingColorizerDoNotUse> {


        // TODO
        let timeStart = MappingQueryService.stripEndingTime(time);

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
        return this.http.get<DeprecatedMappingColorizerDoNotUse>(this.config.MAPPING_URL + '?' + request.toMessageBody(true)).pipe(
        // .catch((error, {}) => {
        //    this.notificationService.error(`Could not load colorizer: »${error}«`);
        //    return Observable.of({interpolation: 'unknown', breakpoints: []});
        // })
            map(c => {
                if (c.breakpoints.length > 1 && c.breakpoints[0][0] < c.breakpoints[c.breakpoints.length - 1][0]) {
                    c.breakpoints = c.breakpoints.reverse();
                }
                return c;
            }))
    }

    getProvenance(config: {
        operator: Operator,
        time: Time,
        projection: Projection,
        extent: ol.Extent,
    }): Promise<Array<Provenance>> {

        // TODO
        let timeStart = MappingQueryService.stripEndingTime(config.time);

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

        // return this.http.get(
        //     this.config.MAPPING_URL + '?' + request.toMessageBody()
        // ).map(
        //     (res: Response) => res.json()
        // ).map(
        //     json => json as [Provenance]
        // ).toPromise();

        return this.http
            .post<Array<Provenance>>(
                this.config.MAPPING_URL,
                request.toMessageBody(false),
                {headers: request.getHeaders()}
            ).toPromise();
    }

    getGBIFAutoCompleteResults(level: string, term: string): Promise<Array<string>> {
        const parameters = new MappingRequestParameters({
            service: 'gfbio',
            request: 'searchSpecies',
            sessionToken: this.userService.getSession().sessionToken,
            parameters: {
                level: level,
                term: term,
            },
        });

        const queryUrl = this.config.MAPPING_URL + '?' + parameters.toMessageBody();

        // TODO: react on failures of this weired protocol
        return this.http.get<{ speciesNames: Array<string> }>(queryUrl).toPromise().then(response => response.speciesNames);
    }

    getGBIFDataSourceCounts(level: string, term: string): Promise<Array<{ name: string, count: number }>> {
        const parameters = new MappingRequestParameters({
            service: 'gfbio',
            request: 'queryDataSources',
            sessionToken: this.userService.getSession().sessionToken,
            parameters: {
                level: level,
                term: term,
            },
        });

        const queryUrl = this.config.MAPPING_URL + '?' + parameters.toMessageBody();

        // TODO: react on failures of this weired protocol
        return this.http
            .get<{ dataSources: Array<{ name: string, count: number }> }>(queryUrl)
            .toPromise()
            .then(response => response.dataSources);
    }

    getGFBioBaskets(config: {
        offset: number,
        limit: number,
    }): Observable<BasketsOverview> {
        const parameters = new MappingRequestParameters({
            service: 'gfbio',
            request: 'baskets',
            sessionToken: this.userService.getSession().sessionToken,
            parameters: {
                offset: config.offset,
                limit: config.limit,
            },
        });

        const queryUrl = this.config.MAPPING_URL + '?' + parameters.toMessageBody();

        interface BasketsOverviewRaw {
            baskets: Array<{
                basketId: number,
                query: string,
                timestamp: string,
            }>,
            totalNumberOfBaskets: number,
        }

        return this.http
            .get<BasketsOverviewRaw>(queryUrl).pipe(
            map((basketsOverview: BasketsOverviewRaw) => {
                return {
                    baskets: basketsOverview.baskets.map(basket => {
                        return {
                            basketId: basket.basketId,
                            query: basket.query,
                            timestamp: moment(basket.timestamp, 'YYYY-MM-DD HH:mm:ss.S'),
                        };
                    }),
                    totalNumberOfBaskets: basketsOverview.totalNumberOfBaskets,
                };
            }));
    }

    getGFBioBasket(id: number): Observable<Basket> {
        const parameters = new MappingRequestParameters({
            service: 'gfbio',
            request: 'basket',
            sessionToken: this.userService.getSession().sessionToken,
            parameters: {
                id: id,
            },
        });

        const queryUrl = this.config.MAPPING_URL + '?' + parameters.toMessageBody();

        return this.http
            .get<Basket>(queryUrl).pipe(
            map((basket: Basket) => {
                const regex = /(.*),\s*a\s*(.*)?record\s*of\s*the\s*"(.*)"\s*dataset\s*\[ID:\s*(.*)\]\s*/;

                const basketResults: Array<BasketResult> = [];
                basket.results.forEach(result => {
                    let entry = basketResults.find((b) => b.dataLink === result.dataLink);

                    if (result.type === 'abcd') {
                        const abcd = result as IBasketAbcdResult;

                        const unit_type_title_id = regex.exec(abcd.title);
                        const title = (unit_type_title_id && unit_type_title_id[3]) ? unit_type_title_id[3] : abcd.title;
                        const unit = (unit_type_title_id && unit_type_title_id[4]) ? {
                            unitId: unit_type_title_id[4],
                            prefix: unit_type_title_id[1],
                            type: unit_type_title_id[2],
                            metadataLink: abcd.metadataLink
                        } : undefined;

                        if (!entry) {
                            const metadataLink = abcd.metadataLink;
                            const grouped: IBasketGroupedAbcdResult = {
                                title: title,
                                dataLink: abcd.dataLink,
                                authors: abcd.authors,
                                available: abcd.available,
                                dataCenter: abcd.dataCenter,
                                metadataLink: metadataLink,
                                units: (unit) ? [unit] : [],
                                type: 'abcd_grouped',
                                resultType: 'points',
                            };
                            basketResults.push(grouped);
                        } else {
                            if (unit) {
                                const grouped = entry as IBasketGroupedAbcdResult;
                                grouped.units.push(unit);
                            }
                        }
                    } else if (!entry) {
                        basketResults.push(result);
                    }
                });

                return {
                    query: basket.query,
                    results: basketResults,
                    timestamp: moment(basket.timestamp, 'MM-DD-YYYY HH:mm:ss.SSS'),
                }
            }));
    }

}
