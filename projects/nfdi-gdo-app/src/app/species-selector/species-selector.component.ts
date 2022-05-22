import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {
    BackendService,
    ClusteredPointSymbology,
    Dataset,
    DatasetService,
    extentToBboxDict,
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

const START_YEAR = 1991;
const END_YEAR = 2020;
const DRAGONFLY_SPECIES = [
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
const FISH_SPECIES = [
    'Coregonus sp. "Kärnten"',
    'Pomatoschistus pictus',
    'Acipenser nudiventris',
    'Coregonus arenicolus',
    'Leuciscus leuciscus',
    'Tinca tinca',
    'Pungitius pungitius',
    'Perccottus glenii',
    'Coregonus hoferi',
    'Lampetra planeri',
    'Ballerus sapa',
    'Cobitis taenia',
    'Gasterosteus aculeatus',
    'Misgurnus anguillicaudatus',
    'Zingel zingel',
    'Coregonus widegreni',
    'Gobio gobio',
    'Silurus glanis',
    'Coregonus bavaricus',
    'Cetorhinus maximus',
    'Myoxocephalus scorpius',
    'Acipenser spec.',
    'Salvelinus evasus',
    'Gobio albipinnatus',
    'Barbus barbus',
    'Gobiosoma bosc',
    'Mola mola',
    'Paramisgurnus dabryanus',
    'Tachysurus fulvidraco',
    'Coregonus maraenoides',
    'Ammodytes marinus',
    'Carassius langsdorfii',
    'Clupea harengus',
    'Romanogobio belingi',
    'Morone saxatilis',
    'Belone belone',
    'Blicca bjoerkna',
    'Ctenopharyngodon idella',
    'Ameiurus melas',
    'Perca fluviatilis',
    'Hypophthalmichthys molitrix',
    'Salvelinus fontinalis',
    'Ponticola kessleri',
    'Ballerus ballerus',
    'Enchelyopus cimbrius',
    'Amatitlania nigrofasciata',
    'Cottus poecilopus',
    'Pimephales promelas',
    'Gobiusculus flavescens',
    'Alburnoides bipunctatus',
    'Leuciscus aspius',
    'Rutilus meidingeri',
    'Petromyzon marinus',
    'Leucaspius delineatus',
    'Thymallus thymallus',
    'Pomatoschistus microps',
    'Sabanejewia baltica',
    'Huso huso',
    'Xiphias gladius',
    'Carassius gibelio',
    'Babka gymnotrachelus',
    'Scyliorhinus canicula',
    'Aphia minuta',
    'Coregonus wartmanni',
    'Raniceps raninus',
    'Rhodeus amarus',
    'Agonus cataphractus',
    'Umbra krameri',
    'Spinachia spinachia',
    'Salvelinus umbla',
    'Misgurnus fossilis',
    'Salmo trutta',
    'Carassius auratus',
    'Gadus morhua',
    'Merlangius merlangus',
    'Liparis liparis',
    'Alopias vulpinus',
    'Rutilus virgo',
    'Alosa fallax',
    'Rutilus rutilus',
    'Platichthys flesus',
    'Gobius niger',
    'Ciliata mustela',
    'Pleuronectes platessa',
    'Cyprinus carpio',
    'Sprattus sprattus',
    'Acipenser gueldenstaedtii',
    'Coregonus macrophthalmus',
    'Lepomis gibbosus',
    'Coregonus fontanae',
    'Hucho hucho',
    'Barbatula barbatula',
    'Sander lucioperca',
    'Limanda limanda',
    'Pelecus cultratus',
    'Misgurnus bipartitus',
    'Hyperoplus lanceolatus',
    'Abramis brama',
    'Chelon labrosus',
    'Taurulus bubalis',
    'Trachurus trachurus',
    'Lipophrys pholis',
    'Phoxinus phoxinus',
    'Oncorhynchus mykiss',
    'Acipenser ruthenus',
    'Gymnocephalus schraetser',
    'Salvelinus namaycush',
    'Coregonus maraena',
    'Pholis gunnellus',
    'Salmo salar',
    'Syngnathus typhle',
    'Lampetra fluviatilis',
    'Cottus gobio',
    'Molva molva',
    'Gymnocephalus baloni',
    'Ctenolabrus rupestris',
    'Alburnus mento',
    'Sander volgensis',
    'Carassius carassius',
    'Squalius cephalus',
    'Romanogobio uranoscopus',
    'Nerophis ophidion',
    'Romanogobio vladykovi',
    'Acipenser stellatus',
    'Coregonus lavaretus',
    'Anguilla anguilla',
    'Scardinius erythrophthalmus',
    'Romanogobio kesslerii',
    'Leuciscus idus',
    'Lota lota',
    'Coregonus oxyrinchus',
    'Cyclopterus lumpus',
    'Gobio obtusirostris',
    'Acipenser baerii',
    'Zingel streber',
    'Amblyraja radiata',
    'Ameiurus nebulosus',
    'Pomatoschistus minutus',
    'Proterorhinus semilunaris',
    'Gasterosteus gymnurus',
    'Chondrostoma nasus',
    'Osmerus eperlanus',
    'Coregonus lucinensis',
    'Cobitis elongatoides',
    'Eudontomyzon mariae',
    'Vimba vimba',
    'Gymnocephalus cernua',
    'Poecilia reticulata',
    'Coregonus albula',
    'Syngnathus rostellatus',
    'Sabanejewia balcanica',
    'Psetta maxima',
    'Alburnus alburnus',
    'Solea solea',
    'Dicentrarchus labrax',
    'Cottus perifretum',
    'Raja clavata',
    'Hippocampus hippocampus',
    'Pseudorasbora parva',
    'Esox lucius',
    'Neogobius melanostomus',
    'Neogobius fluviatilis',
    'Zoarces viviparus',
    'Acipenser sturio',
    'Ammodytes tobianus',
    'Cottus microstomus',
];
/* eslint-disable @typescript-eslint/naming-convention */
const SPECIES_INFO: {[key: string]: SpeciesInfo} = {
    'Anax imperator': {
        text: `Die Große Königslibelle erreicht Flügelspannweiten von 9,5 bis 11 Zentimetern. Der Brustabschnitt (Thorax) der Tiere ist grün gefärbt,
        der Hinterleib (Abdomen) der Männchen ist hellblau mit einem durchgehenden schwarzen Längsband am Rücken, das an jedem Segment eine zahnartige
        Ausbuchtung besitzt. Der Hinterleib der Weibchen ist blaugrün, das Längsband am Rücken ist braun und breit. Im Gegensatz dazu hat die etwas
        kleinere Kleine Königslibelle (Anax parthenope) eine braune Brust und der Hinterleib ist nur im vorderen Bereich blau. `,
        imageSrc: 'https://upload.wikimedia.org/wikipedia/commons/0/06/Anax_imperator_qtl2.jpg',
        imageRef: 'Quartl',
    },
    'Coenagrion puella': {
        text: `Die Hufeisen-Azurjungfer (Coenagrion puella) erreicht Körperlängen von 35 bis 40 Millimetern und ist in der Regel sehr schlank, fast nadelförmig
        gebaut. Den Namen hat die Hufeisen-Azurjungfer dem hufeisenförmigen schwarzen Mal, das auf dem zweiten Hinterleibssegment des
        Männchens zu finden ist (Bild 7), zu verdanken. Dies existiert jedoch auch bei ähnlichen Arten wie etwa der
        Fledermaus-Azurjungfer (C. pulchellum) in ähnlicher Ausprägung, bei der die schwarze Zeichnung der folgenden Hinterleibssegmente
        jedoch umfassender ist. Außerdem wird zur einwandfreien Identifizierung der Männchen die Form der Zange am letzten
        Hinterleibssegment (Bild 10) herangezogen. Die Männchen sind blau mit schwarzer Zeichnung. Bei den ausgefärbten Weibchen
        überwiegt die schwarze Zeichnung, in der Grundfarbe sind sie meist grün (heterochrome Weibchen, Bild 3), manchmal hellblau
        (homoeochrome Weibchen, Bild 4). Junge Exemplare sind bei Männchen und Weibchen milchig blass (Bild 5, 6). Die Weibchen tragen
        auf dem ersten Abdominalsegment kein „Hufeisen“, sondern eine Zeichnung, die an einen Pokal erinnert (Bild 8). Die Zeichnung
        variiert jedoch ebenfalls beträchtlich und es gibt Überschneidungen zu mehreren anderen Arten. Deswegen zieht man zur Bestimmung
        der Art die Linie heran, in der das Pronotum nach hinten abschließt. Bei der Hufeisen-Azurjungfer ist diese doppelt geschwungen
        und meist blau (Bild 9). Die Zangenform des Männchens und die Form des Halsschildes beim Weibchen sind konstante Merkmale, da
        sie für das Paarungsrad (Bild 14) genau „passen“ müssen.`,
        imageSrc: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Coenagrion_puella_3%28loz%29.jpg',
        imageRef: 'L. B. Tettenborn',
    },
};

interface SpeciesInfo {
    text: string;
    imageSrc: string;
    imageRef?: string;
}

@Component({
    selector: 'wave-species-selector',
    templateUrl: './species-selector.component.html',
    styleUrls: ['./species-selector.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpeciesSelectorComponent implements OnInit, OnDestroy {
    readonly dragonflySpecies: string[] = DRAGONFLY_SPECIES;
    readonly fishSpecies: string[] = FISH_SPECIES;

    readonly environmentLayers: EnvironmentLayer[] = [
        // {
        //     id: '36574dc3-560a-4b09-9d22-d5945f2b8111',
        //     name: 'NDVI',
        //     dataRange: [-2000, 10000],
        // },
        // {
        //     id: '36574dc3-560a-4b09-9d22-d5945f2b8666',
        //     name: 'Water Bodies 333m',
        //     dataRange: [70, 71],
        // },
        {
            id: '6c9270ad-e87c-404b-aa1f-4bfb8a1b3cd7',
            name: 'Mittlere monatliche Temperatur in C° (2000 - 2020)',
            dataRange: [-5, 30],
        },
        {
            id: 'fedad2aa-00db-44b5-be38-e8637932aa0a',
            name: 'Mittlerer monatlicher Niederschlag in mm (2000 - 2020)',
            dataRange: [0, 20],
        },
        {
            id: '36574dc3-560a-4b09-9d22-d5945ffb8093',
            name: 'Landnutzungstypen (2019 & 2020)',
            dataRange: [0, 60],
        },
        {
            id: 'bde4f21f-b935-4cd3-b7ed-1675aedfa026',
            name: 'Anteil Gebiete „Natur- und Artenschutz“ an Gebietsfläche',
            dataRange: [0, 100],
        },
    ];

    plotSpecies = '';
    plotEnvironmentLayer = '';
    readonly plotData = new BehaviorSubject<any>(undefined);
    readonly plotLoading = new BehaviorSubject(false);

    currentMonth = 1;

    selectedDragonflySpecies?: string = undefined;
    selectedFishSpecies?: string = undefined;
    selectedEnvironmentLayer?: EnvironmentLayer = undefined;
    selectedEnvironmentCitation = new BehaviorSubject<string>('');

    dragonflySpeciesLayer?: Layer = undefined;
    fishSpeciesLayer?: Layer = undefined;
    intensityLayer?: RasterLayer = undefined;
    environmentLayer?: Layer = undefined;

    plotLayerSelection: 'dragonfly' | 'fish' = 'dragonfly';

    readonly startYear = START_YEAR;
    readonly endYear = END_YEAR;

    private readonly dragonflyDatasetId: UUID = 'd9dd4530-7a57-44da-a650-ce7d81dcc216';
    private readonly fishDatasetId: UUID = '40c0756f-ecfc-4460-ac6d-ca67190e0436';
    private readonly intensityDatasetId: UUID = '1a7584e6-0c94-4d92-bbcd-223626d64d9c';

    private selectedEnvironmentDataset?: Dataset = undefined;

    private readonly subscriptions: Array<Subscription> = [];

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
        const species1LayerSubscription = this.dataSelectionService.speciesLayer1.subscribe((speciesLayer) => {
            this.dragonflySpeciesLayer = speciesLayer;
            this.changeDetectorRef.markForCheck();
        });
        this.subscriptions.push(species1LayerSubscription);

        const species2LayerSubscription = this.dataSelectionService.speciesLayer2.subscribe((speciesLayer) => {
            this.fishSpeciesLayer = speciesLayer;
            this.changeDetectorRef.markForCheck();
        });
        this.subscriptions.push(species2LayerSubscription);

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

    selectDragonflySpecies(species: string): void {
        this.selectedDragonflySpecies = species;

        if (!this.selectedDragonflySpecies) {
            this.dataSelectionService.resetSpecies1Layer().subscribe();

            return;
        }

        const workflow: WorkflowDict = {
            type: 'Vector',
            operator: {
                type: 'TimeProjection',
                params: {
                    step: {
                        granularity: 'years',
                        step: 1,
                    },
                },
                sources: {
                    vector: {
                        type: 'OgrSource',
                        params: {
                            dataset: {
                                type: 'internal',
                                datasetId: this.dragonflyDatasetId,
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
                    this.dataSelectionService.setSpecies1Layer(
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

    selectFishSpecies(species: string): void {
        this.selectedFishSpecies = species;

        if (!this.selectedFishSpecies) {
            this.dataSelectionService.resetSpecies2Layer().subscribe();

            return;
        }

        const workflow: WorkflowDict = {
            type: 'Vector',
            operator: {
                type: 'TimeProjection',
                params: {
                    step: {
                        granularity: 'years',
                        step: 1,
                    },
                },
                sources: {
                    vector: {
                        type: 'OgrSource',
                        params: {
                            dataset: {
                                type: 'internal',
                                datasetId: this.fishDatasetId,
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
                    this.dataSelectionService.setSpecies2Layer(
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
                                    color: [16, 83, 120, 255],
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

    getSpeciesInfo(species?: string): SpeciesInfo | undefined {
        if (!species) {
            return undefined;
        }
        return SPECIES_INFO[species];
    }

    showIntensities(show: boolean): void {
        this.intensityLayer = undefined;

        if (!show) {
            this.dataSelectionService.setIntensityLayer(undefined).subscribe();
            return;
        }

        const workflow: WorkflowDict = {
            type: 'Raster',
            operator: {
                type: 'GdalSource',
                params: {
                    dataset: {
                        type: 'internal',
                        datasetId: this.intensityDatasetId,
                    },
                },
            },
        };

        this.projectService
            .registerWorkflow(workflow)
            .pipe(
                combineLatestWith(this.datasetService.getDataset({type: 'internal', datasetId: this.intensityDatasetId})),
                tap(([workflowId, _dataset]) => {
                    this.userService
                        .getSessionTokenForRequest()
                        .pipe(mergeMap((token) => this.backend.getWorkflowProvenance(workflowId, token)))
                        .subscribe((_provenance) => {
                            // TODO: citation
                            // this.selectedEnvironmentCitation.next(provenance.map((p) => p.provenance.citation).join(','));
                        });
                }),
                mergeMap(([workflowId, dataset]) => {
                    this.selectedEnvironmentDataset = dataset;
                    if (!!dataset.symbology && dataset.symbology instanceof RasterSymbology) {
                        this.intensityLayer = new RasterLayer({
                            workflowId,
                            name: 'Beprobungshäufigkeit',
                            symbology: dataset.symbology,
                            isLegendVisible: false,
                            isVisible: true,
                        });
                        this.changeDetectorRef.markForCheck();
                        return this.dataSelectionService.setIntensityLayer(this.intensityLayer);
                    }

                    return of(undefined);
                }),
            )
            .subscribe();
    }

    computePlot(): void {
        if (
            (!this.selectedFishSpecies && !this.selectDragonflySpecies) ||
            !this.selectedEnvironmentLayer ||
            !this.selectedEnvironmentDataset
        ) {
            return;
        }

        let speciesLayer$: Observable<VectorLayer | undefined>;
        let selectedSpecies: string | undefined;

        if (!this.selectedDragonflySpecies) {
            speciesLayer$ = this.dataSelectionService.speciesLayer2;
            selectedSpecies = this.selectedFishSpecies;
        } else if (!this.selectFishSpecies) {
            speciesLayer$ = this.dataSelectionService.speciesLayer1;
            selectedSpecies = this.selectedDragonflySpecies;
        } else if (this.plotLayerSelection === 'dragonfly') {
            speciesLayer$ = this.dataSelectionService.speciesLayer1;
            selectedSpecies = this.selectedDragonflySpecies;
        } /* if (this.plotLayerSelection === 'fish') */ else {
            speciesLayer$ = this.dataSelectionService.speciesLayer2;
            selectedSpecies = this.selectedFishSpecies;
        }

        combineLatest([
            this.dataSelectionService.rasterLayer.pipe(
                mergeMap<RasterLayer | undefined, Observable<RasterLayer>>((layer) => (layer ? of(layer) : of())),
            ),
            speciesLayer$.pipe(mergeMap<VectorLayer | undefined, Observable<VectorLayer>>((layer) => (layer ? of(layer) : of()))),
        ])
            .pipe(
                first(),
                tap(() => {
                    this.plotLoading.next(true);
                    this.plotData.next(undefined);

                    this.plotSpecies = selectedSpecies ?? '';
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
