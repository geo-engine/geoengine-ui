import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {mergeMap} from 'rxjs/operators';
import {Interpolation, MappingRasterSymbology, ProjectService, RasterLayer, Unit, UUID, WorkflowDict} from 'wave-core';
import {MatRadioChange} from '@angular/material/radio';

@Component({
    selector: 'wave-app-mock-layers',
    templateUrl: './select-layers.component.html',
    styleUrls: ['./select-layers.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectLayersComponent implements OnInit {
    constructor(private projectService: ProjectService) {}

    ngOnInit(): void {}

    addBiome(name: string, sourceId: UUID) {
        this.projectService.clearLayers();

        const workflow: WorkflowDict = {
            type: 'Raster',
            operator: {
                type: 'GdalSource',
                params: {
                    data_set: {
                        Internal: sourceId,
                    },
                },
            },
        };

        const classes: {[index: number]: string} = {
            1: 'Permanent ice or polar desert',
            2: 'Desert',
            3: 'Semi-desert',
            4: 'Tundra',
            5: 'Tropical grassland',
            6: 'Shrubland',
            7: 'Temperate grassland',
            8: 'Tropical savanna',
            9: 'Warm temperate open woodland',
            10: 'Cold temperate/boreal open woodland',
            11: 'Tropical rainforest',
            12: 'Tropical deciduous forest/woodland savanna',
            13: 'Sub-tropical forest',
            14: 'Warm temperate broadleaved evergreen forest',
            15: 'Warm temperate conifer forest',
            16: 'Warm temperate mixed forest',
            17: 'Temperate broadleaved deciduous forest',
            18: 'Cool temperate conifer forest',
            19: 'Cool temperate mixed forest',
            20: 'Cold temperate/boreal forest',
        };
        const classesMap = new Map<number, string>();
        for (const valueAsString of Object.keys(classes)) {
            const value = parseInt(valueAsString, 10);
            classesMap.set(value, classes[valueAsString]);
        }

        this.projectService
            .registerWorkflow(workflow)
            .pipe(
                mergeMap((workflowId) => {
                    return this.projectService.addLayer(
                        new RasterLayer({
                            workflowId,
                            name,
                            symbology: new MappingRasterSymbology({
                                opacity: 1,
                                unit: new Unit({
                                    measurement: 'CARAIB',
                                    unit: '',
                                    classes: classesMap,
                                    min: 1,
                                    max: 20,
                                    interpolation: Interpolation.Discrete,
                                }),
                            }),
                            isLegendVisible: false,
                            isVisible: true,
                        }),
                    );
                }),
            )
            .subscribe(() => console.log('added raster'));
    }

    addBiome6k() {
        this.addBiome('Biome 6k', '73b13876-bdd2-48b2-a628-ce0a1b0eee9d');
    }

    addBiomePi() {
        this.addBiome('Biome Pi', 'bc33b76a-c3ee-4791-9914-17a9282d7ee3');
    }

    selectData($event: MatRadioChange) {
        switch ($event.value as string) {
            case 'biome6k':
                this.addBiome6k();
                break;
            case 'biomePi':
                this.addBiomePi();
                break;
            default:
            // do nothing
        }
    }
}
