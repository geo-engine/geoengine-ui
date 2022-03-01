import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {
    BackendService,
    BBoxDict,
    ClusteredPointSymbology,
    Dataset,
    DatasetService,
    HistogramDict,
    HistogramParams,
    Layer,
    MapService,
    PointSymbology,
    ProjectService,
    RasterLayer,
    RasterSymbology,
    RasterVectorJoinDict,
    Time,
    UserService,
    UUID,
    VectorLayer,
    WorkflowDict,
    TimeProjectionDict,
    OgrSourceDict,
} from 'wave-core';
import {BehaviorSubject, combineLatest, combineLatestWith, first, mergeMap, Observable, of, Subscription, tap} from 'rxjs';
import {DataSelectionService} from '../data-selection.service';
import moment from 'moment';

interface EnvironmentLayer {
    id: UUID;
    name: string;
    dataRange: [number, number];
}

const START_YEAR = 2000;
const END_YEAR = 2020;
const SPECIES = [
    'Aeshna affinis',
    'Aeshna caerulea',
    'Aeshna cyanea',
    'Aeshna grandis',
    'Aeshna isoceles',
    'Aeshna juncea',
    'Aeshna mixta',
    'Aeshna subarctica',
    'Aeshna viridis',
    'Anax ephippiger',
    'Anax imperator',
    'Anax parthenope',
    'Boyeria irene',
    'Brachytron pratense',
    'Calopteryx splendens',
    'Calopteryx virgo',
    'Ceriagrion tenellum',
    'Chalcolestes viridis',
    'Coenagrion armatum',
    'Coenagrion hastulatum',
    'Coenagrion lunulatum',
    'Coenagrion mercuriale',
    'Coenagrion ornatum',
    'Coenagrion puella',
    'Coenagrion pulchellum',
    'Coenagrion scitulum',
    'Cordulegaster bidentata',
    'Cordulegaster boltonii',
    'Cordulia aenea',
    'Crocothemis erythraea',
    'Enallagma cyathigerum',
    'Epitheca bimaculata',
    'Erythromma lindenii',
    'Erythromma najas',
    'Erythromma viridulum',
    'Gomphus flavipes',
    'Gomphus pulchellus',
    'Gomphus simillimus',
    'Gomphus vulgatissimus',
    'Ischnura elegans',
    'Ischnura pumilio',
    'Lestes barbarus',
    'Lestes dryas',
    'Lestes sponsa',
    'Lestes virens',
    'Leucorrhinia albifrons',
    'Leucorrhinia caudalis',
    'Leucorrhinia dubia',
    'Leucorrhinia pectoralis',
    'Leucorrhinia rubicunda',
    'Libellula depressa',
    'Libellula fulva',
    'Libellula quadrimaculata',
    'Nehalennia speciosa',
    'Onychogomphus forcipatus',
    'Onychogomphus uncatus',
    'Ophiogomphus cecilia',
    'Orthetrum albistylum',
    'Orthetrum brunneum',
    'Orthetrum cancellatum',
    'Orthetrum coerulescens',
    'Oxygastra curtisii',
    'Platycnemis pennipes',
    'Pyrrhosoma nymphula',
    'Somatochlora alpestris',
    'Somatochlora arctica',
    'Somatochlora flavomaculata',
    'Somatochlora metallica',
    'Sympecma fusca',
    'Sympecma paedisca',
    'Sympetrum danae',
    'Sympetrum depressiusculum',
    'Sympetrum flaveolum',
    'Sympetrum fonscolombii',
    'Sympetrum meridionale',
    'Sympetrum pedemontanum',
    'Sympetrum sanguineum',
    'Sympetrum striolatum',
    'Sympetrum vulgatum',
];

@Component({
    selector: 'wave-species-selector',
    templateUrl: './species-selector.component.html',
    styleUrls: ['./species-selector.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpeciesSelectorComponent implements OnInit, OnDestroy {
    readonly species: string[] = SPECIES;

    readonly environmentLayers: EnvironmentLayer[] = [
        {
            id: '36574dc3-560a-4b09-9d22-d5945f2b8111',
            name: 'NDVI',
            dataRange: [-2000, 10000],
        },
        {
            id: '36574dc3-560a-4b09-9d22-d5945f2b8666',
            name: 'Water Bodies 333m',
            dataRange: [70, 71],
        },
        {
            id: '6c9270ad-e87c-404b-aa1f-4bfb8a1b3cd7',
            name: 'ECMWF ERA 5 land 2m temperature',
            dataRange: [0, 360],
        },
        {
            id: 'fedad2aa-00db-44b5-be38-e8637932aa0a',
            name: 'ECMWF ERA 5 land Total precipitation',
            dataRange: [0, 1],
        },
        {
            id: '36574dc3-560a-4b09-9d22-d5945ffb8093',
            name: 'Landcover classification map of Germany 2020 based on Sentinel-2 data 2019 & 2020',
            dataRange: [0, 60],
        },
    ];

    plotSpecies = '';
    plotEnvironmentLayer = '';
    readonly plotData = new BehaviorSubject<any>(undefined);
    readonly plotLoading = new BehaviorSubject(false);

    currentMonth = 1;

    selectedSpecies?: string = undefined;
    selectedEnvironmentLayer?: EnvironmentLayer = undefined;
    selectedEnvironmentCitation = new BehaviorSubject<string>('');

    speciesLayer?: Layer = undefined;
    environmentLayer?: Layer = undefined;

    private datasetId: UUID = 'd9dd4530-7a57-44da-a650-ce7d81dcc216';

    private selectedEnvironmentDataset?: Dataset = undefined;

    private subscriptions: Array<Subscription> = [];

    constructor(
        public readonly dataSelectionService: DataSelectionService,
        private readonly projectService: ProjectService,
        private readonly datasetService: DatasetService,
        private readonly userService: UserService,
        private readonly backend: BackendService,
        private readonly mapService: MapService,
        private readonly changeDetectorRef: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        const speciesLayerSubscription = this.dataSelectionService.speciesLayer.subscribe((speciesLayer) => {
            this.speciesLayer = speciesLayer;
            this.changeDetectorRef.markForCheck();
        });
        this.subscriptions.push(speciesLayerSubscription);

        const environmentLayerSubscription = this.dataSelectionService.rasterLayer.subscribe((environmentLayer) => {
            this.environmentLayer = environmentLayer;
            this.changeDetectorRef.markForCheck();
        });
        this.subscriptions.push(environmentLayerSubscription);

        this.dataSelectionService.setTimeSteps([...generateYearlyTimeSteps(START_YEAR, END_YEAR, this.currentMonth)]);
    }

    ngOnDestroy(): void {
        for (const sub of this.subscriptions) {
            sub.unsubscribe();
        }
    }

    speciesPredicate(filter: string, element: string): boolean {
        return element.toLowerCase().includes(filter);
    }

    selectSpecies(species: string): void {
        this.selectedSpecies = species;

        const workflow: WorkflowDict = {
            type: 'Vector',
            operator: {
                type: 'TimeProjection',
                params: {
                    step: {
                        granularity: 'Years',
                        step: 1,
                    },
                },
                sources: {
                    vector: {
                        type: 'OgrSource',
                        params: {
                            dataset: {
                                type: 'internal',
                                datasetId: this.datasetId,
                            },
                            attributeProjection: [],
                            attributeFilters: [
                                {
                                    attribute: 'Species',
                                    ranges: [[species, species]],
                                    keepNulls: false,
                                },
                            ],
                        },
                    } as OgrSourceDict,
                },
            } as TimeProjectionDict,
        };

        this.projectService
            .registerWorkflow(workflow)
            .pipe(
                mergeMap((workflowId) =>
                    this.dataSelectionService.setSpeciesLayer(
                        new VectorLayer({
                            workflowId,
                            name: 'Beobachtungen',
                            symbology: ClusteredPointSymbology.fromPointSymbologyDict({
                                type: 'point',
                                radius: {
                                    type: 'static',
                                    value: PointSymbology.DEFAULT_POINT_RADIUS,
                                },
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
                                    color: [189, 42, 11, 255],
                                },
                            }),
                            isLegendVisible: false,
                            isVisible: true,
                        }),
                    ),
                ),
            )
            .subscribe();
    }

    selectEnvironmentLayer(layer: EnvironmentLayer): void {
        this.selectedEnvironmentLayer = layer;

        const workflow: WorkflowDict = {
            type: 'Raster',
            operator: {
                type: 'GdalSource',
                params: {
                    dataset: {
                        type: 'internal',
                        datasetId: layer.id,
                    },
                },
            },
        };

        this.selectedEnvironmentCitation.next('');

        this.projectService
            .registerWorkflow(workflow)
            .pipe(
                combineLatestWith(this.datasetService.getDataset({type: 'internal', datasetId: layer.id})),
                tap(([workflowId, _dataset]) => {
                    this.userService
                        .getSessionTokenForRequest()
                        .pipe(mergeMap((token) => this.backend.getWorkflowProvenance(workflowId, token)))
                        .subscribe((provenance) => {
                            this.selectedEnvironmentCitation.next(provenance.map((p) => p.provenance.citation).join(','));
                        });
                }),
                mergeMap(([workflowId, dataset]) => {
                    this.selectedEnvironmentDataset = dataset;
                    if (!!dataset.symbology && dataset.symbology instanceof RasterSymbology) {
                        return this.dataSelectionService.setRasterLayer(
                            new RasterLayer({
                                workflowId,
                                name: layer.name,
                                symbology: dataset.symbology,
                                isLegendVisible: false,
                                isVisible: true,
                            }),
                            {
                                min: layer.dataRange[0],
                                max: layer.dataRange[1],
                            },
                        );
                    }

                    return of(undefined);
                }),
            )
            .subscribe();
    }

    computePlot(): void {
        if (!this.selectedSpecies || !this.selectedEnvironmentLayer || !this.selectedEnvironmentDataset) {
            return;
        }

        combineLatest([
            this.dataSelectionService.rasterLayer.pipe(
                mergeMap<RasterLayer | undefined, Observable<RasterLayer>>((layer) => (layer ? of(layer) : of())),
            ),
            this.dataSelectionService.speciesLayer.pipe(
                mergeMap<VectorLayer | undefined, Observable<VectorLayer>>((layer) => (layer ? of(layer) : of())),
            ),
        ])
            .pipe(
                first(),
                tap(() => {
                    this.plotLoading.next(true);
                    this.plotData.next(undefined);

                    this.plotSpecies = this.selectedSpecies ? this.selectedSpecies : '';
                    this.plotEnvironmentLayer = this.selectedEnvironmentLayer ? this.selectedEnvironmentLayer.name : '';
                }),
                mergeMap(([rasterLayer, speciesLayer]) =>
                    combineLatest([
                        this.projectService.getWorkflow(rasterLayer.workflowId),
                        this.projectService.getWorkflow(speciesLayer.workflowId),
                    ]),
                ),
                mergeMap(([rasterWorkflow, speciesWorkflow]) =>
                    this.projectService.registerWorkflow({
                        type: 'Vector',
                        operator: {
                            type: 'RasterVectorJoin',
                            params: {
                                names: ['environment'],
                                temporalAggregation: 'none',
                                featureAggregation: 'first',
                            },
                            sources: {
                                rasters: [rasterWorkflow.operator],
                                vector: speciesWorkflow.operator,
                            },
                        } as RasterVectorJoinDict,
                    }),
                ),
                mergeMap((workflowId) => combineLatest([this.projectService.getWorkflow(workflowId), this.dataSelectionService.dataRange])),
                mergeMap(([workflow, dataRange]) =>
                    this.projectService.registerWorkflow({
                        type: 'Plot',
                        operator: {
                            type: 'Histogram',
                            params: {
                                // TODO: get params from selected data
                                buckets: 20,
                                bounds: dataRange,
                                columnName: 'environment',
                            } as HistogramParams,
                            sources: {
                                source: workflow.operator,
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
                        this.mapService.getViewportSizeStream(),
                    ]),
                ),
                mergeMap(([workflowId, sessionToken, time, crs, viewport]) =>
                    this.backend.getPlot(
                        workflowId,
                        {
                            time: time.toDict(),
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

    thumbLabelMonthDisplay(value: number): string | number {
        switch (value) {
            case 1:
                return 'Januar';
            case 2:
                return 'Februar';
            case 3:
                return 'März';
            case 4:
                return 'April';
            case 5:
                return 'Mai';
            case 6:
                return 'Juni';
            case 7:
                return 'Juli';
            case 8:
                return 'August';
            case 9:
                return 'September';
            case 10:
                return 'Oktober';
            case 11:
                return 'November';
            case 12:
                return 'Dezember';
            default:
                return '';
        }
    }

    setMonth(value: number | null): void {
        if (!value) {
            return;
        }

        this.currentMonth = value;

        this.dataSelectionService.setTimeSteps(
            [...generateYearlyTimeSteps(START_YEAR, END_YEAR, this.currentMonth)],
            (currentTime: Time, timeStep: Time): boolean => currentTime.start.year() === timeStep.start.year(),
        );
    }
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

function* generateYearlyTimeSteps(yearStart: number, yearEnd: number, fixedMonth: number): IterableIterator<Time> {
    if (yearStart > yearEnd) {
        throw Error('start must be before end');
    }
    if (fixedMonth < 1 || fixedMonth > 12) {
        throw Error('month must be between 1 and 12');
    }

    const month = fixedMonth.toString().padStart(2, '0');
    const nextMonth = fixedMonth === 12 ? '01' : (fixedMonth + 1).toString().padStart(2, '0');

    for (let year = yearStart; year <= yearEnd; ++year) {
        const nextYear = fixedMonth === 12 ? year + 1 : year;

        const dateStart = `${year}-${month}-01T00:00:00.000Z`;
        const dateEnd = `${nextYear}-${nextMonth}-01T00:00:00.000Z`;

        yield new Time(moment.utc(dateStart), moment.utc(dateEnd));
    }
}
