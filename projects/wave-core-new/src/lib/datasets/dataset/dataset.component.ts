import {Component, OnInit, ChangeDetectionStrategy, Input} from '@angular/core';
import {DataSet, getDataSetType} from '../dataset.model';
import {RasterLayer, VectorLayer} from '../../layers/layer.model';
import {MappingRasterSymbology, PointSymbology} from '../../layers/symbology/symbology.model';
import {Unit} from '../../operators/unit.model';
import {ProjectService} from '../../project/project.service';
import {mergeMap} from 'rxjs/operators';
import {RandomColorService} from '../../util/services/random-color.service';

@Component({
    selector: 'wave-dataset',
    templateUrl: './dataset.component.html',
    styleUrls: ['./dataset.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataSetComponent implements OnInit {

    @Input() dataset: DataSet;

    constructor(private projectService: ProjectService, private randomColorService: RandomColorService) {
    }

    ngOnInit(): void {
    }

    add() {
        const workflow = {
            type: getDataSetType(this.dataset),
            operator: {
                type: this.dataset.source_operator,
                params: {
                    data_set: this.dataset.id,
                },
            }
        };

        this.projectService.registerWorkflow(workflow).pipe(
            mergeMap(workflowId => {
                if (getDataSetType(this.dataset) === 'Raster') {
                    return this.projectService.addLayer(new RasterLayer({
                        workflowId,
                        name: this.dataset.name,
                        symbology: new MappingRasterSymbology({
                            opacity: 1,
                            // TODO: insert proper unit
                            unit: new Unit({
                                measurement: Unit.defaultUnit.measurement,
                                unit: Unit.defaultUnit.unit,
                                min: 1,
                                max: 255,
                                interpolation: Unit.defaultUnit.interpolation,
                            })
                        }),
                        isLegendVisible: false,
                        isVisible: true,
                    }));
                } else {
                    return this.projectService.addLayer(new VectorLayer({
                        workflowId,
                        name: this.dataset.name,
                        symbology: PointSymbology.createSymbology({
                            fillRGBA: this.randomColorService.getRandomColorRgba(),
                            radius: 10,
                            clustered: false,
                        }),
                        isLegendVisible: false,
                        isVisible: true,
                    }));
                }
            })
        ).subscribe(() => console.log('added raster'));
    }
}
