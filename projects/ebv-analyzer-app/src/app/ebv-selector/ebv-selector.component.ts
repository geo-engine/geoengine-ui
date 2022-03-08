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
    MeanRasterPixelValuesOverTimeDict,
    ExpressionDict,
    RasterDataTypes,
    MapService,
    BackendService,
    BBoxDict,
} from 'wave-core';
import {BehaviorSubject, combineLatest, Observable, of} from 'rxjs';
import {AppConfig} from '../app-config.service';
import {filter, first, map, mergeMap, tap, zipWith} from 'rxjs/operators';
import {Country, CountryProviderService} from '../country-provider.service';
import {DataSelectionService} from '../data-selection.service';
import {ActivatedRoute} from '@angular/router';
import moment from 'moment';
import {COUNTRY_DATA_LIST} from '../country-selector/country-data.model';

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

    readonly plotData = new BehaviorSubject<any>(undefined);
    readonly plotLoading = new BehaviorSubject(false);

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
        private readonly mapService: MapService,
        private readonly backend: BackendService,
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

        this.generateGdalSourceNetCdfLayer().subscribe((ebvLayer) => {
            this.ebvLayer = ebvLayer;

            const dataRange = guessDataRange(ebvLayer.symbology.colorizer);

            combineLatest([
                this.dataSelectionService.setRasterLayer(this.ebvLayer, timeSteps, dataRange),
                this.dataSelectionService.clearPolygonLayer(),
            ]).subscribe();
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

    plot(): void {
        combineLatest([
            this.dataSelectionService.rasterLayer.pipe(
                mergeMap<RasterLayer | undefined, Observable<RasterLayer>>((layer) => (layer ? of(layer) : of())),
                mergeMap((rasterLayer) => this.projectService.getWorkflow(rasterLayer.workflowId)),
            ),
            this.countryProviderService
                .getSelectedCountryStream()
                .pipe(mergeMap<Country | undefined, Observable<Country>>((country) => (country ? of(country) : of()))),
        ])
            .pipe(
                first(),
                tap(() => {
                    this.plotLoading.next(true);
                    this.plotData.next(undefined);
                }),
                mergeMap(([rasterWorkflow, selectedCountry]) =>
                    this.projectService.registerWorkflow({
                        type: 'Plot',
                        operator: {
                            type: 'MeanRasterPixelValuesOverTime',
                            params: {
                                timePosition: 'start',
                                area: false,
                            },
                            sources: {
                                raster: {
                                    type: 'Expression',
                                    params: {
                                        expression: 'if B IS NODATA { out_nodata } else { A }',
                                        outputType: RasterDataTypes.Float64.getCode(),
                                        outputNoDataValue: 'nan',
                                        mapNoData: false,
                                    },
                                    sources: {
                                        a: rasterWorkflow.operator,
                                        b: {
                                            type: 'GdalSource',
                                            params: {
                                                dataset: COUNTRY_DATA_LIST[selectedCountry.name].raster,
                                            },
                                        },
                                    },
                                } as ExpressionDict,
                            },
                        } as MeanRasterPixelValuesOverTimeDict,
                    }),
                ),
                mergeMap((workflowId) =>
                    combineLatest([
                        of(workflowId),
                        this.userService.getSessionTokenForRequest(),
                        this.projectService.getSpatialReferenceStream(),
                        this.mapService.getViewportSizeStream(),
                    ]),
                ),
                mergeMap(([workflowId, sessionToken, crs, viewport]) =>
                    this.backend.getPlot(
                        workflowId,
                        {
                            time: {
                                start: (this.ebvTree as EbvHierarchy).tree.time.start,
                                end: (this.ebvTree as EbvHierarchy).tree.time.end,
                            },
                            bbox: extentToBboxDict(viewport.extent),
                            crs: crs.srsString,
                            // TODO: set reasonable size
                            spatialResolution: [0.1, 0.1],
                        },
                        sessionToken,
                    ),
                ),
                first(),
            )
            .subscribe({
                next: (plotData) => {
                    this.plotData.next(plotData.data);
                    this.plotLoading.next(false);
                },
                error: () => {
                    // TODO: react on error?
                    this.plotLoading.next(false);
                },
            });
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

// TODO: use method from core
const extentToBboxDict = ([minx, miny, maxx, maxy]: [number, number, number, number]): BBoxDict => ({
    lowerLeftCoordinate: {
        x: minx,
        y: miny,
    },
    upperRightCoordinate: {
        x: maxx,
        y: maxy,
    },
});
