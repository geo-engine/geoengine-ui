import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Config, ProjectService, UserService, UUID, TimeIntervalDict, TimeStepDict} from 'wave-core';
import {BehaviorSubject, Observable} from 'rxjs';
import {AppConfig} from '../app-config.service';
import {filter, map, mergeMap, zipWith} from 'rxjs/operators';
import {CountryProviderService} from '../country-provider.service';
import {DataSelectionService} from '../data-selection.service';
import {ActivatedRoute} from '@angular/router';

@Component({
    selector: 'wave-ebv-ebv-selector',
    templateUrl: './ebv-selector.component.html',
    styleUrls: ['./ebv-selector.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EbvSelectorComponent implements OnInit, OnDestroy {
    readonly SUBGROUP_SEARCH_THRESHOLD = 5;

    @ViewChild('container', {static: true})
    readonly containerDiv!: ElementRef<HTMLDivElement>;

    readonly isPlotButtonDisabled$: Observable<boolean>;
    readonly loading$ = new BehaviorSubject(true);

    ebvClasses: Array<EbvClass> = [];
    ebvClass?: EbvClass = undefined;
    ebvNames?: Array<string> = undefined;
    ebvName?: string = undefined;
    ebvDatasets?: Array<EbvDataset> = undefined;
    ebvDataset?: EbvDataset = undefined;

    ebvTree?: EbvHierarchy;

    ebvPath: Array<EbvTreeSubgroup> = [];

    // ebvLayer?: RasterLayer;
    // TODO: implement
    // plotSettings?: {
    //     data$: Observable<DataPoint>;
    //     xLimits: [number, number];
    //     yLimits: [number, number];
    //     yLabel: string;
    // } = undefined;

    private ebvDatasetId?: EbvDatasetId = undefined;

    constructor(
        private readonly userService: UserService,
        @Inject(Config) private readonly config: AppConfig,
        private readonly changeDetectorRef: ChangeDetectorRef,
        private readonly http: HttpClient,
        private readonly projectService: ProjectService,
        private readonly countryProviderService: CountryProviderService,
        private readonly dataSelectionService: DataSelectionService,
        private readonly route: ActivatedRoute,
    ) {
        this.isPlotButtonDisabled$ = this.countryProviderService.getSelectedCountryStream().pipe(map((country) => !country));
    }

    ngOnInit(): void {
        this.userService.getSessionTokenForRequest().subscribe(() => {
            this.request<Array<EbvClass>>('ebv/classes', undefined, (data) => {
                this.ebvClasses = data;

                this.handleQueryParams();
            });
        });
    }

    ngOnDestroy(): void {}

    setEbvClass(ebvClass: EbvClass): void {
        if (this.ebvClass === ebvClass) {
            return;
        }

        this.ebvClass = ebvClass;

        this.clearAfter('ebvClass');

        this.ebvNames = ebvClass.ebvNames;
    }

    setEbvName(ebvName: string): void {
        if (this.ebvName === ebvName) {
            return;
        }

        this.ebvName = ebvName;

        this.clearAfter('ebvName');

        this.request<Array<EbvDataset>>(`ebv/datasets/${encodeURIComponent(ebvName)}`, undefined, (data) => {
            this.ebvDatasets = data;
        });
    }

    setEbvDataset(ebvDataset: EbvDataset): void {
        if (this.ebvDataset === ebvDataset) {
            return;
        }
        this.ebvDataset = ebvDataset;

        this.clearAfter('ebvDataset');

        const datasetId = this.ebvDataset.id;

        this.request<EbvHierarchy>(`ebv/dataset/${datasetId}/subdatasets`, undefined, (data) => {
            this.ebvTree = data;
        });
    }

    setEbvEntity(ebvEntity: EbvTreeEntity): void {
        if (!this.ebvTree) {
            return;
        }

        this.ebvDatasetId = {
            fileName: this.ebvTree.tree.fileName,
            groupNames: this.ebvPath.map((subgroup) => subgroup.name),
            entity: ebvEntity.id,
        };
    }

    setEbvPath(ebvSubgroup: EbvTreeSubgroup, position: number): void {
        this.ebvPath.length = position;
        this.ebvPath.push(ebvSubgroup);
    }

    isAddButtonVisible(): boolean {
        return !!this.ebvDatasetId;
    }

    showEbv(): void {
        if (!this.ebvDatasetId) {
            return;
        }

        // const timePoints = this.ebvDataLoadingInfo.time_points;

        // const timeSteps = timePoints.map((t) => {
        //     const time = moment.unix(t).utc();
        //     const timePoint = new Time(time);
        //     return timePoint;
        // });

        this.projectService.clearLayers();

        // this.ebvLayer = this.generateGdalSourceNetCdfLayer();
        // TODO: data range
        // this.dataSelectionService.setRasterLayer(this.ebvLayer, timeSteps, {min: 0, max: 255});

        this.countryProviderService.replaceVectorLayerOnMap();

        this.scrollToBottom();
    }

    private handleQueryParams(): void {
        this.route.queryParams
            .pipe(
                filter((params) => params.id),
                zipWith(this.userService.getSessionTokenForRequest()),
                mergeMap(([params, sessionToken]) =>
                    this.http.get<EbvDataset>(`${this.config.API_URL}/ebv/dataset/${params.id}`, {
                        headers: new HttpHeaders().set('Authorization', `Bearer ${sessionToken}`),
                    }),
                ),
            )
            .subscribe((dataset) => {
                const ebvClass = this.ebvClasses.find((c) => c.name === dataset.ebvClass);

                if (!!ebvClass) {
                    this.ebvClass = ebvClass;
                    this.ebvNames = ebvClass.ebvNames;

                    this.ebvName = dataset.ebvName;

                    this.request<Array<EbvDataset>>(`ebv/datasets/${encodeURIComponent(dataset.ebvName)}`, undefined, (data) => {
                        this.ebvDatasets = data;

                        const selected = data.find((d) => d.id === dataset.id);

                        if (!!selected) {
                            this.setEbvDataset(selected);
                        }
                    });
                }
            });
    }

    // private generateGdalSourceNetCdfLayer(): RasterLayer {
    //     if (!this.ebvDataset || !this.ebvDataLoadingInfo) {
    //         throw Error('Missing dataset and loading info');
    //     }

    //     const path = this.ebvDataset.dataset_path;
    //     const netCdfSubdataset = '/' + this.ebvSubgroupValues.map((value) => value.name).join('/');

    //     const timePoints = this.ebvDataLoadingInfo.time_points;
    //     const readableTimePoints = timePoints.map((t) => moment.unix(t).utc().format());
    //     const endBound = moment.unix(timePoints[timePoints.length - 1]).add(1, 'days');

    //     const crsCode = this.ebvDataLoadingInfo.crs_code;

    //     const ebvDataTypeCode = 'Float64';
    //     const ebvProjectionCode = crsCode ? crsCode : 'EPSG:4326';

    //     const metricSubgroupIndex = this.ebvSubgroups.findIndex((subgroup) => subgroup.name.toLowerCase() === 'metric');
    //     if (metricSubgroupIndex >= 0) {
    //         const metricValue = this.ebvSubgroupValues[metricSubgroupIndex];
    //     }

    //     const minValue = this.ebvDataLoadingInfo.unit_range[0];
    //     const maxValue = this.ebvDataLoadingInfo.unit_range[1];

    //     // const ebvUnit = new Unit({
    //     //     interpolation: Interpolation.Continuous,
    //     //     measurement,
    //     //     unit: Unit.defaultUnit.unit,
    //     //     min: +minValue.toPrecision(2), // use only two decimals
    //     //     max: +maxValue.toPrecision(2),
    //     // });

    //     const operatorType = new GdalSourceType({
    //         channelConfig: {
    //             // TODO: make channel config optional
    //             channelNumber: 0,
    //             displayValue: readableTimePoints.length > 0 ? readableTimePoints[0] : 'no time avaliable',
    //         },
    //         sourcename: this.ebvDataset.name,
    //         transform: false,
    //         gdal_params: {
    //             channels: timePoints.map((t, i) => {
    //                 return {
    //                     channel: i + 1,
    //                     datatype: ebvDataTypeCode,
    //                     unit: ebvUnit,
    //                     file_name: path,
    //                     netcdf_subdataset: netCdfSubdataset,
    //                 };
    //             }),
    //             time_start: readableTimePoints[0],
    //             time_end: endBound.format(),
    //             channel_start_time_list: readableTimePoints,
    //             file_name: path,
    //             coords: {
    //                 crs: ebvProjectionCode,
    //             },
    //             provenance: {
    //                 citation: this.ebvDataset.name,
    //                 license: this.ebvDataset.license,
    //                 uri: '',
    //             },
    //         },
    //     });

    //     const operatorParameterOptions = new GdalSourceParameterOptions({
    //         operatorType: operatorType.toString(),
    //         channelConfig: {
    //             kind: ParameterOptionType.DICT_ARRAY,
    //             options: readableTimePoints.map((c, i) => {
    //                 return {
    //                     channelNumber: i,
    //                     displayValue: c,
    //                 };
    //             }),
    //         },
    //     });

    //     const sourceOperator = new Operator({
    //         operatorType,
    //         operatorTypeParameterOptions: operatorParameterOptions,
    //         resultType: ResultTypes.RASTER,
    //         projection: Projections.fromCode(ebvProjectionCode),
    //         attributes: [Operator.RASTER_ATTRIBTE_NAME],
    //         dataTypes: new Map<string, DataType>().set(Operator.RASTER_ATTRIBTE_NAME, DataTypes.fromCode(ebvDataTypeCode)),
    //         units: new Map<string, Unit>().set(Operator.RASTER_ATTRIBTE_NAME, ebvUnit),
    //     });

    //     return new RasterLayer<MappingRasterSymbology>({
    //         name: this.ebvName,
    //         operator: sourceOperator,
    //         symbology: MappingRasterSymbology.createSymbology({
    //             unit: ebvUnit,
    //             colorizer: Colormap.createColorizerDataWithName('COOLWARM', ebvUnit.min, ebvUnit.max, 16, 'linear', true),
    //         }),
    //     });
    // }

    // TODO: implement
    private request<T>(request: string, parameters: string | undefined, dataCallback: (data: T) => void): void {
        this.loading$.next(true);

        const parametersOpt = parameters ? `?${parameters}` : '';

        this.userService
            .getSessionTokenForRequest()
            .pipe(
                mergeMap((sessionToken) =>
                    this.http.get<T>(`${this.config.API_URL}/${request}${parametersOpt}`, {
                        headers: new HttpHeaders().set('Authorization', `Bearer ${sessionToken}`),
                    }),
                ),
            )
            .subscribe((data) => {
                dataCallback(data);
                // console.log('dataMAPPING', data);

                this.changeDetectorRef.markForCheck();
                this.loading$.next(false);

                // TODO: reactivate scrolling to some element if necessary
                // this.scrollToBottom();
            });
    }

    private clearAfterEbvClass(): void {
        this.ebvNames = undefined;
        this.ebvName = undefined;
    }

    private clearAfterEbvName(): void {
        this.ebvDatasets = undefined;
        this.ebvDataset = undefined;
    }

    private clearAfterEbvDataset(): void {
        this.ebvTree = undefined;
        this.ebvPath.length = 0;
        this.ebvDatasetId = undefined;
    }

    private clearAfter(field: string, subgroupIndex?: number): void {
        switch (field) {
            case 'ebvClass':
                this.clearAfterEbvClass();
                this.clearAfterEbvName();
                this.clearAfterEbvDataset();

                break;

            case 'ebvName':
                this.clearAfterEbvName();
                this.clearAfterEbvDataset();

                break;

            case 'ebvDataset':
                this.clearAfterEbvDataset();

                break;
            case 'ebvEntity':
                // TODO: do we need this?

                break;
            default:
                // subgroup
                if (subgroupIndex !== undefined) {
                    // TODO: do we need this?
                }
        }
    }

    // TODO: implement
    // plot(): void {
    //     combineLatest([this.timeService.availableTimeSteps, this.countryProviderService.getSelectedCountryStream()])
    //         .pipe(first())
    //         .subscribe(([timeSteps, country]) => {
    //             if (!timeSteps || !country) {
    //                 return;
    //             }

    //             const layer = this.ebvLayer;
    //             const unit = layer.operator.getUnit(Operator.RASTER_ATTRIBTE_NAME);

    //             let yLabel = '';
    //             if (unit.measurement !== Unit.defaultUnit.measurement) {
    //                 yLabel = `Mean value of »${unit.measurement}«`;
    //             }

    //             this.plotSettings = {
    //                 data$: this.createPlotQueries(layer, timeSteps, country),
    //                 xLimits: [0, timeSteps.length - 1],
    //                 yLimits: [unit.min, unit.max],
    //                 yLabel,
    //             };

    //             this.changeDetectorRef.markForCheck();

    //             this.scrollToBottom();
    //         });
    // }

    // TODO: implement
    //     private createPlotQueries(
    //         layer: RasterLayer<AbstractRasterSymbology>,
    //         timeSteps: Array<TimeStep>,
    //         country: Country,
    //     ): Observable<DataPoint> {
    //         const plotRequests: Array<Observable<PlotData>> = [];

    //         let requestWidth = 1024;
    //         let requestHeight = 1024;

    //         const xCoordWidth = Math.abs(country.maxx - country.minx);
    //         const yCoordWidth = Math.abs(country.maxy - country.miny);

    //         if (xCoordWidth > yCoordWidth) {
    //             requestHeight = Math.ceil(requestHeight * (yCoordWidth / xCoordWidth));
    //         } else if (yCoordWidth > xCoordWidth) {
    //             requestWidth = Math.ceil(requestWidth * (xCoordWidth / yCoordWidth));
    //         }

    //         // the gdal source for the country raster
    //         const countryOperatorType = new GdalSourceType({
    //             channelConfig: {
    //                 channelNumber: country.tif_channel_id, // map to gdal source logic
    //                 displayValue: country.name,
    //             },
    //             sourcename: 'ne_10m_admin_0_countries_as_raster',
    //             transform: false,
    //         });

    //         const countrySourceOperator = new Operator({
    //             operatorType: countryOperatorType,
    //             resultType: ResultTypes.RASTER,
    //             projection: Projections.WGS_84,
    //             attributes: [Operator.RASTER_ATTRIBTE_NAME],
    //             dataTypes: new Map<string, DataType>().set(Operator.RASTER_ATTRIBTE_NAME, DataTypes.Byte),
    //             units: new Map<string, Unit>().set(Operator.RASTER_ATTRIBTE_NAME, Unit.defaultUnit),
    //         });

    //         const clipOperator = new Operator({
    //             attributes: layer.operator.attributes,
    //             dataTypes: layer.operator.dataTypes,
    //             operatorType: new ExpressionType({
    //                 datatype: layer.operator.dataTypes.get(Operator.RASTER_ATTRIBTE_NAME),
    //                 expression: 'B != 0 ? A : NAN',
    //                 unit: layer.operator.units.get(Operator.RASTER_ATTRIBTE_NAME),
    //             }),
    //             projection: countrySourceOperator.projection,
    //             rasterSources: [
    //                 layer.operator.getProjectedOperator(countrySourceOperator.projection),
    //                 countrySourceOperator, // the mask layer
    //             ],
    //             resultType: layer.operator.resultType,
    //             units: layer.operator.units,
    //         });

    //         const statisticsOperatorType = new StatisticsType({
    //             raster_width: requestWidth,
    //             raster_height: requestHeight,
    //         });

    //         const operator = new Operator({
    //             operatorType: statisticsOperatorType,
    //             projection: clipOperator.projection,
    //             rasterSources: [clipOperator],
    //             resultType: ResultTypes.PLOT,
    //         });

    //         for (const timeStep of timeSteps) {
    //             plotRequests.push(
    //                 this.mappingQueryService.getPlotData({
    //                     extent: [country.minx, country.miny, country.maxx, country.maxy],
    //                     operator,
    //                     projection: Projections.WGS_84,
    //                     time: timeStep.time,
    //                 }),
    //             );
    //         }

    //         return concat(...plotRequests).pipe(
    //             map((_plotData, timeIndex) => {
    //                 const plotData = _plotData as any as PlotResult;

    //                 return {
    //                     time: timeIndex,
    //                     time_label: timeSteps[timeIndex].displayValue,
    //                     value: plotData.data.rasters[0].mean,
    //                 };
    //             }),
    //         );
    //     }

    private scrollToBottom(): void {
        setTimeout(() => {
            const div = this.containerDiv.nativeElement;
            div.scrollTop = div.scrollHeight;
        });
    }
}

interface EbvClass {
    name: string;
    ebvNames: Array<string>;
}

// interface EbvClassesResponse {
//     result: true;
//     classes: Array<EbvClass>;
// }

interface EbvDataset {
    id: string;
    name: string;
    authorName: string;
    authorInstitution: string;
    description: string;
    license: string;
    datasetPath: string;
    ebvClass: string;
    ebvName: string;
}

// interface EbvDatasetsResponse {
//     result: true;
//     datasets: Array<EbvDataset>;
// }

// interface EbvDatasetResponse {
//     result: true;
//     dataset: {};
// }

// interface EbvSubgroup {
//     name: string;
//     description: string;
// }

// interface EbvSubgroupsResponse {
//     result: true;
//     subgroups: Array<EbvSubgroup>;
// }

// interface EbvSubgroupValue {
//     name: string;
//     label: string;
//     description: string;
// }

// interface EbvSubgroupValuesResponse {
//     result: true;
//     values: Array<EbvSubgroupValue>;
// }

// interface EbvDataLoadingInfo {
//     result: true;
//     timePoints: Array<number>;
//     deltaUnit: string;
//     crsCode: string;
//     unitRange: [number, number];
// }

// TODO: implement
// interface PlotResult {
//     type: 'LayerStatistics';
//     data: {
//         rasters: Array<{
//             count: number;
//             max: number;
//             mean: number;
//             min: number;
//             nan_count: number;
//         }>;
//     };
// }

interface EbvHierarchy {
    providerId: UUID;
    tree: EbvTree;
}

interface EbvTree {
    fileName: string;
    title: string;
    spatialReference: string;
    groups: Array<EbvTreeSubgroup>;
    entities: Array<EbvTreeEntity>;
    time: TimeIntervalDict;
    timeStep: TimeStepDict;
}

interface EbvTreeSubgroup {
    name: string;
    title: string;
    description: string;
    dataType?: 'U8' | 'U16' | 'U32' | 'U64' | 'I8' | 'I16' | 'I32' | 'I64' | 'F32' | 'F64';
    groups: Array<EbvTreeSubgroup>;
}

interface EbvTreeEntity {
    id: number;
    name: string;
    description: string;
}

interface EbvDatasetId {
    fileName: string;
    groupNames: Array<string>;
    entity: number;
}
