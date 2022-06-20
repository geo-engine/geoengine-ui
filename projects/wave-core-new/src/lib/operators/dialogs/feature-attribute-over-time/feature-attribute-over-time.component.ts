import {Component, ChangeDetectionStrategy, AfterViewInit, OnDestroy} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';

import {ProjectService} from '../../../project/project.service';
import {ResultTypes} from '../../result-type.model';
import {Layer, VectorLayer} from '../../../layers/layer.model';
import {of, ReplaySubject, Subscription} from 'rxjs';
import {WorkflowDict} from '../../../backend/backend.model';
import {map, mergeMap, tap} from 'rxjs/operators';
import {Plot} from '../../../plots/plot.model';
import {NotificationService} from '../../../notification.service';
import {VectorLayerMetadata} from '../../../layers/layer-metadata.model';
import {VectorColumnDataTypes} from '../../datatype.model';
import {WaveValidators} from '../../../util/form.validators';
import {FeatureAttributeOverTimeDict} from '../../../backend/operator.model';

interface AttributeCandidates {
    id: Array<string>;
    value: Array<string>;
}

@Component({
    selector: 'wave-feature-attribute-over-time',
    templateUrl: './feature-attribute-over-time.component.html',
    styleUrls: ['./feature-attribute-over-time.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureAttributeOvertimeComponent implements AfterViewInit, OnDestroy {
    inputTypes = ResultTypes.VECTOR_TYPES;

    attributes$ = new ReplaySubject<AttributeCandidates>(1);

    readonly subscriptions: Array<Subscription> = [];

    form: FormGroup;

    constructor(
        private formBuilder: FormBuilder,
        private projectService: ProjectService,
        private notificationService: NotificationService,
    ) {
        this.form = this.formBuilder.group({
            name: ['', [Validators.required, WaveValidators.notOnlyWhitespace]],
            layer: [undefined, Validators.required],
            idAttribute: [undefined, Validators.required],
            valueAttribute: [undefined, Validators.required],
        });

        this.subscriptions.push(
            this.form.controls['layer'].valueChanges
                .pipe(
                    tap(() => {
                        this.form.controls['idAttribute'].setValue(undefined);
                        this.form.controls['valueAttribute'].setValue(undefined);
                    }),
                    mergeMap((layer: Layer) => {
                        if (layer instanceof VectorLayer) {
                            return this.projectService.getVectorLayerMetadata(layer).pipe(
                                map((metadata: VectorLayerMetadata) => {
                                    const candidates: AttributeCandidates = {
                                        id: [],
                                        value: [],
                                    };
                                    for (const [candidate, columnType] of metadata.dataTypes) {
                                        if (columnType === VectorColumnDataTypes.Int) {
                                            candidates.id.push(candidate);
                                            candidates.value.push(candidate);
                                        } else if (columnType === VectorColumnDataTypes.Float) {
                                            candidates.value.push(candidate);
                                        } else if (columnType === VectorColumnDataTypes.Text) {
                                            candidates.id.push(candidate);
                                        }
                                    }
                                    return candidates;
                                }),
                            );
                        } else {
                            return of({
                                id: [],
                                value: [],
                            });
                        }
                    }),
                )
                .subscribe((candidates: AttributeCandidates) => {
                    this.attributes$.next(candidates);
                }),
        );
    }

    add(): void {
        const inputLayer = this.form.controls['layer'].value as Layer;

        const idAttribute = this.form.controls['idAttribute'].value as string;
        const valueAttribute = this.form.controls['valueAttribute'].value as string;

        const outputName: string = this.form.controls['name'].value;

        this.projectService
            .getWorkflow(inputLayer.workflowId)
            .pipe(
                mergeMap((inputWorkflow: WorkflowDict) =>
                    this.projectService.registerWorkflow({
                        type: 'Plot',
                        operator: {
                            type: 'FeatureAttributeValuesOverTime',
                            params: {
                                idColumn: idAttribute,
                                valueColumn: valueAttribute,
                            },
                            sources: {
                                vector: inputWorkflow.operator,
                            },
                        } as FeatureAttributeOverTimeDict,
                    }),
                ),
                mergeMap((workflowId) =>
                    this.projectService.addPlot(
                        new Plot({
                            workflowId,
                            name: outputName,
                        }),
                    ),
                ),
            )
            .subscribe(
                () => {
                    // success
                },
                (error) => this.notificationService.error(error),
            );
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.form.updateValueAndValidity();
            this.form.controls['layer'].updateValueAndValidity();
        });
    }
}
