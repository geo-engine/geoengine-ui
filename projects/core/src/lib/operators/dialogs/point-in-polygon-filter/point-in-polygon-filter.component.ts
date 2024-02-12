import {Component, ChangeDetectionStrategy} from '@angular/core';
import {RandomColorService} from '../../../util/services/random-color.service';
import {UntypedFormGroup, UntypedFormBuilder, Validators} from '@angular/forms';
import {geoengineValidators} from '../../../util/form.validators';
import {ProjectService} from '../../../project/project.service';
import {map, mergeMap} from 'rxjs/operators';
import {WorkflowDict} from '../../../backend/backend.model';
import {PointInPolygonFilterDict} from '../../../backend/operator.model';
import {ClusteredPointSymbology, Layer, PointSymbology, ResultTypes, VectorLayer, colorToDict} from '@geoengine/common';

/**
 * This component allows creating the point in polygon filter operator.
 */
@Component({
    selector: 'geoengine-point-in-polygon-filter',
    templateUrl: './point-in-polygon-filter.component.html',
    styleUrls: ['./point-in-polygon-filter.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PointInPolygonFilterOperatorComponent {
    ResultTypes = ResultTypes;

    form: UntypedFormGroup;

    constructor(
        private randomColorService: RandomColorService,
        private projectService: ProjectService,
        private formBuilder: UntypedFormBuilder,
    ) {
        this.form = formBuilder.group({
            name: ['Filtered Values', [Validators.required, geoengineValidators.notOnlyWhitespace]],
            pointLayer: [undefined, Validators.required],
            polygonLayer: [undefined, Validators.required],
        });
    }

    add(): void {
        const pointsLayer = this.form.controls['pointLayer'].value as Layer;
        const polygonsLayer = this.form.controls['polygonLayer'].value as Layer;

        const name: string = this.form.controls['name'].value;

        const sourceOperators = this.projectService.getAutomaticallyProjectedOperatorsFromLayers([pointsLayer, polygonsLayer]);

        sourceOperators
            .pipe(
                map(([points, polygons]) => {
                    const workflow = {
                        type: 'Vector',
                        operator: {
                            type: 'PointInPolygonFilter',
                            params: {},
                            sources: {
                                points,
                                polygons,
                            },
                        } as PointInPolygonFilterDict,
                    } as WorkflowDict;

                    this.projectService
                        .registerWorkflow(workflow)
                        .pipe(
                            mergeMap((workflowId) =>
                                this.projectService.addLayer(
                                    new VectorLayer({
                                        workflowId,
                                        name,
                                        symbology: ClusteredPointSymbology.fromPointSymbologyDict({
                                            type: 'point',
                                            radius: {
                                                type: 'static',
                                                value: PointSymbology.DEFAULT_POINT_RADIUS,
                                            },
                                            stroke: {
                                                width: {
                                                    type: 'static',
                                                    value: 1,
                                                },
                                                color: {
                                                    type: 'static',
                                                    color: [0, 0, 0, 255],
                                                },
                                            },
                                            fillColor: {
                                                type: 'static',
                                                color: colorToDict(this.randomColorService.getRandomColorRgba()),
                                            },
                                        }),
                                        isLegendVisible: false,
                                        isVisible: true,
                                    }),
                                ),
                            ),
                        )
                        .subscribe();
                }),
            )
            .subscribe();
    }
}
