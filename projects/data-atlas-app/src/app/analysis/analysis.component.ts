import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {
    BackendService,
    BBoxDict,
    ProjectService,
    RandomColorService,
    UserService,
    VectorLayer,
    WorkflowDict,
    RasterDataTypes,
    PolygonSymbology,
    RasterLayer,
    HistogramDict,
    HistogramParams,
    ExpressionDict,
    SourceOperatorDict,
    RasterResultDescriptorDict,
    ReprojectionDict,
} from 'wave-core';
import {first, map, mergeMap, tap} from 'rxjs/operators';
import {DataSelectionService} from '../data-selection.service';
import {BehaviorSubject, combineLatest, Observable, of} from 'rxjs';
import {CountryData, COUNTRY_DATA_LIST, COUNTRY_METADATA} from './country-data.model';

@Component({
    selector: 'wave-app-analysis',
    templateUrl: './analysis.component.html',
    styleUrls: ['./analysis.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalysisComponent implements OnInit {
    countries = new Array<string>();

    cannotComputePlot$: Observable<boolean>;
    plotData = new BehaviorSubject<any>(undefined);
    plotLoading = new BehaviorSubject(false);

    private selectedCountryName?: string = undefined;
    private selectedCountry?: CountryData = undefined;

    constructor(
        private readonly projectService: ProjectService,
        private readonly dataSelectionService: DataSelectionService,
        private readonly randomColorService: RandomColorService,
        private readonly backend: BackendService,
        private readonly userService: UserService,
    ) {
        this.cannotComputePlot$ = combineLatest([this.dataSelectionService.rasterLayer, this.dataSelectionService.polygonLayer]).pipe(
            map(([rasterLayer, polygonLayer]) => !rasterLayer || !polygonLayer),
        );

        for (const countryName of Object.keys(COUNTRY_DATA_LIST)) {
            this.countries.push(countryName);
        }
        this.countries.sort();
    }

    ngOnInit(): void {}

    selectCountry(country: string): void {
        this.selectedCountryName = country;
        this.selectedCountry = COUNTRY_DATA_LIST[country];

        const workflow: WorkflowDict = {
            type: 'Vector',
            operator: {
                type: 'OgrSource',
                params: {
                    dataset: this.selectedCountry.polygon,
                },
            },
        };

        this.projectService
            .registerWorkflow(workflow)
            .pipe(
                mergeMap((workflowId) =>
                    this.dataSelectionService.setPolygonLayer(
                        new VectorLayer({
                            workflowId,
                            name: country,
                            symbology: PolygonSymbology.fromPolygonSymbologyDict({
                                type: 'polygon',
                                stroke: {
                                    width: {
                                        type: 'static',
                                        value: 2,
                                    },
                                    color: {
                                        type: 'static',
                                        color: [54, 154, 203, 255],
                                    },
                                },
                                fillColor: {
                                    type: 'static',
                                    color: [54, 154, 203, 0],
                                },
                            }),
                            isLegendVisible: false,
                            isVisible: true,
                        }),
                    ),
                ),
            )
            .subscribe(() => {
                // success
            });
    }

    countryPredicate(filterString: string, element: string): boolean {
        return element.toLowerCase().includes(filterString);
    }

    computePlot(): void {
        if (!this.selectedCountry) {
            return;
        }

        const countryMetadata = COUNTRY_METADATA.filter(([countryName]) => this.selectedCountryName === countryName);
        if (countryMetadata.length !== 1) {
            throw Error(`there is not metadata for country ${this.selectedCountryName}`);
        }
        const [, xmax, ymax, xmin, ymin] = countryMetadata[0];
        const countryBounds: BBoxDict = {
            lowerLeftCoordinate: {
                x: xmin,
                y: ymin,
            },
            upperRightCoordinate: {
                x: xmax,
                y: ymax,
            },
        };

        const countryRasterWorkflow: SourceOperatorDict = {
            type: 'GdalSource',
            params: {
                dataset: this.selectedCountry.raster,
            },
        };

        combineLatest([
            this.dataSelectionService.rasterLayer.pipe(
                mergeMap<RasterLayer | undefined, Observable<WorkflowDict>>((layer) => {
                    if (!layer) {
                        return of(); // no next, just complete
                    }

                    return this.projectService.getWorkflow(layer.workflowId);
                }),
            ),
            this.dataSelectionService.rasterLayer.pipe(
                mergeMap<RasterLayer | undefined, Observable<RasterResultDescriptorDict>>((layer) => {
                    if (!layer) {
                        return of(); // no next, just complete
                    }

                    return this.projectService.getWorkflowMetaData(layer.workflowId) as Observable<RasterResultDescriptorDict>;
                }),
            ),
            this.dataSelectionService.dataRange,
        ])
            .pipe(
                first(),
                tap(() => {
                    this.plotLoading.next(true);
                    this.plotData.next(undefined);
                }),
                mergeMap(([rasterWorkflow, rasterResultDescriptor, dataRange]) =>
                    this.projectService.registerWorkflow({
                        type: 'Plot',
                        operator: {
                            type: 'Histogram',
                            params: {
                                // TODO: get params from selected data
                                buckets: 20,
                                bounds: dataRange,
                            } as HistogramParams,
                            sources: {
                                source: {
                                    type: 'Expression',
                                    params: {
                                        expression: 'if B != 0 { A } else { out_nodata }',
                                        // TODO: get data type from data
                                        outputType: RasterDataTypes.Float64.getCode(),
                                        // TODO: get no data value from data
                                        outputNoDataValue: 'nan',
                                        outputMeasurement: rasterResultDescriptor.measurement,
                                        mapNoData: false,
                                    },
                                    sources: {
                                        a: {
                                            type: 'Reprojection',
                                            params: {
                                                // country rasters are in 4326
                                                targetSpatialReference: 'EPSG:4326',
                                            },
                                            sources: {
                                                source: rasterWorkflow.operator,
                                            },
                                        } as ReprojectionDict,
                                        b: countryRasterWorkflow,
                                    },
                                } as ExpressionDict,
                            },
                        } as HistogramDict,
                    }),
                ),
                mergeMap((workflowId) =>
                    combineLatest([
                        of(workflowId),
                        this.userService.getSessionTokenForRequest(),
                        this.projectService.getTimeOnce(),
                        this.projectService.getSpatialReferenceStream(),
                    ]),
                ),
                mergeMap(([workflowId, sessionToken, time, crs]) =>
                    this.backend.getPlot(
                        workflowId,
                        {
                            time: time.toDict(),
                            bbox: countryBounds,
                            crs: crs.srsString,
                            // TODO: set reasonable size
                            spatialResolution: [0.1, 0.1],
                        },
                        sessionToken,
                    ),
                ),
            )
            .subscribe({
                next: (plotData) => {
                    this.plotData.next(plotData.data);
                    this.plotLoading.next(false);
                },
                complete: () => {
                    // TODO: react on error?
                    this.plotLoading.next(false);
                },
            });
    }
}
