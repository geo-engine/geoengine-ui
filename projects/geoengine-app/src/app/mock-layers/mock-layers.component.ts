import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {mergeMap} from 'rxjs/operators';
import {MappingRasterSymbology, ProjectService, RasterLayer, Unit} from 'wave-core';

@Component({
    selector: 'wave-app-mock-layers',
    templateUrl: './mock-layers.component.html',
    styleUrls: ['./mock-layers.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MockLayersComponent implements OnInit {

    constructor(private projectService: ProjectService) {
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
                }));
            })
        ).subscribe(() => console.log('added raster'));
    }
}
