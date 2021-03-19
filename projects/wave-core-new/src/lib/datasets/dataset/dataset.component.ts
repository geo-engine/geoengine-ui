import {Component, OnInit, ChangeDetectionStrategy, Input} from '@angular/core';
import {DataSet, VectorResultDescriptor} from '../dataset.model';
import {RasterLayer, VectorLayer} from '../../layers/layer.model';
import {LineSymbology, PointSymbology, PolygonSymbology, RasterSymbology, Symbology} from '../../layers/symbology/symbology.model';
import {ProjectService} from '../../project/project.service';
import {mergeMap} from 'rxjs/operators';
import {RandomColorService} from '../../util/services/random-color.service';
import {VectorDataTypes} from '../../operators/datatype.model';
import {colorToDict} from '../../colors/color';

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

    add(): void {
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
                                symbology: RasterSymbology.fromRasterSymbologyDict({
                                    opacity: 1.0,
                                    colorizer: {
                                        LinearGradient: {
                                            breakpoints: [
                                                {value: 1, color: [0, 0, 0, 255]},
                                                {value: 255, color: [255, 255, 255, 255]},
                                            ],
                                            default_color: [0, 0, 0, 0],
                                            no_data_color: [0, 0, 0, 0],
                                        },
                                    },
                                }),
                                isLegendVisible: false,
                                isVisible: true,
                            }),
                        );
                    } else {
                        const resultDescriptor = this.dataset.result_descriptor as VectorResultDescriptor;

                        let symbology: Symbology;

                        switch (resultDescriptor.data_type) {
                            case VectorDataTypes.MultiPoint:
                                symbology = PointSymbology.fromPointSymbologyDict({
                                    clustered: false,
                                    radius: {Static: 10},
                                    stroke: {
                                        width: {Static: 1},
                                        color: {Static: [0, 0, 0, 255]},
                                    },
                                    fill_color: {Static: colorToDict(this.randomColorService.getRandomColorRgba())},
                                });
                                break;
                            case VectorDataTypes.MultiLineString:
                                symbology = LineSymbology.fromLineSymbologyDict({
                                    stroke: {
                                        width: {Static: 1},
                                        color: {Static: colorToDict(this.randomColorService.getRandomColorRgba())},
                                    },
                                });
                                break;
                            case VectorDataTypes.MultiPolygon:
                                symbology = PolygonSymbology.fromPolygonSymbologyDict({
                                    stroke: {width: {Static: 1}, color: {Static: [0, 0, 0, 255]}},
                                    fill_color: {Static: colorToDict(this.randomColorService.getRandomColorRgba())},
                                });
                                break;
                        }

                        return this.projectService.addLayer(
                            new VectorLayer({
                                workflowId,
                                name: this.dataset.name,
                                symbology,
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
