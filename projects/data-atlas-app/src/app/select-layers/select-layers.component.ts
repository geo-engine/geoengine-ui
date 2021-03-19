import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {mergeMap} from 'rxjs/operators';
import {
    Interpolation,
    MappingRasterSymbology,
    ProjectService,
    RasterLayer,
    Unit,
    WorkflowDict,
    ColorBreakpointDict,
    Time,
    UUID,
} from 'wave-core';
import {DataSelectionService} from '../data-selection.service';
import {MatSelectionListChange} from '@angular/material/list';
import moment from 'moment';

@Component({
    selector: 'wave-app-mock-layers',
    templateUrl: './select-layers.component.html',
    styleUrls: ['./select-layers.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectLayersComponent implements OnInit {
    constructor(private projectService: ProjectService, private dataSelectionService: DataSelectionService) {}

    ngOnInit(): void {}

    addBiome(): void {
        const workflow: WorkflowDict = {
            type: 'Raster',
            operator: {
                type: 'GdalSource',
                params: {
                    data_set: {
                        Internal: '73b13876-bdd2-48b2-a628-ce0a1b0eee9d',
                    },
                },
            },
        };

        const classes: {[index: number]: string} = {
            1: 'Permanent ice or polar desert',
            2: 'Desert',
            3: 'Semi-desert',
            4: 'Tundra',
            5: 'Shrubland',
            6: 'Tropical grassland',
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
            rgba: [0, 200, 200, 255],
        });
        breakpoints.push({
            value: 6,
            rgba: [0, 0, 0, 255],
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
                            name: 'Biome',
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
                        [new Time(moment.utc('-006000-01-01T00:00:00.000Z')), new Time(moment.utc('1850-01-01T00:00:00.000Z'))],
                        {
                            min: 1,
                            max: 20,
                        },
                    ),
                ),
            )
            .subscribe(() => {
                // success
            });
    }

    addKK09(name: string, sourceId: UUID): void {
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

        const timeSteps = [];
        // bc
        for (let year = 1000; year > 0; year -= 10) {
            const paddedYear = year.toString().padStart(6, '0');
            timeSteps.push(new Time(moment.utc(`-${paddedYear}-01-01T00:00:00.000Z`)));
        }
        // ad
        for (let year = 10; year <= 1850; year += 10) {
            const paddedYear = year.toString().padStart(4, '0');
            timeSteps.push(new Time(moment.utc(`${paddedYear}-01-01T00:00:00.000Z`)));
        }

        this.projectService
            .registerWorkflow(workflow)
            .pipe(
                mergeMap((workflowId) =>
                    this.dataSelectionService.setRasterLayer(
                        new RasterLayer({
                            workflowId,
                            name: 'Biome',
                            symbology: new MappingRasterSymbology({
                                opacity: 1,
                                unit: new Unit({
                                    measurement: Unit.defaultUnit.measurement,
                                    unit: Unit.defaultUnit.unit,
                                    min: 0,
                                    max: 1,
                                    interpolation: Interpolation.Continuous,
                                }),
                            }),
                            isLegendVisible: false,
                            isVisible: true,
                        }),
                        timeSteps,
                        {min: 0, max: 1},
                    ),
                ),
            )
            .subscribe(() => {
                // success
            });
    }

    selectData($event: MatSelectionListChange): void {
        if ($event.options.length !== 1) {
            throw Error('It is only possible to select one dataset');
        }

        switch ($event.options[0].value as string) {
            case 'biome':
                this.addBiome();
                break;
            case 'kk09_land_use_high':
                this.addKK09('Land Use High', '92f0a62e-9510-4210-beeb-43146086ca63');
                break;
            case 'kk09_land_use_low':
                this.addKK09('Land Use Low', '0d415a11-836e-4a23-94db-b17536c95828');
                break;
            case 'kk09_land_use_tech':
                this.addKK09('Land Use Tech', '62fc10c9-bce9-4638-b4e3-d270ccfc9c5b');
                break;
            default:
            // do nothing
        }
    }
}
