import {Component, OnInit, ChangeDetectionStrategy, Input} from '@angular/core';
import {DataSet} from '../dataset.model';
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
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataSetComponent implements OnInit {
    @Input() dataset: DataSet;

    constructor(private projectService: ProjectService, private randomColorService: RandomColorService) {}

    ngOnInit(): void {}

    add() {
        const workflow = this.dataset.createSourceWorkflow();

        this.projectService
            .registerWorkflow(workflow)
            .pipe(
                mergeMap((workflowId) => {
                    if (this.dataset.result_descriptor.getTypeString() === 'Raster') {
                        return this.projectService.addLayer(
                            new RasterLayer({
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
                                    }),
                                }),
                                isLegendVisible: false,
                                isVisible: true,
                            }),
                        );
                    } else {
                        return this.projectService.addLayer(
                            new VectorLayer({
                                workflowId,
                                name: this.dataset.name,
                                symbology: PointSymbology.createSymbology({
                                    fillRGBA: this.randomColorService.getRandomColorRgba(),
                                    radius: 10,
                                    clustered: false,
                                }),
                                isLegendVisible: false,
                                isVisible: true,
                            }),
                        );
                    }
                }),
            )
            .subscribe();
    }
}
