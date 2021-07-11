import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {FormGroup, FormControl, Validators} from '@angular/forms';
import {GeoEngineError, RasterResultDescriptorDict, UUID, VectorResultDescriptorDict} from '../../backend/backend.model';
import {colorToDict} from '../../colors/color';
import {RasterLayer, VectorLayer} from '../../layers/layer.model';
import {LineSymbology, PointSymbology, PolygonSymbology, RasterSymbology, VectorSymbology} from '../../layers/symbology/symbology.model';
import {NotificationService} from '../../notification.service';
import {ProjectService} from '../../project/project.service';
import {isValidUuid} from '../../util/form.validators';
import {RandomColorService} from '../../util/services/random-color.service';

@Component({
    selector: 'wave-add-workflow',
    templateUrl: './add-workflow.component.html',
    styleUrls: ['./add-workflow.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddWorkflowComponent implements OnInit {
    readonly form: FormGroup;

    constructor(
        protected readonly projectService: ProjectService,
        protected readonly notificationService: NotificationService,
        protected readonly randomColorService: RandomColorService,
    ) {
        this.form = new FormGroup({
            layerName: new FormControl('New Layer', Validators.required),
            workflowId: new FormControl('', [Validators.required, isValidUuid]),
        });
    }

    ngOnInit(): void {}

    add(): void {
        const layerName: string = this.form.controls.layerName.value;
        const workflowId: UUID = this.form.controls.workflowId.value;

        this.projectService.getWorkflowMetaData(workflowId).subscribe(
            (resultDescriptorDict) => {
                const keys = Object.keys(resultDescriptorDict);

                if (keys.includes('columns')) {
                    this.addVectorLayer(layerName, workflowId, resultDescriptorDict as VectorResultDescriptorDict);
                } else if (keys.includes('measurement')) {
                    this.addRasterLayer(layerName, workflowId, resultDescriptorDict as RasterResultDescriptorDict);
                } else {
                    // TODO: implement plots, etc.
                    this.notificationService.error('Adding this workflow type is unimplemented, yet');
                }
            },
            (requestError) => this.handleError(requestError.error, workflowId),
        );
    }

    private addVectorLayer(layerName: string, workflowId: UUID, resultDescriptor: VectorResultDescriptorDict): void {
        const layer = new VectorLayer({
            name: layerName,
            workflowId,
            isVisible: true,
            isLegendVisible: false,
            symbology: this.createVectorSymbology(resultDescriptor.dataType),
        });

        this.projectService.addLayer(layer);
    }

    private createVectorSymbology(dataType: 'Data' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon'): VectorSymbology {
        switch (dataType) {
            case 'Data':
                // TODO: cope with that
                throw Error('we cannot add data layers here, yet');
            case 'MultiPoint':
                return PointSymbology.fromPointSymbologyDict({
                    type: 'point',
                    radius: {type: 'static', value: 10},
                    stroke: {
                        width: {type: 'static', value: 1},
                        color: {type: 'static', color: [0, 0, 0, 255]},
                    },
                    fillColor: {type: 'static', color: colorToDict(this.randomColorService.getRandomColorRgba())},
                });
            case 'MultiLineString':
                return LineSymbology.fromLineSymbologyDict({
                    type: 'line',
                    stroke: {
                        width: {type: 'static', value: 1},
                        color: {type: 'static', color: [0, 0, 0, 255]},
                    },
                });
            case 'MultiPolygon':
                return PolygonSymbology.fromPolygonSymbologyDict({
                    type: 'polygon',
                    stroke: {
                        width: {type: 'static', value: 1},
                        color: {type: 'static', color: [0, 0, 0, 255]},
                    },
                    fillColor: {type: 'static', color: colorToDict(this.randomColorService.getRandomColorRgba())},
                });
        }
    }

    private addRasterLayer(layerName: string, workflowId: UUID, _resultDescriptor: RasterResultDescriptorDict): void {
        const layer = new RasterLayer({
            name: layerName,
            workflowId,
            isVisible: true,
            isLegendVisible: false,
            symbology: RasterSymbology.fromRasterSymbologyDict({
                type: 'raster',
                opacity: 1.0,
                colorizer: {
                    type: 'linearGradient',
                    breakpoints: [
                        {value: 1, color: [0, 0, 0, 255]},
                        {value: 255, color: [255, 255, 255, 255]},
                    ],
                    defaultColor: [0, 0, 0, 0],
                    noDataColor: [0, 0, 0, 0],
                },
            }),
        });

        this.projectService.addLayer(layer);
    }

    private handleError(error: GeoEngineError, workflowId: UUID): void {
        let errorMessage = `No workflow found for id: ${workflowId}`;

        if (error.error !== 'NoWorkflowForGivenId') {
            errorMessage = `Unknown error -> ${error.error}: ${error.message}`;
        }

        this.notificationService.error(errorMessage);
    }
}
