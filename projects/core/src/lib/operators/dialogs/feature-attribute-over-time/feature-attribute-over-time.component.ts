import {Component, ChangeDetectionStrategy, AfterViewInit, OnDestroy, ViewChild} from '@angular/core';
import {UntypedFormGroup, UntypedFormBuilder, Validators} from '@angular/forms';

import {ProjectService} from '../../../project/project.service';
import {concat, of, ReplaySubject, Subscription} from 'rxjs';
import {map, mergeMap, tap} from 'rxjs/operators';
import {NotificationService} from '../../../notification.service';
import {geoengineValidators} from '../../../util/form.validators';
import {
    FeatureAttributeOverTimeDict,
    Layer,
    Plot,
    ResultTypes,
    VectorColumnDataTypes,
    VectorLayer,
    VectorLayerMetadata,
} from '@geoengine/common';
import {Workflow as WorkflowDict} from '@geoengine/openapi-client';
import {LayerSelectionComponent} from '../helpers/layer-selection/layer-selection.component';

interface AttributeCandidates {
    id: Array<string>;
    value: Array<string>;
}

@Component({
    selector: 'geoengine-feature-attribute-over-time',
    templateUrl: './feature-attribute-over-time.component.html',
    styleUrls: ['./feature-attribute-over-time.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureAttributeOvertimeComponent implements AfterViewInit, OnDestroy {
    inputTypes = ResultTypes.VECTOR_TYPES;

    attributes$ = new ReplaySubject<AttributeCandidates>(1);

    readonly subscriptions: Array<Subscription> = [];

    form: UntypedFormGroup;

    @ViewChild('layerSelection') layerSelection!: LayerSelectionComponent;

    constructor(
        private formBuilder: UntypedFormBuilder,
        private projectService: ProjectService,
        private notificationService: NotificationService,
    ) {
        this.form = this.formBuilder.group({
            name: ['', [Validators.required, geoengineValidators.notOnlyWhitespace]],
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

        concat(
            this.projectService.getWorkflow(inputLayer.workflowId).pipe(
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
            ),
            this.layerSelection.deleteIfSelected(),
        ).subscribe(
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
