import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {mergeMap} from 'rxjs/operators';
import {Interpolation, ProjectService, RasterLayer, RasterSymbology, RgbaColorDict, Unit, UUID, WorkflowDict} from 'wave-core';
import {DataSelectionService} from '../data-selection.service';
import {MatSelectionListChange} from '@angular/material/list';

@Component({
    selector: 'wave-app-mock-layers',
    templateUrl: './select-layers.component.html',
    styleUrls: ['./select-layers.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectLayersComponent implements OnInit {
    constructor(private projectService: ProjectService, private dataSelectionService: DataSelectionService) {}

    ngOnInit(): void {}

    addBiome(name: string, sourceId: UUID) {
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

        const colors: {[numberString: string]: RgbaColorDict} = {
            '1': [0, 0, 0, 255],
            '2': [241, 129, 43, 255],
            '3': [231, 174, 44, 255],
            '4': [170, 170, 170, 255],
            '5': [0, 0, 0, 255],
            '6': [0, 200, 200, 255],
            '7': [30, 60, 255, 255],
            '8': [231, 220, 50, 255],
            '9': [161, 230, 51, 255],
            '10': [0, 210, 139, 255],
            '11': [0, 0, 0, 255],
            '12': [0, 0, 0, 255],
            '13': [127, 1, 220, 255],
            '14': [0, 0, 0, 255],
            '15': [0, 0, 0, 255],
            '16': [164, 0, 204, 255],
            '17': [1, 221, 1, 255],
            '18': [0, 0, 0, 255],
            '19': [0, 0, 0, 255],
            '20': [0, 160, 254, 255],
        };

        this.projectService
            .registerWorkflow(workflow)
            .pipe(
                mergeMap((workflowId) =>
                    this.dataSelectionService.setRasterLayer(
                        new RasterLayer({
                            workflowId,
                            name,
                            symbology: RasterSymbology.fromRasterSymbologyDict({
                                opacity: 1,
                                colorizer: {
                                    Palette: {
                                        colors,
                                        default_color: [0, 0, 0, 0],
                                        no_data_color: [0, 0, 0, 0],
                                    },
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

    selectData($event: MatSelectionListChange) {
        switch ($event.option.value as string) {
            case 'biome6k':
                this.addBiome('Biome 6k', '73b13876-bdd2-48b2-a628-ce0a1b0eee9d');
                break;
            case 'biomePi':
                this.addBiome('Biome Pi', 'bc33b76a-c3ee-4791-9914-17a9282d7ee3');
                break;
            default:
            // do nothing
        }
    }
}
