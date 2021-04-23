import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {mergeMap} from 'rxjs/operators';
import {ProjectService, RasterLayer, VectorLayer, PointSymbology, RandomColorService, WorkflowDict, RasterSymbology} from 'wave-core';

@Component({
    selector: 'wave-app-mock-layers',
    templateUrl: './mock-layers.component.html',
    styleUrls: ['./mock-layers.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MockLayersComponent implements OnInit {
    constructor(private projectService: ProjectService, private randomColorService: RandomColorService) {}

    ngOnInit(): void {}

    addRaster(): void {
        const workflow: WorkflowDict = {
            type: 'Raster',
            operator: {
                type: 'GdalSource',
                params: {
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    dataset_id: 'modis_ndvi',
                },
            },
        };

        this.projectService
            .registerWorkflow(workflow)
            .pipe(
                mergeMap((workflowId) =>
                    this.projectService.addLayer(
                        new RasterLayer({
                            workflowId,
                            name: 'NDVI Test Raster',
                            symbology: RasterSymbology.fromRasterSymbologyDict({
                                opacity: 1.0,
                                colorizer: {
                                    linearGradient: {
                                        breakpoints: [
                                            {value: 0, color: [0, 0, 0, 255]},
                                            {value: 255, color: [255, 255, 255, 255]},
                                        ],
                                        defaultColor: [0, 0, 0, 255],
                                        noDataColor: [0, 0, 0, 255],
                                    },
                                },
                            }),
                            isLegendVisible: false,
                            isVisible: true,
                        }),
                    ),
                ),
            )
            // eslint-disable-next-line no-console
            .subscribe(() => console.log('added raster'));
    }

    addPoints(): void {
        const workflow: WorkflowDict = {
            type: 'Vector',
            operator: {
                type: 'MockPointSource',
                params: {
                    points: [
                        {
                            x: 0.0,
                            y: 0.0,
                        },
                        {
                            // Marburg
                            x: 8.7667933,
                            y: 50.8021728,
                        },
                        {
                            // Cologne
                            x: 6.9602786,
                            y: 50.937531,
                        },
                    ],
                },
            },
        };

        this.projectService
            .registerWorkflow(workflow)
            .pipe(
                mergeMap((workflowId) =>
                    this.projectService.addLayer(
                        new VectorLayer({
                            workflowId,
                            name: 'Two cities and (0, 0)',
                            symbology: PointSymbology.fromPointSymbologyDict({
                                radius: {static: 10},
                                stroke: {width: {static: 10}, color: {static: [0, 0, 0, 0]}},
                                fillColor: {static: [0, 0, 0, 0]},
                            }),
                            isLegendVisible: false,
                            isVisible: true,
                        }),
                    ),
                ),
            )
            // eslint-disable-next-line no-console
            .subscribe(() => console.log('added points'));
    }
}
