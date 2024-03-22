import {AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy} from '@angular/core';
import {AbstractControl, AsyncValidatorFn, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';
import {Observable, of, ReplaySubject, Subscription, first} from 'rxjs';
import {ProjectService} from '../../../project/project.service';

import {map, mergeMap, tap} from 'rxjs/operators';
import {NotificationService} from '../../../notification.service';
import {
    ClassHistogramDict,
    ClassHistogramParams,
    ClassificationMeasurement,
    Layer,
    Plot,
    RasterLayer,
    ResultTypes,
    VectorColumnDataTypes,
    VectorLayer,
    VectorLayerMetadata,
    geoengineValidators,
} from '@geoengine/common';
import {Workflow as WorkflowDict} from '@geoengine/openapi-client';

/**
 * Checks whether the layer is a vector layer (points, lines, polygons).
 */
const isVectorLayer = (layer: Layer): boolean => {
    if (!layer) {
        return false;
    }
    return layer.layerType === 'vector';
};

/**
 * Checks whether the input is categorical
 */
const categoricalInputValidator =
    (projectService: ProjectService, attributeControl: UntypedFormControl): AsyncValidatorFn =>
    (control: AbstractControl): Observable<{nonCategorical: true} | {onlyWhitespace: true} | null> => {
        const layer: Layer | undefined = control.value;

        if (!layer) {
            return of(null);
        }

        if (layer instanceof RasterLayer) {
            return projectService.getRasterLayerMetadata(layer).pipe(
                first(),
                map((metadata) => {
                    const allBandsAreClassification = metadata.bands.every((band) => band instanceof ClassificationMeasurement);
                    if (allBandsAreClassification) {
                        return null;
                    } else {
                        return {nonCategorical: true};
                    }
                }),
            );
        } else if (layer instanceof VectorLayer) {
            const attributeName: string | undefined = attributeControl.value;

            if (!attributeName) {
                return of({onlyWhitespace: true});
            }

            return projectService.getVectorLayerMetadata(layer).pipe(
                first(),
                map((metadata) => {
                    const measurement = metadata.measurements.get(attributeName);

                    if (!measurement) {
                        return {onlyWhitespace: true};
                    }

                    if (measurement instanceof ClassificationMeasurement) {
                        return null;
                    } else {
                        return {nonCategorical: true};
                    }
                }),
            );
        } else {
            throw Error('unexpected iput layer variant');
        }
    };

/**
 * This dialog allows creating a class histogram plot of a layer's values.
 */
@Component({
    selector: 'geoengine-class-histogram-operator',
    templateUrl: './class-histogram-operator.component.html',
    styleUrls: ['./class-histogram-operator.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassHistogramOperatorComponent implements AfterViewInit, OnDestroy {
    inputTypes = ResultTypes.INPUT_TYPES;

    form: UntypedFormGroup;

    attributes$ = new ReplaySubject<Array<string>>(1);

    isVectorLayer$: Observable<boolean>;

    private subscriptions: Array<Subscription> = [];

    /**
     * DI for services
     */
    constructor(
        private readonly projectService: ProjectService,
        private readonly notificationService: NotificationService,
        private readonly formBuilder: UntypedFormBuilder,
    ) {
        const layerControl = this.formBuilder.control(undefined, Validators.required);
        this.form = this.formBuilder.group({
            name: ['Filtered Values', [Validators.required, geoengineValidators.notOnlyWhitespace]],
            layer: layerControl,
            attribute: [undefined, geoengineValidators.conditionalValidator(Validators.required, () => isVectorLayer(layerControl.value))],
        });

        layerControl.addAsyncValidators(categoricalInputValidator(projectService, this.form.controls['attribute'] as UntypedFormControl));

        // TODO: add check if categorical

        this.subscriptions.push(
            this.form.controls['layer'].valueChanges
                .pipe(
                    tap(() => this.form.controls['attribute'].setValue(undefined)),
                    mergeMap((layer: Layer) => {
                        if (layer instanceof VectorLayer) {
                            return this.projectService.getVectorLayerMetadata(layer).pipe(
                                map((metadata: VectorLayerMetadata) =>
                                    metadata.dataTypes
                                        .filter(
                                            (columnType) =>
                                                columnType === VectorColumnDataTypes.Float ||
                                                columnType === VectorColumnDataTypes.Int ||
                                                columnType === VectorColumnDataTypes.Category,
                                        )
                                        .keySeq()
                                        .toArray(),
                                ),
                            );
                        } else {
                            return of([]);
                        }
                    }),
                )
                .subscribe((attributes) => this.attributes$.next(attributes)),
        );

        this.subscriptions.push(
            this.form.controls['attribute'].valueChanges.subscribe({
                next: (value) => {
                    if (!value) {
                        return;
                    }

                    // trigger `categoricalInputValidator`
                    layerControl.updateValueAndValidity({
                        // don't traverse tree
                        onlySelf: true,
                        // don't trigger resetting attributes on layer change
                        emitEvent: false,
                    });
                },
            }),
        );

        this.isVectorLayer$ = this.form.controls['layer'].valueChanges.pipe(map((layer) => isVectorLayer(layer)));
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.form.updateValueAndValidity();
            this.form.controls['layer'].updateValueAndValidity();
        });
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }

    /**
     * Uses the user input to create a histogram plot.
     * The plot is added to the plot view.
     */
    add(): void {
        const inputLayer = this.form.controls['layer'].value as Layer;

        const attributeName = this.form.controls['attribute'].value as string;

        const outputName: string = this.form.controls['name'].value;

        this.projectService
            .getWorkflow(inputLayer.workflowId)
            .pipe(
                mergeMap((inputWorkflow: WorkflowDict) =>
                    this.projectService.registerWorkflow({
                        type: 'Plot',
                        operator: {
                            type: 'ClassHistogram',
                            params: {
                                columnName: attributeName,
                            } as ClassHistogramParams,
                            sources: {
                                source: inputWorkflow.operator,
                            },
                        } as ClassHistogramDict,
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
            .subscribe({
                next: () => {
                    // success
                },
                error: (error) => this.notificationService.error(error),
            });
    }
}
