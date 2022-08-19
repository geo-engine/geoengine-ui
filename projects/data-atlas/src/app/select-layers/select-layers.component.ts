import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {mergeMap} from 'rxjs/operators';
import {ProjectService, RasterLayer, RasterSymbology, RgbaColorDict, Time, UUID, WorkflowDict} from '@geoengine/core';
import {DataSelectionService} from '../data-selection.service';
import {MatSelectionListChange} from '@angular/material/list';
import moment from 'moment';

@Component({
    selector: 'ge-app-mock-layers',
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
                    data: {
                        type: 'internal',
                        datasetId: '73b13876-bdd2-48b2-a628-ce0a1b0eee9d',
                    },
                },
            },
        };

        /* eslint-disable @typescript-eslint/naming-convention */
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
            classesMap.set(value, classes[value]);
        }

        const colors: {[numberString: string]: RgbaColorDict} = {
            '1': [0, 0, 0, 255],
            '2': [241, 129, 43, 255],
            '3': [231, 174, 44, 255],
            '4': [170, 170, 170, 255],
            '5': [200, 200, 0, 255],
            '6': [0, 0, 0, 255],
            '7': [30, 60, 255, 255],
            '8': [231, 220, 50, 255],
            '9': [161, 230, 51, 255],
            '10': [0, 210, 139, 255],
            '11': [0, 0, 0, 255],
            '12': [107, 1, 220, 255], // not from original color list
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
                            name: 'Biome',
                            symbology: RasterSymbology.fromRasterSymbologyDict({
                                type: 'raster',
                                opacity: 1,
                                colorizer: {
                                    type: 'palette',
                                    colors,
                                    defaultColor: [0, 0, 0, 0],
                                    noDataColor: [0, 0, 0, 0],
                                },
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
                    data: {
                        type: 'internal',
                        datasetId: sourceId,
                    },
                },
            },
        };

        const timeSteps: Array<Time> = [];
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

        const breakpoints: Array<{value: number; color: [number, number, number, number]}> = [
            {value: 0, color: [68, 1, 84, 255]},
            {value: 0.06666666666666667, color: [72, 26, 108, 255]},
            {value: 0.13333333333333333, color: [71, 47, 125, 255]},
            {value: 0.2, color: [65, 68, 135, 255]},
            {value: 0.26666666666666666, color: [57, 86, 140, 255]},
            {value: 0.3333333333333333, color: [49, 104, 142, 255]},
            {value: 0.4, color: [42, 120, 142, 255]},
            {value: 0.4666666666666667, color: [35, 136, 142, 255]},
            {value: 0.5333333333333333, color: [31, 152, 139, 255]},
            {value: 0.6, color: [34, 168, 132, 255]},
            {value: 0.6666666666666666, color: [53, 183, 121, 255]},
            {value: 0.7333333333333333, color: [84, 197, 104, 255]},
            {value: 0.8, color: [122, 209, 81, 255]},
            {value: 0.8666666666666667, color: [165, 219, 54, 255]},
            {value: 0.9333333333333333, color: [210, 226, 27, 255]},
            {value: 1, color: [253, 231, 37, 255]},
        ];

        this.projectService
            .registerWorkflow(workflow)
            .pipe(
                mergeMap((workflowId) =>
                    this.dataSelectionService.setRasterLayer(
                        new RasterLayer({
                            workflowId,
                            name: 'KK09',
                            symbology: RasterSymbology.fromRasterSymbologyDict({
                                type: 'raster',
                                opacity: 1.0,
                                colorizer: {
                                    type: 'linearGradient',
                                    breakpoints,
                                    defaultColor: [0, 0, 0, 0],
                                    noDataColor: [0, 0, 0, 0],
                                },
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
