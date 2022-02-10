import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {
    BackendService,
    BBoxDict,
    OperatorParams,
    ProjectService,
    RandomColorService,
    UserService,
    VectorLayer,
    WorkflowDict,
    RasterDataTypes,
    PolygonSymbology,
    RasterLayer,
    HistogramDict,
    ExpressionDict,
} from 'wave-core';
import {first, map, mergeMap, tap} from 'rxjs/operators';
import {DataSelectionService} from '../data-selection.service';
import {BehaviorSubject, combineLatest, Observable, of} from 'rxjs';
import {Country, COUNTRY_LIST, COUNTRY_METADATA} from './country-data.model';

interface HistogramParams extends OperatorParams {
    columnName?: string;
    bounds:
        | {
              min: number;
              max: number;
          }
        | 'data';
    buckets?: number;
    interactive?: boolean;
}

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
    private selectedCountry?: Country = undefined;

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

        for (const countryName of Object.keys(COUNTRY_LIST)) {
            this.countries.push(countryName);
        }
        this.countries.sort();
    }

    ngOnInit(): void {}

    selectCountry(country: string): void {
        this.selectedCountryName = country;
        this.selectedCountry = COUNTRY_LIST[country];

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
                                        value: 1,
                                    },
                                    color: {
                                        type: 'static',
                                        color: [0, 0, 0, 255],
                                    },
                                },
                                fillColor: {
                                    type: 'static',
                                    color: [0, 0, 128, 150],
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

        combineLatest([
            this.dataSelectionService.rasterLayer.pipe(
                mergeMap<RasterLayer | undefined, Observable<RasterLayer>>((layer) => (layer ? of(layer) : of())),
            ),
            this.projectService.registerWorkflow({
                type: 'Raster',
                operator: {
                    type: 'GdalSource',
                    params: {
                        dataset: this.selectedCountry.raster,
                    },
                },
            }),
        ])
            .pipe(
                first(),
                tap(() => {
                    this.plotLoading.next(true);
                    this.plotData.next(undefined);
                }),
                mergeMap(([rasterLayer, polygonWorkflowId]) =>
                    combineLatest([
                        this.projectService.getWorkflow(rasterLayer.workflowId),
                        this.projectService.getWorkflow(polygonWorkflowId),
                    ]),
                ),
                mergeMap(([rasterWorkflow, polygonWorkflow]) =>
                    this.projectService.registerWorkflow({
                        type: 'Raster',
                        operator: {
                            type: 'Expression',
                            params: {
                                expression: 'if B != 0 { A } else { out_nodata }',
                                // TODO: get data type from data
                                outputType: RasterDataTypes.Float64.getCode(),
                                // TODO: get no data value from data
                                outputNoDataValue: 'nan',
                                mapNoData: false,
                            },
                            sources: {
                                a: rasterWorkflow.operator,
                                b: polygonWorkflow.operator,
                            },
                        } as ExpressionDict,
                    }),
                ),
                mergeMap((expressionWorkflowId) =>
                    combineLatest([this.projectService.getWorkflow(expressionWorkflowId), this.dataSelectionService.dataRange]),
                ),
                mergeMap(([rasterWorkflow, dataRange]) =>
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
                                source: rasterWorkflow.operator,
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
            .subscribe(
                (plotData) => {
                    this.plotData.next(plotData.data);
                    this.plotLoading.next(false);
                },
                () => {
                    // TODO: react on error?
                    this.plotLoading.next(false);
                },
            );
    }
}
