import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {
    ClusteredPointSymbology,
    DatasetService,
    PointSymbology,
    ProjectService,
    RasterLayer,
    RasterSymbology,
    Time,
    UUID,
    VectorLayer,
    WorkflowDict,
} from 'wave-core';
import {combineLatestWith, mergeMap, of} from 'rxjs';
import {DataSelectionService} from '../data-selection.service';
import moment from 'moment';

interface EnvironmentLayer {
    id: UUID;
    name: string;
}

@Component({
    selector: 'wave-species-selector',
    templateUrl: './species-selector.component.html',
    styleUrls: ['./species-selector.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpeciesSelectorComponent implements OnInit, OnDestroy {
    readonly species: string[] = [
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

    readonly environmentLayers: EnvironmentLayer[] = [
        {
            id: '36574dc3-560a-4b09-9d22-d5945f2b8093',
            name: 'NDVI',
        },
    ];

    private datasetId: UUID = 'd9dd4530-7a57-44da-a650-ce7d81dcc216';

    constructor(
        public readonly dataSelectionService: DataSelectionService,
        private readonly projectService: ProjectService,
        private readonly datasetService: DatasetService,
    ) {}

    ngOnInit(): void {
        this.dataSelectionService.setTimeSteps([...generateMonthlyTimeSteps(2018, 1, 12)]);
    }

    ngOnDestroy(): void {}

    selectSpecies(species: string): void {
        const workflow: WorkflowDict = {
            type: 'Vector',
            operator: {
                type: 'ColumnRangeFilter',
                params: {
                    column: 'Species',
                    ranges: [[species, species]],
                    keepNulls: false,
                },
                sources: {
                    vector: {
                        type: 'OgrSource',
                        params: {
                            dataset: {
                                type: 'internal',
                                datasetId: this.datasetId,
                            },
                        },
                    },
                },
            },
        };

        this.projectService
            .registerWorkflow(workflow)
            .pipe(
                mergeMap((workflowId) =>
                    this.dataSelectionService.setSpeciesLayer(
                        new VectorLayer({
                            workflowId,
                            name: species,
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

        this.projectService
            .registerWorkflow(workflow)
            .pipe(
                combineLatestWith(this.datasetService.getDataset({type: 'internal', datasetId: layer.id})),
                mergeMap(([workflowId, dataset]) => {
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
                                min: 1,
                                max: 20,
                            },
                        );
                    }

                    return of(undefined);
                }),
            )
            .subscribe();
    }
}

function* generateMonthlyTimeSteps(year: number, start: number, end: number): IterableIterator<Time> {
    if (start < 1 || end > 12) {
        throw Error('start and end must be between 1 and 12');
    }

    for (let i = start; i <= end; i++) {
        const month = i.toString().padStart(2, '0');

        const nextI = 1 + (i % 12);
        const nextMonth = nextI.toString().padStart(2, '0');
        const nextYear = nextI > i ? year : year + 1;

        const dateStart = `${year}-${month}-01T00:00:00.000Z`;
        const dateEnd = `${nextYear}-${nextMonth}-01T00:00:00.000Z`;

        yield new Time(moment.utc(dateStart), moment.utc(dateEnd));
    }
}
