import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {
    Config,
    ProjectService,
    UserService,
    Time,
    RasterLayer,
    RasterSymbology,
    MeanRasterPixelValuesOverTimeDict,
    ExpressionDict,
    RasterDataTypes,
    MapService,
    BackendService,
    extentToBboxDict,
    WGS_84,
    LayoutService,
    RasterSymbologyEditorComponent,
    ProviderLayerIdDict,
    ProviderLayerCollectionIdDict,
    LayerCollectionService,
    NotificationService,
    PlotDataDict,
    RasterResultDescriptorDict,
} from '@geoengine/core';
import {BehaviorSubject, combineLatest, firstValueFrom, from, Observable, of} from 'rxjs';
import {AppConfig} from '../app-config.service';
import {filter, first, map, mergeMap} from 'rxjs/operators';
import {CountryProviderService} from '../country-provider.service';
import {DataSelectionService, DataRange} from '../data-selection.service';
import {ActivatedRoute} from '@angular/router';
import {COUNTRY_DATA_LIST} from '../country-selector/country-data.model';

@Component({
    selector: 'geoengine-ebv-ebv-selector',
    templateUrl: './ebv-selector.component.html',
    styleUrls: ['./ebv-selector.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EbvSelectorComponent implements OnInit, OnDestroy {
    readonly SUBGROUP_SEARCH_THRESHOLD = 5;

    @ViewChild('container', {static: true})
    readonly containerDiv!: ElementRef<HTMLDivElement>;

    readonly isPlotButtonDisabled$: Observable<boolean>;

    rootCollectionId: ProviderLayerCollectionIdDict = {
        providerId: '77d0bf11-986e-43f5-b11d-898321f1854c',
        collectionId: 'classes',
    };

    preselectedPath: Array<string | number> = [];

    layerId?: ProviderLayerIdDict;
    layer?: RasterLayer;
    time?: Time;

    readonly plotData = new BehaviorSubject<any>(undefined);
    readonly plotLoading = new BehaviorSubject(false);

    private autoShowEbv = false;

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
        private readonly layoutService: LayoutService,
        private readonly layerCollectionService: LayerCollectionService,
        private readonly notificationService: NotificationService,
    ) {
        this.isPlotButtonDisabled$ = this.countryProviderService.getSelectedCountryStream().pipe(map((country) => !country));
    }

    ngOnInit(): void {
        this.handleQueryParams();
    }

    ngOnDestroy(): void {}

    editSymbology(): void {
        this.layoutService.setSidenavContentComponent({
            component: RasterSymbologyEditorComponent,
            keepParent: false,
            config: {
                layer: this.layer,
            },
        });
    }

    layerSelected(id?: ProviderLayerIdDict): void {
        this.layerId = id;

        if (this.autoShowEbv) {
            this.autoShowEbv = false;
            this.showEbv();
        }
    }

    showEbv(): void {
        if (!this.layerId) {
            return;
        }

        this.layerCollectionService
            .getLayer(this.layerId.providerId, this.layerId.layerId)
            .pipe(
                mergeMap((layer) => combineLatest([of(layer), this.projectService.registerWorkflow(layer.workflow)])),
                mergeMap(([layer, workflowId]) => {
                    if (!layer.symbology) {
                        throw new Error('Layer has no symbology');
                    }

                    if (!('timeSteps' in layer.metadata)) {
                        throw new Error('Layer has no timeSteps');
                    }

                    if (!('dataRange' in layer.metadata)) {
                        throw new Error('Layer has no dataRange');
                    }

                    const timeSteps: Array<Time> = JSON.parse(layer.metadata['timeSteps']).map((t: number) => new Time(t));
                    this.time = new Time(timeSteps[0].start, timeSteps[timeSteps.length - 1].end);

                    const range: [number, number] = JSON.parse(layer.metadata['dataRange']);
                    const dataRange: DataRange = {
                        min: range[0],
                        max: range[1],
                    };

                    const rasterLayer = new RasterLayer({
                        name: 'EBV',
                        workflowId,
                        isVisible: true,
                        isLegendVisible: false,
                        symbology: RasterSymbology.fromDict(layer.symbology) as RasterSymbology,
                    });

                    this.layer = rasterLayer;

                    return combineLatest([
                        this.dataSelectionService.setRasterLayer(rasterLayer, timeSteps, dataRange),
                        this.dataSelectionService.clearPolygonLayer(),
                    ]);
                }),
            )
            .subscribe(() => this.changeDetectorRef.markForCheck());
    }

    plot(): void {
        from(this.computePlot()).subscribe({
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

    protected async computePlot(): Promise<PlotDataDict> {
        const rasterLayer = await firstValueFrom(this.dataSelectionService.rasterLayer);
        const selectedCountry = await firstValueFrom(this.countryProviderService.getSelectedCountryStream());
        const selectedTime = this.time;

        if (!rasterLayer || !selectedCountry || !selectedTime) {
            throw Error('No raster layer or country or time selected');
        }

        this.plotLoading.next(true);
        this.plotData.next(undefined);

        const rasterLayerMetadata = await firstValueFrom(this.projectService.getRasterLayerMetadata(rasterLayer));

        const sessionToken = await firstValueFrom(this.userService.getSessionTokenForRequest());

        const rasterWorkflow = await firstValueFrom(this.projectService.getWorkflow(rasterLayer.workflowId));

        // TODO: use native CRS from raster layer for plot -> determine resolution in this CRS
        const projectedRasterWorkflow = this.projectService.createProjectedOperator(
            rasterWorkflow.operator,
            rasterLayerMetadata,
            // always use WGS 84 for computing the plot
            WGS_84.spatialReference,
        );

        const projectedRasterWorkflowMetadata$ = this.projectService
            .registerWorkflow({
                type: 'Raster',
                operator: projectedRasterWorkflow,
            })
            .pipe(
                mergeMap(
                    (projectedRasterWorkflowId) =>
                        this.backend.getWorkflowMetadata(projectedRasterWorkflowId, sessionToken) as Observable<RasterResultDescriptorDict>,
                ),
            );

        const plotWorkflowId$ = this.projectService.registerWorkflow({
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
                            expression: 'if B IS NODATA { NODATA } else { A }',
                            outputType: RasterDataTypes.Float64.getCode(),
                            mapNoData: false,
                        },
                        sources: {
                            a: projectedRasterWorkflow,
                            b: {
                                type: 'GdalSource',
                                params: {
                                    data: {
                                        type: 'internal',
                                        //  use WGS 84 for computing the plot
                                        datasetId: COUNTRY_DATA_LIST[selectedCountry.name].raster,
                                    },
                                },
                            },
                        },
                    } as ExpressionDict,
                },
            } as MeanRasterPixelValuesOverTimeDict,
        });

        const [projectedRasterWorkflowMetadata, plotWorkflowId] = await firstValueFrom(
            combineLatest([projectedRasterWorkflowMetadata$, plotWorkflowId$]),
        );

        let spatialResolution: [number, number] = [0.1, 0.1];
        if (
            projectedRasterWorkflowMetadata.resolution &&
            projectedRasterWorkflowMetadata.resolution.x > 0.1 &&
            projectedRasterWorkflowMetadata.resolution.y > 0.1
        ) {
            // TODO: communicate upper limit or think about long-running plot requests
            spatialResolution = [projectedRasterWorkflowMetadata.resolution.x, projectedRasterWorkflowMetadata.resolution.y];
        }

        return firstValueFrom(
            this.backend.getPlot(
                plotWorkflowId,
                {
                    time: {
                        start: selectedTime.start.unix() * 1_000,
                        end: selectedTime.end.unix() * 1_000 + 1 /* add one millisecond to include the end time */,
                    },
                    bbox: extentToBboxDict([selectedCountry.minx, selectedCountry.miny, selectedCountry.maxx, selectedCountry.maxy]),
                    // always use WGS 84 for computing the plot
                    crs: WGS_84.spatialReference.srsString,
                    spatialResolution,
                },
                sessionToken,
            ),
        );
    }

    private handleQueryParams(): void {
        this.route.queryParams
            .pipe(
                filter((params) => params.id),
                first(),
                mergeMap((params) => this.http.get<EbvDatasetResponse>(`https://portal.geobon.org/api/v1/datasets/${params.id}`)),
            )
            .subscribe((response) => {
                if (response.code !== 200) {
                    this.notificationService.error('Could not load dataset');
                }

                const dataset = response.data[0];
                this.preselectedPath = [
                    dataset.ebv.ebv_class,
                    dataset.ebv.ebv_name,
                    dataset.title,
                    0 /*default scenario/metric*/,
                    0 /*default metric/entity*/,
                    0 /*default entity*/,
                ];
                this.autoShowEbv = true;
                this.changeDetectorRef.markForCheck();
            });
    }
}

interface EbvDatasetResponse {
    code: number;
    data: [
        {
            title: string;
            ebv: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                ebv_class: string;
                // eslint-disable-next-line @typescript-eslint/naming-convention
                ebv_name: string;
            };
        },
    ];
}
