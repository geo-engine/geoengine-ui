import {Layer, VectorLayer} from '../../../layers/layer.model';
import {ResultTypes} from '../../result-type.model';
import {AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Observable, of, ReplaySubject, Subscription} from 'rxjs';
import {ProjectService} from '../../../project/project.service';
import {WaveValidators} from '../../../util/form.validators';
import {map, mergeMap, tap} from 'rxjs/operators';
import {Plot} from '../../../plots/plot.model';
import {NotificationService} from '../../../notification.service';
import {VectorLayerMetadata} from '../../../layers/layer-metadata.model';
import {OperatorParams, WorkflowDict} from '../../../backend/backend.model';

/**
 * Checks whether the layer is a vector layer (points, lines, polygons).
 */
const isVectorLayer = (layer: Layer): boolean => {
    if (!layer) {
        return false;
    }
    return layer.layerType === 'vector';
};

interface HistogramParams extends OperatorParams {
    column_name?: string;
    bounds:
        | {
              min: number;
              max: number;
          }
        | 'data';
    buckets?: number;
    interactive?: boolean;
}

/**
 * This dialog allows creating a histogram plot of a layer's values.
 */
@Component({
    selector: 'wave-histogram-operator',
    templateUrl: './histogram-operator.component.html',
    styleUrls: ['./histogram-operator.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistogramOperatorComponent implements OnInit, AfterViewInit, OnDestroy {
    inputTypes = ResultTypes.INPUT_TYPES;

    form: FormGroup;

    attributes$ = new ReplaySubject<Array<string>>(1);

    isVectorLayer$: Observable<boolean>;

    private subscriptions: Array<Subscription> = [];

    /**
     * DI for services
     */
    constructor(
        private readonly projectService: ProjectService,
        private readonly notificationService: NotificationService,
        private readonly formBuilder: FormBuilder,
    ) {}

    ngOnInit(): void {
        const layerControl = this.formBuilder.control(undefined, Validators.required);
        const rangeTypeControl = this.formBuilder.control('data', Validators.required);
        this.form = this.formBuilder.group({
            name: ['Filtered Values', [Validators.required, WaveValidators.notOnlyWhitespace]],
            layer: layerControl,
            attribute: [undefined, WaveValidators.conditionalValidator(Validators.required, () => isVectorLayer(layerControl.value))],
            rangeType: rangeTypeControl,
            range: this.formBuilder.group(
                {
                    min: [undefined],
                    max: [undefined],
                },
                {
                    validator: WaveValidators.conditionalValidator(
                        WaveValidators.minAndMax('min', 'max', {checkBothExist: true}),
                        () => rangeTypeControl.value === 'custom',
                    ),
                },
            ),
            autoBuckets: [true, Validators.required],
            numberOfBuckets: [20, Validators.required],
        });

        this.subscriptions.push(
            this.form.controls['layer'].valueChanges
                .pipe(
                    tap(() => this.form.controls['attribute'].setValue(undefined)),
                    mergeMap((layer: Layer) => {
                        if (layer instanceof VectorLayer) {
                            return this.projectService.getLayerMetadata(layer).pipe(
                                map((metadata: VectorLayerMetadata) =>
                                    metadata.columns
                                        .filter((columnType) => columnType.code === 'Number' || columnType.code === 'Decimal')
                                        .keySeq()
                                        .toList(),
                                ),
                            );
                        } else {
                            return of([]);
                        }
                    }),
                )
                .subscribe(this.attributes$),
        );

        this.subscriptions.push(
            this.form.controls['rangeType'].valueChanges.subscribe(() => this.form.controls['range'].updateValueAndValidity()),
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

        let range: {min: number; max: number} | string = this.form.controls['rangeType'].value as string;
        if (range === 'custom') {
            range = this.form.controls['range'].value as {min: number; max: number};
        }

        let buckets: number;
        if (!this.form.controls['autoBuckets'].value) {
            buckets = this.form.controls['numberOfBuckets'].value as number;
        }

        const outputName: string = this.form.controls['name'].value;

        this.projectService
            .getWorkflow(inputLayer.workflowId)
            .pipe(
                mergeMap((inputWorkflow: WorkflowDict) =>
                    this.projectService.registerWorkflow({
                        type: 'Plot',
                        operator: {
                            type: 'Histogram',
                            params: {
                                column_name: attributeName,
                                buckets,
                                bounds: range,
                            } as HistogramParams,
                            raster_sources: inputWorkflow.type === 'Raster' ? [inputWorkflow.operator] : [],
                            vector_sources: inputWorkflow.type === 'Vector' ? [inputWorkflow.operator] : [],
                        },
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
}
