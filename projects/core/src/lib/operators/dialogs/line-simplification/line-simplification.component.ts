import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {geoengineValidators} from '../../../util/form.validators';
import {ProjectService} from '../../../project/project.service';
import {mergeMap} from 'rxjs/operators';
import {WorkflowDict} from '../../../backend/backend.model';
import {BehaviorSubject} from 'rxjs';
import {NotificationService} from '../../../notification.service';
import {Layer, LineSimplificationDict, ResultTypes, VectorLayer} from '@geoengine/common';

interface LineSimplificationForm {
    name: FormControl<string>;
    layer: FormControl<Layer | undefined>;
    algorithm: FormControl<'douglasPeucker' | 'visvalingam'>;
    epsilon: FormControl<number | undefined>;
}

/**
 * This component allows creating the line simplification operator.
 */
@Component({
    selector: 'geoengine-line-simplification',
    templateUrl: './line-simplification.component.html',
    styleUrls: ['./line-simplification.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LineSimplificationComponent implements OnInit {
    selected = new FormControl(0, {validators: [Validators.required], nonNullable: true});

    readonly inputTypes = [ResultTypes.LINES, ResultTypes.POLYGONS];

    readonly form: FormGroup<LineSimplificationForm>;

    readonly loading$ = new BehaviorSubject<boolean>(false);

    constructor(
        private readonly projectService: ProjectService,
        private readonly notificationService: NotificationService,
        private readonly formBuilder: FormBuilder,
    ) {
        this.form = new FormGroup<LineSimplificationForm>({
            name: this.formBuilder.nonNullable.control<string>('', [Validators.required, geoengineValidators.notOnlyWhitespace]),
            layer: this.formBuilder.nonNullable.control<Layer | undefined>(undefined, [Validators.required]),
            algorithm: this.formBuilder.nonNullable.control<'douglasPeucker' | 'visvalingam'>('douglasPeucker', [Validators.required]),
            epsilon: this.formBuilder.nonNullable.control<number | undefined>(1.0, [geoengineValidators.largerThan(0)]),
        });
    }

    ngOnInit(): void {
        // Necessary for having an emitted value for the layer, which is used for the name suggestion in the template
        setTimeout(() => {
            this.form.controls.layer.updateValueAndValidity();
        });
    }

    epsilonChecked(autoEpsilon: boolean): void {
        if (autoEpsilon) {
            this.form.controls.epsilon.setValue(undefined);
        } else {
            this.form.controls.epsilon.setValue(1.0);
        }
    }

    add(): void {
        if (this.loading$.value) {
            return; // don't add while loading
        }

        const vectorLayer = this.form.controls.layer.value as VectorLayer;
        const layerName: string = this.form.controls.name.value;
        const algorithm: 'douglasPeucker' | 'visvalingam' = this.form.controls.algorithm.value;
        const epsilon: number | undefined = this.form.controls.epsilon.value;

        this.loading$.next(true);

        this.projectService
            .getWorkflow(vectorLayer.workflowId)
            .pipe(
                mergeMap((sourceWorkflow) => {
                    const workflow: WorkflowDict = {
                        type: 'Vector',
                        operator: {
                            type: 'LineSimplification',
                            params: {
                                algorithm,
                                epsilon,
                            },
                            sources: {
                                vector: sourceWorkflow.operator,
                            },
                        } as LineSimplificationDict,
                    } as WorkflowDict;
                    return this.projectService.registerWorkflow(workflow);
                }),
                mergeMap((workflowId) =>
                    this.projectService.addLayer(
                        new VectorLayer({
                            workflowId,
                            name: layerName,
                            symbology: vectorLayer.symbology,
                            isLegendVisible: false,
                            isVisible: true,
                        }),
                    ),
                ),
            )
            .subscribe({
                next: () => {
                    // success
                    this.loading$.next(false);
                },
                error: (error) => {
                    this.notificationService.error(error);
                    this.loading$.next(false);
                },
            });
    }
}
