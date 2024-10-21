import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    inject,
    TemplateRef,
    ViewChild,
    ViewContainerRef,
} from '@angular/core';
import {Breakpoints, BreakpointObserver} from '@angular/cdk/layout';
import {map} from 'rxjs/operators';
import {AsyncPipe} from '@angular/common';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatMenuModule} from '@angular/material/menu';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {TemplatePortal} from '@angular/cdk/portal';
import {PortalModule} from '@angular/cdk/portal';
import {BehaviorSubject, firstValueFrom, lastValueFrom, Observable} from 'rxjs';
import {
    AutoCreateDatasetDict,
    BackendService,
    CoreModule,
    DatasetService,
    Extent,
    MapContainerComponent,
    MapService,
    NotificationService,
    ProjectService,
    SpatialReferenceService,
    TimeStepSelectorComponent,
    UploadResponseDict,
    UserService,
    WGS_84,
} from '@geoengine/core';
import {
    ALL_COLORMAPS,
    BLACK,
    Color,
    ColorBreakpoint,
    ColorMapSelectorComponent,
    ContinuousMeasurement,
    extentToBboxDict,
    HistogramDict,
    Layer,
    LinearGradient,
    Measurement,
    PaletteColorizer,
    PolygonSymbology,
    RasterColorizer,
    RasterLayer,
    RasterSymbology,
    SingleBandRasterColorizer,
    SpatialReference,
    Time,
    TRANSPARENT,
    VectorLayer,
    VegaChartData,
    WHITE,
} from '@geoengine/common';
import {utc} from 'moment';
import {DataRange, DataSelectionService} from '../data-selection.service';
import {MatSelectChange} from '@angular/material/select';
import {Workflow} from '@geoengine/openapi-client';
import {createBox} from 'ol/interaction/Draw';
import OlFormatGeoJson from 'ol/format/GeoJSON';
import {HttpResponse} from '@angular/common/http';
import {set} from 'immutable';
import proj4 from 'proj4';
import {transform, transformExtent} from 'ol/proj';
import {LegendComponent} from '../legend/legend.component';

interface Indicator {
    name: string;
    workflow: Workflow;
    symbology: RasterSymbology;
    dataRange: DataRange;
    measurement: 'continuous' | 'classification';
}

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CoreModule,
        PortalModule,
        AsyncPipe,
        MatGridListModule,
        MatMenuModule,
        MatIconModule,
        MatButtonModule,
        MatCardModule,
        LegendComponent,
    ],
})
export class DashboardComponent implements AfterViewInit {
    private breakpointObserver = inject(BreakpointObserver);

    isSelectingBox$ = new BehaviorSubject<boolean>(false);

    indicators: Array<Indicator> = [
        {
            name: 'Land type',
            workflow: {
                type: 'Raster',
                operator: {
                    type: 'GdalSource',
                    params: {
                        data: 'rf_lucas_s2_3m_med_16in_sort_opset09_tile11',
                    },
                },
            },
            symbology: new RasterSymbology(
                1.0,
                new SingleBandRasterColorizer(
                    0,
                    new PaletteColorizer(
                        new Map([
                            [0, Color.fromRgbaLike([0, 0, 0, 1])],
                            [1, Color.fromRgbaLike([0, 17, 255, 1])],
                            [2, Color.fromRgbaLike([0, 163, 255, 1])],
                            [3, Color.fromRgbaLike([64, 255, 182, 1])],
                            [4, Color.fromRgbaLike([182, 255, 64, 1])],
                            [5, Color.fromRgbaLike([255, 184, 0, 1])],
                            [6, Color.fromRgbaLike([255, 50, 0, 1])],
                            [7, Color.fromRgbaLike([128, 0, 0, 1])],
                        ]),
                        TRANSPARENT,
                        TRANSPARENT,
                    ),
                ),
            ),
            dataRange: {min: 0, max: 7},
            measurement: 'classification',
        },
        {
            name: 'Vegetation',
            workflow: {
                type: 'Raster',
                operator: {
                    type: 'TemporalRasterAggregation',
                    params: {
                        aggregation: {
                            type: 'mean',
                            ignoreNoData: true,
                            percentile: null,
                        },
                        window: {
                            granularity: 'years',
                            step: 1,
                        },
                        windowReference: null,
                        outputType: 'F32',
                    },
                    sources: {
                        raster: {
                            type: 'Expression',
                            params: {
                                expression: 'if (C == 3 || (C >= 7 && C <= 11)) { NODATA } else { (A - B) / (A + B) }',
                                outputType: 'F32',
                                outputBand: {
                                    name: 'NDVI',
                                    measurement: {
                                        type: 'continuous',
                                        measurement: 'NDVI',
                                        unit: 'NDVI',
                                    },
                                },
                                mapNoData: false,
                            },
                            sources: {
                                raster: {
                                    type: 'RasterStacker',
                                    params: {
                                        renameBands: {
                                            type: 'default',
                                        },
                                    },
                                    sources: {
                                        rasters: [
                                            {
                                                type: 'GdalSource',
                                                params: {
                                                    data: 'sentinel2_10m_tile_11_band_B08_2022_2023',
                                                },
                                            },
                                            {
                                                type: 'GdalSource',
                                                params: {
                                                    data: 'sentinel2_10m_tile_11_band_B04_2022_2023',
                                                },
                                            },
                                            {
                                                type: 'RasterTypeConversion',
                                                params: {
                                                    outputDataType: 'U16',
                                                },
                                                sources: {
                                                    raster: {
                                                        type: 'GdalSource',
                                                        params: {
                                                            data: 'sentinel2_20m_tile_11_band_SCL_2022_2023',
                                                        },
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
            },
            symbology: new RasterSymbology(
                1.0,
                new SingleBandRasterColorizer(
                    0,
                    new LinearGradient(
                        ColorMapSelectorComponent.createLinearBreakpoints(ALL_COLORMAPS.VIRIDIS, 16, false, {min: -1, max: 1}),
                        // [
                        // (new ColorBreakpoint(-1, WHITE), new ColorBreakpoint(1, Color.fromRgbaLike([0, 255, 0, 1])))
                        // ],
                        TRANSPARENT,
                        TRANSPARENT,
                        TRANSPARENT,
                    ),
                ),
            ),
            dataRange: {min: 0, max: 1},
            measurement: 'continuous',
        },
    ];

    selectedIndicator: Indicator | undefined;
    selectedBBox: Extent | undefined;

    @ViewChild(MapContainerComponent, {static: false}) mapComponent!: MapContainerComponent;
    // @ViewChild(TimeStepSelectorComponent, {static: false}) timeSelectorComponent!: TimeStepSelectorComponent;

    @ViewChild('welcome') welcome!: TemplateRef<unknown>;
    @ViewChild('inspect') inspect!: TemplateRef<unknown>;
    @ViewChild('indicator') indicator!: TemplateRef<unknown>;
    @ViewChild('select') select!: TemplateRef<unknown>;
    @ViewChild('review') review!: TemplateRef<unknown>;

    private _viewContainerRef = inject(ViewContainerRef);

    cards = new BehaviorSubject<Array<{title: string; cols: number; rows: number; content: TemplatePortal}>>([]);
    readonly layersReverse$: Observable<Array<Layer>>;

    timeSteps: Time[] = [
        new Time(utc('2022-01-01')),
        new Time(utc('2023-01-01')),
        // new Time(utc('2024-02-01')),
        // new Time(utc('2024-03-01')),
        // new Time(utc('2024-04-01')),
        // new Time(utc('2024-05-01')),
        // new Time(utc('2024-06-01')),
    ];

    readonly plotData$ = new BehaviorSubject<any>(undefined);
    readonly plotLoading$ = new BehaviorSubject(false);

    constructor(
        readonly userService: UserService,
        readonly projectService: ProjectService,
        readonly dataSelectionService: DataSelectionService,
        readonly notificationService: NotificationService,
        readonly mapService: MapService,
        readonly datasetService: DatasetService,
        readonly changeDetectorRef: ChangeDetectorRef,
        readonly backend: BackendService,
        readonly spatialReferenceService: SpatialReferenceService,
    ) {
        this.layersReverse$ = this.dataSelectionService.layers;
    }

    async ngAfterViewInit(): Promise<void> {
        this.breakpointObserver
            .observe(Breakpoints.Handset)
            .pipe(
                map(({matches}) => {
                    const cards = [
                        {
                            title: 'Welcome',
                            cols: 1,
                            rows: 1,
                            content: new TemplatePortal(this.welcome, this._viewContainerRef),
                        },
                        {
                            title: 'Inspect',
                            cols: 1,
                            rows: 3,
                            content: new TemplatePortal(this.inspect, this._viewContainerRef),
                        },
                        {
                            title: 'Select Indicator',
                            cols: 1,
                            rows: 1,
                            content: new TemplatePortal(this.indicator, this._viewContainerRef),
                        },
                        {
                            title: 'Draw Area and Select Time',
                            cols: 1,
                            rows: 1,
                            content: new TemplatePortal(this.select, this._viewContainerRef),
                        },
                        {
                            title: 'Review Indicator',
                            cols: 2,
                            rows: 2,
                            content: new TemplatePortal(this.review, this._viewContainerRef),
                        },
                    ];

                    if (matches) {
                        for (const card of cards) {
                            card.cols = 2;
                            card.rows = 1;
                        }
                    }

                    return cards;
                }),
            )
            .subscribe(this.cards);
    }

    idFromLayer(index: number, layer: Layer): number {
        return layer.id;
    }

    async changeIndicator(event: MatSelectChange): Promise<void> {
        const indicator = event.value as Indicator;
        this.selectedIndicator = indicator;

        const workflowId = await firstValueFrom(this.projectService.registerWorkflow(indicator.workflow));

        const rasterLayer = new RasterLayer({
            name: 'EBV',
            workflowId,
            isVisible: true,
            isLegendVisible: false,
            symbology: indicator.symbology,
        });

        return await firstValueFrom(this.dataSelectionService.setRasterLayer(rasterLayer, this.timeSteps, indicator.dataRange));
    }

    selectBox(): void {
        this.isSelectingBox$.next(true);
        this.notificationService.info('Select region on the map');

        this.mapComponent.startDrawInteraction('Circle', true, createBox(), async (feature) => {
            const bbox = feature.getGeometry()?.getExtent();
            if (bbox) {
                this.selectedBBox = [bbox[0], bbox[1], bbox[2], bbox[3]];

                const olFeatureWriter = new OlFormatGeoJson();

                const geoJson = olFeatureWriter.writeFeatureObject(feature, {
                    featureProjection: WGS_84.spatialReference.srsString, // TODO
                    dataProjection: WGS_84.spatialReference.srsString,
                });

                const blob = new Blob([JSON.stringify(geoJson)], {type: 'application/json'});
                console.log(JSON.stringify(geoJson));
                console.log(blob);

                const form = new FormData();
                form.append('file', blob, 'draw.json');
                const uploadEvent = await lastValueFrom(this.datasetService.upload(form));
                const uploadDict = uploadEvent as unknown as HttpResponse<UploadResponseDict>;
                const uploadBody = uploadDict.body;
                if (!uploadBody) {
                    throw new Error('Upload failed');
                }

                const uploadId = uploadBody.id;

                const create: AutoCreateDatasetDict = {
                    upload: uploadId,
                    datasetName: await this.generateDatasetName(),
                    datasetDescription: '',
                    mainFile: 'draw.json',
                };

                const dataset = await firstValueFrom(this.datasetService.autoCreateDataset(create));

                const workflowId = await firstValueFrom(
                    this.projectService.registerWorkflow({
                        type: 'Vector',
                        operator: {
                            type: 'OgrSource',
                            params: {
                                data: dataset.datasetName,
                            },
                        },
                    }),
                );

                const observable = this.dataSelectionService.setPolygonLayer(
                    new VectorLayer({
                        workflowId,
                        name: 'drawn area',
                        symbology: PolygonSymbology.fromPolygonSymbologyDict({
                            type: 'polygon',
                            stroke: {
                                width: {
                                    type: 'static',
                                    value: 2,
                                },
                                color: {
                                    type: 'static',
                                    color: [128, 0, 0, 255],
                                },
                            },
                            fillColor: {
                                type: 'static',
                                color: [128, 0, 0, 128],
                            },
                            autoSimplified: true,
                        }),
                        isLegendVisible: false,
                        isVisible: true,
                    }),
                );

                await firstValueFrom(observable);
            }
            this.isSelectingBox$.next(false);

            // this.setEditedExtent();
        });
    }

    private async generateDatasetName(): Promise<string> {
        const sessionId = await firstValueFrom(this.userService.getSessionTokenForRequest());
        const unixTime = Date.now();
        return `${sessionId}_${unixTime}`;
    }

    async analyze(): Promise<void> {
        const indicator = this.selectedIndicator;

        if (!indicator) {
            return;
        }

        if (!this.selectedBBox) {
            this.notificationService.error('Please select a region on the map');
            return;
        }

        let workflow: Workflow;
        if (indicator.measurement === 'classification') {
            workflow = {
                type: 'Plot',
                operator: {
                    type: 'ClassHistogram',
                    params: {
                        columnName: null,
                    },
                    sources: {
                        source: indicator.workflow.operator,
                    },
                },
            };
        } else if (indicator.measurement === 'continuous') {
            workflow = {
                type: 'Plot',
                operator: {
                    type: 'Histogram',
                    params: {
                        attributeName: 'NDVI',
                        bounds: {
                            min: -1.0,
                            max: 1.0,
                        },
                        buckets: {
                            type: 'number',
                            value: 15,
                        },
                        interactive: false,
                    },
                    sources: {
                        source: indicator.workflow.operator,
                    },
                } as HistogramDict,
            };
        } else {
            this.notificationService.error('Invalid measurement for plotting');
            return;
        }

        this.plotLoading$.next(true);

        const workflowId = await firstValueFrom(this.projectService.registerWorkflow(workflow));
        const sessionId = await firstValueFrom(this.userService.getSessionTokenForRequest());

        const time = await this.projectService.getTimeOnce();

        // reproject selectedBbox to EPSG:32632 using proj4

        // TODO: use proj string from spatial reference service
        const projString = '+proj=utm +zone=32 +datum=WGS84 +units=m +no_defs +type=crs';

        const ll = proj4('EPSG:4326', projString, [this.selectedBBox[0], this.selectedBBox[1]]);
        const ur = proj4('EPSG:4326', projString, [this.selectedBBox[2], this.selectedBBox[3]]);
        const extent = [ll[0], ll[1], ur[0], ur[1]];

        console.log(this.selectedBBox, extent);

        const plot = await firstValueFrom(
            this.backend.getPlot(
                workflowId,
                {
                    time: {
                        start: time.start.unix() * 1_000,
                        end: time.end.unix() * 1_000 + 1 /* add one millisecond to include the end time */,
                    },
                    bbox: extentToBboxDict([extent[0], extent[1], extent[2], extent[3]]),
                    // always use WGS 84 for computing the plot
                    crs: 'EPSG:32632',
                    spatialResolution: [10, 10],
                },
                sessionId,
            ),
        );

        console.log(plot);
        this.plotData$.next(plot.data);
        this.plotLoading$.next(false);
    }

    async reset(): Promise<void> {
        this.selectedBBox = undefined;
        await firstValueFrom(this.dataSelectionService.clearPolygonLayer());
        this.changeDetectorRef.markForCheck();
    }
}
