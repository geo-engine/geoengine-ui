import {Component, ChangeDetectionStrategy} from '@angular/core';
import {RandomColorService} from '../../../util/services/random-color.service';
import {Layer, VectorLayer} from '../../../layers/layer.model';
import {ResultTypes} from '../../result-type.model';
import {PointSymbology} from '../../../layers/symbology/symbology.model';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {WaveValidators} from '../../../util/form.validators';
import {ProjectService} from '../../../project/project.service';
import {map, mergeMap} from 'rxjs/operators';
import {WorkflowDict} from '../../../backend/backend.model';
import {colorToDict} from '../../../colors/color';
import {PointInPolygonFilterDict} from '../../../backend/operator.model';

/**
 * This component allows creating the point in polygon filter operator.
 */
@Component({
    selector: 'wave-point-in-polygon-filter',
    templateUrl: './point-in-polygon-filter.component.html',
    styleUrls: ['./point-in-polygon-filter.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PointInPolygonFilterOperatorComponent {
    ResultTypes = ResultTypes;

    form: FormGroup;

    constructor(private randomColorService: RandomColorService, private projectService: ProjectService, private formBuilder: FormBuilder) {
        this.form = formBuilder.group({
            name: ['Filtered Values', [Validators.required, WaveValidators.notOnlyWhitespace]],
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
                                        symbology: PointSymbology.fromPointSymbologyDict({
                                            radius: {static: 10},
                                            stroke: {width: {static: 1}, color: {static: [0, 0, 0, 255]}},
                                            fillColor: {static: colorToDict(this.randomColorService.getRandomColorRgba())},
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
