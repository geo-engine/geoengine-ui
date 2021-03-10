import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {mergeMap} from 'rxjs/operators';
import {Interpolation, MappingRasterSymbology, ProjectService, RasterLayer, Unit, UUID, WorkflowDict} from 'wave-core';
import {DataSelectionService} from '../data-selection.service';
import {MatSelectionListChange} from '@angular/material/list';
import {ColorBreakpointDict} from '../../../../wave-core/src/lib/colors/color-breakpoint.model';

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

        const breakpoints = new Array<ColorBreakpointDict>();
        breakpoints.push({
            value: 1,
            rgba: [0, 0, 0, 255],
        });
        breakpoints.push({
            value: 2,
            rgba: [241, 129, 43, 255],
        });
        breakpoints.push({
            value: 3,
            rgba: [231, 174, 44, 255],
        });
        breakpoints.push({
            value: 4,
            rgba: [170, 170, 170, 255],
        });
        breakpoints.push({
            value: 5,
            rgba: [0, 0, 0, 255],
        });
        breakpoints.push({
            value: 6,
            rgba: [0, 200, 200, 255],
        });
        breakpoints.push({
            value: 7,
            rgba: [30, 60, 255, 255],
        });
        breakpoints.push({
            value: 8,
            rgba: [231, 220, 50, 255],
        });
        breakpoints.push({
            value: 9,
            rgba: [161, 230, 51, 255],
        });
        breakpoints.push({
            value: 10,
            rgba: [0, 210, 139, 255],
        });
        breakpoints.push({
            value: 11,
            rgba: [0, 0, 0, 255],
        });
        breakpoints.push({
            value: 12,
            rgba: [0, 0, 0, 255],
        });
        breakpoints.push({
            value: 13,
            rgba: [127, 1, 220, 255],
        });
        breakpoints.push({
            value: 14,
            rgba: [0, 0, 0, 255],
        });
        breakpoints.push({
            value: 15,
            rgba: [0, 0, 0, 255],
        });
        breakpoints.push({
            value: 16,
            rgba: [164, 0, 204, 255],
        });
        breakpoints.push({
            value: 17,
            rgba: [1, 221, 1, 255],
        });
        breakpoints.push({
            value: 18,
            rgba: [0, 0, 0, 255],
        });
        breakpoints.push({
            value: 19,
            rgba: [0, 0, 0, 255],
        });
        breakpoints.push({
            value: 20,
            rgba: [0, 160, 254, 255],
        });

        this.projectService
            .registerWorkflow(workflow)
            .pipe(
                mergeMap((workflowId) =>
                    this.dataSelectionService.setRasterLayer(
                        new RasterLayer({
                            workflowId,
                            name,
                            symbology: new MappingRasterSymbology({
                                opacity: 1,
                                colorizer: {
                                    breakpoints,
                                    type: 'palette',
                                },
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
