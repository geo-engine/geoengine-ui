import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {mergeMap} from 'rxjs/operators';
import {MappingRasterSymbology, ProjectService, RasterLayer, Unit, VectorLayer, PointSymbology, RandomColorService} from 'wave-core';

@Component({
    selector: 'wave-app-mock-layers',
    templateUrl: './mock-layers.component.html',
    styleUrls: ['./mock-layers.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MockLayersComponent implements OnInit {

    constructor(private projectService: ProjectService,
                private randomColorService: RandomColorService) {
    }

    ngOnInit(): void {
    }

    addRaster() {
        const workflow = {
            type: 'Raster',
            operator: {
                type: 'GdalSource',
                params: {
                    dataset_id: 'modis_ndvi',
                }
            }
        };

        this.projectService.registerWorkflow(workflow).pipe(
            mergeMap(workflowId => {
                return this.projectService.addLayer(new RasterLayer({
                    workflowId,
                    name: 'NDVI Test Raster',
                    symbology: new MappingRasterSymbology({
                        opacity: 1,
                        unit: new Unit({
                            measurement: Unit.defaultUnit.measurement,
                            unit: Unit.defaultUnit.unit,
                            min: 1,
                            max: 255,
                            interpolation: Unit.defaultUnit.interpolation,
                        }),
                    }),
                    isLegendVisible: false,
                    isVisible: true,
                }));
            })
        ).subscribe(() => console.log('added raster'));
    }

    addPoints() {
        const workflow = {
            type: 'Vector',
            operator: {
                type: 'MockPointSource',
                params: {
                    points: [{
                        x: 0.0,
                        y: 0.0
                    }, {
                        // Marburg
                        x: 8.7667933,
                        y: 50.8021728
                    }, {
                        // Cologne
                        x: 6.9602786,
                        y: 50.937531
                    }]
                }
            }
        };

        this.projectService.registerWorkflow(workflow).pipe(
            mergeMap(workflowId => {
                return this.projectService.addLayer(new VectorLayer({
                    workflowId,
                    name: 'Two cities and (0, 0)',
                    symbology: PointSymbology.createSymbology({
                        fillRGBA: this.randomColorService.getRandomColorRgba(),
                        radius: 10,
                        clustered: false,
                    }),
                    isLegendVisible: false,
                    isVisible: true,
                }));
            })
        ).subscribe(() => console.log('added points'));
    }
}
