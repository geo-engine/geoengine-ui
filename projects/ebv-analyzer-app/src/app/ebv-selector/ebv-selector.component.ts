import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {
    Config,
    ProjectService,
    UserService,
    UUID,
    TimeIntervalDict,
    TimeStepDict,
    Time,
    RasterLayer,
    RasterSymbology,
    WorkflowDict,
    ExternalDatasetIdDict,
    timeStepDictTotimeStepDuration,
    Colorizer,
    ColorizerDict,
} from 'wave-core';
import {BehaviorSubject, Observable} from 'rxjs';
import {AppConfig} from '../app-config.service';
import {filter, map, mergeMap, zipWith} from 'rxjs/operators';
import {CountryProviderService} from '../country-provider.service';
import {DataSelectionService} from '../data-selection.service';
import {ActivatedRoute} from '@angular/router';
import moment from 'moment';

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
    categoryLabels: Array<string> = this.createCategoryLabels();

    ebvPath: Array<EbvTreeSubgroup> = [];

    ebvEntity?: EbvTreeEntity;

    // ebvLayer?: RasterLayer;
    // TODO: implement
    // plotSettings?: {
    //     data$: Observable<DataPoint>;
    //     xLimits: [number, number];
    //     yLimits: [number, number];
    //     yLabel: string;
    // } = undefined;

    private ebvDatasetId?: EbvDatasetId = undefined;
    private ebvLayer?: RasterLayer;

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

    setEbvDataset(ebvDataset: EbvDataset, callback?: () => void): void {
        if (this.ebvDataset === ebvDataset) {
            return;
        }
        this.ebvDataset = ebvDataset;

        this.clearAfter('ebvDataset');

        const datasetId = this.ebvDataset.id;

        this.request<EbvHierarchy>(`ebv/dataset/${datasetId}/subdatasets`, undefined, (data) => {
            this.ebvTree = data;
            this.categoryLabels = this.createCategoryLabels();

            if (callback) {
                callback();
            }
        });
    }

    setEbvEntity(ebvEntity: EbvTreeEntity): void {
        if (!this.ebvTree) {
            return;
        }

        this.ebvEntity = ebvEntity;

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
        if (!this.ebvDatasetId || !this.ebvTree) {
            return;
        }

        const timeSteps: Array<Time> = [];

        const timeStep = timeStepDictTotimeStepDuration(this.ebvTree.tree.timeStep);

        let time = new Time(moment.unix(this.ebvTree.tree.time.start / 1_000).utc());
        const timeEnd = new Time(moment.unix(this.ebvTree.tree.time.end / 1_000).utc());

        while (time < timeEnd) {
            timeSteps.push(time);
            time = time.addDuration(timeStep);
        }

        if (timeSteps.length === 0) {
            // only one time step
            timeSteps.push(time);
        }

        this.projectService.clearLayers();

        this.generateGdalSourceNetCdfLayer()
            .pipe(
                mergeMap((ebvLayer) => {
                    this.ebvLayer = ebvLayer;

                    const dataRange = guessDataRange(ebvLayer.symbology.colorizer);

                    return this.dataSelectionService.setRasterLayer(this.ebvLayer, timeSteps, dataRange);
                }),
            )
            .subscribe(() => {
                this.countryProviderService.replaceVectorLayerOnMap();
            });
    }

    ebvClassPredicate(filterString: string, element: EbvClass): boolean {
        return element.name.toLowerCase().includes(filterString);
    }

    ebvNamePredicate(filterString: string, element: string): boolean {
        return element.toLowerCase().includes(filterString);
    }

    ebvDatasetPredicate(filterString: string, element: EbvDataset): boolean {
        return element.name.toLowerCase().includes(filterString);
    }

    ebvSubgroupPredicate(filterString: string, element: EbvTreeSubgroup): boolean {
        return element.title.toLowerCase().includes(filterString);
    }

    ebvEntityPredicate(filterString: string, element: EbvTreeEntity): boolean {
        return element.name.toLowerCase().includes(filterString);
    }

    private createCategoryLabels(): Array<string> {
        if (!this.ebvTree || this.ebvTree.tree.groups.length === 0) {
            return [];
        }

        let hierarchyDepth = 1;
        let group = this.ebvTree.tree.groups[0];

        while (group.groups.length > 0) {
            hierarchyDepth++;
            group = group.groups[0];
        }

        if (hierarchyDepth === 1) {
            return ['Metric'];
        }

        const labels = ['Scenario', 'Metric'];

        for (let i = 2; i < hierarchyDepth; i++) {
            labels.push('');
        }

        return labels;
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

                if (!ebvClass) {
                    return;
                }

                this.ebvClass = ebvClass;
                this.ebvNames = ebvClass.ebvNames;

                this.ebvName = dataset.ebvName;

                this.request<Array<EbvDataset>>(`ebv/datasets/${encodeURIComponent(dataset.ebvName)}`, undefined, (data) => {
                    this.ebvDatasets = data;

                    const selected = data.find((d) => d.id === dataset.id);

                    if (selected) {
                        this.setEbvDataset(selected, this.selectDefaultGroupEntity.bind(this));
                        this.changeDetectorRef.markForCheck();
                    }
                });
            });
    }

    private selectDefaultGroupEntity(): void {
        if (!this.ebvTree) {
            return;
        }

        let groups = this.ebvTree.tree.groups;
        let index = 0;

        while (groups.length > 0) {
            this.setEbvPath(groups[0], index++);
            groups = groups[0].groups;
        }

        const entity = this.ebvTree.tree.entities[0];
        this.setEbvEntity(entity);

        this.showEbv();
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
    private generateGdalSourceNetCdfLayer(): Observable<RasterLayer> {
        if (!this.ebvDataset || !this.ebvTree || !this.ebvDatasetId) {
            throw Error('Missing dataset and loading info');
        }

        const workflow: WorkflowDict = {
            type: 'Raster',
            operator: {
                type: 'GdalSource',
                params: {
                    dataset: {
                        type: 'external',
                        providerId: '1690c483-b17f-4d98-95c8-00a64849cd0b',
                        datasetId: JSON.stringify(this.ebvDatasetId),
                    } as ExternalDatasetIdDict,
                },
            },
        };

        const colorizer = Colorizer.fromDict(this.ebvTree.tree.colorizer);

        return this.projectService.registerWorkflow(workflow).pipe(
            map((workflowId) => {
                const rasterLayer = new RasterLayer({
                    name: 'EBV',
                    workflowId,
                    isVisible: true,
                    isLegendVisible: false,
                    symbology: new RasterSymbology(1.0, colorizer),
                });

                return rasterLayer;
            }),
        );
    }

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

                this.changeDetectorRef.markForCheck();
                this.loading$.next(false);
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
}

interface EbvClass {
    name: string;
    ebvNames: Array<string>;
}

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
    colorizer: ColorizerDict;
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

function guessDataRange(colorizer: Colorizer): {min: number; max: number} {
    let min = Number.MAX_VALUE;
    let max = -Number.MAX_VALUE;

    for (const breakpoint of colorizer.getBreakpoints()) {
        min = Math.min(min, breakpoint.value);
        max = Math.max(max, breakpoint.value);
    }

    return {min, max};
}
