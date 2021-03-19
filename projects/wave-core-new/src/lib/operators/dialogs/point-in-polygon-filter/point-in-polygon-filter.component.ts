import {Component, ChangeDetectionStrategy} from '@angular/core';
import {RandomColorService} from '../../../util/services/random-color.service';
import {Layer, VectorLayer} from '../../../layers/layer.model';
import {ResultTypes} from '../../result-type.model';
import {PointSymbology} from '../../../layers/symbology/symbology.model';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {WaveValidators} from '../../../util/form.validators';
import {ProjectService} from '../../../project/project.service';
import {zip} from 'rxjs';
import {map, mergeMap} from 'rxjs/operators';
import {WorkflowDict} from '../../../backend/backend.model';

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
        const points = this.form.controls['pointLayer'].value as Layer;
        const polygons = this.form.controls['polygonLayer'].value as Layer;

        const name: string = this.form.controls['name'].value;

        // TODO: add projection operator when the CRSs of points and polygons don't match
        zip(this.projectService.getWorkflow(points.workflowId), this.projectService.getWorkflow(polygons.workflowId))
            .pipe(
                map(([a, b]) => {
                    const workflow = {
                        type: 'Vector',
                        operator: {
                            type: 'PointInPolygonFilter',
                            params: null,
                            raster_sources: [],
                            vector_sources: [a.operator, b.operator],
                        },
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
                                            clustered: false,
                                            radius: {Static: 10},
                                            stroke: {width: {Static: 10}, color: {Static: [0, 0, 0, 0]}},
                                            fill_color: {Static: [0, 0, 0, 0]},
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
