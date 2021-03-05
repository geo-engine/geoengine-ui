import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {
    BackendService,
    BBoxDict,
    OperatorParams,
    ProjectService,
    RandomColorService,
    UserService,
    VectorLayer,
    VectorSymbology,
    WorkflowDict,
    RasterDataTypes,
} from 'wave-core';
import {first, map, mergeMap, tap} from 'rxjs/operators';
import {DataSelectionService} from '../data-selection.service';
import {BehaviorSubject, combineLatest, Observable, of} from 'rxjs';
import {Country, COUNTRY_LIST, COUNTRY_METADATA} from './country-data.model';

interface HistogramParams extends OperatorParams {
    column_name?: string;
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

    private selectedCountryName: string = undefined;
    private selectedCountry: Country = undefined;

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

    selectCountry(country: string) {
        this.selectedCountryName = country;
        this.selectedCountry = COUNTRY_LIST[country];

        const workflow: WorkflowDict = {
            type: 'Vector',
            operator: {
                type: 'OgrSource',
                params: {
                    data_set: this.selectedCountry.polygon,
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
                            symbology: VectorSymbology.createSymbology({
                                fillRGBA: this.randomColorService.getRandomColorRgba(),
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

    computePlot() {
        const countryMetadata = COUNTRY_METADATA.filter(([countryName]) => this.selectedCountryName === countryName);
        if (countryMetadata.length !== 1) {
            throw Error(`there is not metadata for country ${this.selectedCountryName}`);
        }
        const [, xmax, ymax, xmin, ymin] = countryMetadata[0];
        const countryBounds: BBoxDict = {
            lower_left_coordinate: {
                x: xmin,
                y: ymin,
            },
            upper_right_coordinate: {
                x: xmax,
                y: ymax,
            },
        };

        combineLatest([
            this.dataSelectionService.rasterLayer,
            this.projectService.registerWorkflow({
                type: 'Raster',
                operator: {
                    type: 'GdalSource',
                    params: {
                        data_set: this.selectedCountry.raster,
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
                                expression: 'B != 0 ? A : NAN',
                                // TODO: get data type from data
                                output_type: RasterDataTypes.Byte.getCode(),
                                // TODO: get no data value from data
                                output_no_data_value: RasterDataTypes.Byte.noData(0),
                            },
                            raster_sources: [rasterWorkflow.operator, polygonWorkflow.operator],
                            vector_sources: [],
                        },
                    }),
                ),
                mergeMap((expressionWorkflowId) => this.projectService.getWorkflow(expressionWorkflowId)),
                mergeMap((rasterWorkflow) =>
                    this.projectService.registerWorkflow({
                        type: 'Plot',
                        operator: {
                            type: 'Histogram',
                            params: {
                                // TODO: get params from selected data
                                buckets: 20,
                                bounds: {
                                    min: 1,
                                    max: 20,
                                },
                            } as HistogramParams,
                            raster_sources: [rasterWorkflow.operator],
                            vector_sources: [],
                        },
                    }),
                ),
                mergeMap((workflowId) => combineLatest([of(workflowId), this.userService.getSessionTokenForRequest()])),
                mergeMap(([workflowId, sessionToken]) =>
                    this.backend.getPlot(
                        workflowId,
                        {
                            // TODO: get from selector
                            time: {start: 0, end: 0},
                            bbox: countryBounds,
                            // TODO: set reasonable size
                            spatial_resolution: [0.1, 0.1],
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
