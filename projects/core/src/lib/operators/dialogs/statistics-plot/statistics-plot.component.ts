import {Component, ChangeDetectionStrategy, AfterViewInit, OnDestroy, OnInit} from '@angular/core';
import {UntypedFormGroup, UntypedFormBuilder, Validators, UntypedFormControl, UntypedFormArray} from '@angular/forms';

import {ProjectService} from '../../../project/project.service';
import {geoengineValidators} from '../../../util/form.validators';
import {ResultTypes} from '../../result-type.model';
import {Layer, RasterLayer, VectorLayer} from '../../../layers/layer.model';
import {combineLatest, Observable, of, ReplaySubject, Subscription} from 'rxjs';
import {OperatorDict, SourceOperatorDict, WorkflowDict} from '../../../backend/backend.model';
import {map, mergeMap, tap} from 'rxjs/operators';
import {Plot} from '../../../plots/plot.model';
import {StatisticsDict, StatisticsParams} from '../../../backend/operator.model';
import {VectorLayerMetadata} from '../../../layers/layer-metadata.model';
import {VectorColumnDataTypes} from '../../datatype.model';

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
 * Checks whether the layer is a raster layer.
 */
const isRasterLayer = (layer: Layer): boolean => {
    if (!layer) {
        return false;
    }
    return layer.layerType === 'raster';
};

@Component({
    selector: 'geoengine-statistics-plot',
    templateUrl: './statistics-plot.component.html',
    styleUrls: ['./statistics-plot.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatisticsPlotComponent implements OnInit, AfterViewInit, OnDestroy {
    readonly allowedLayerTypes = ResultTypes.LAYER_TYPES;

    readonly RASTER_TYPE = [ResultTypes.RASTER];

    attributes$ = new ReplaySubject<Array<string>>(1);

    isVectorLayer$: Observable<boolean>;

    isRasterLayer$: Observable<boolean>;

    form: UntypedFormGroup;

    private subscriptions: Array<Subscription> = [];

    constructor(private formBuilder: UntypedFormBuilder, private projectService: ProjectService) {
        const layerControl = this.formBuilder.control(undefined, Validators.required);
        this.form = this.formBuilder.group({
            layer: layerControl,
            name: ['Statistics', [Validators.required, geoengineValidators.notOnlyWhitespace]],
            columnNames: this.formBuilder.array(
                [],
                geoengineValidators.conditionalValidator(Validators.required, () => isVectorLayer(layerControl.value)),
            ),
            additionalRasterLayers: new UntypedFormControl(undefined),
        });
        this.subscriptions.push(
            this.form.controls['layer'].valueChanges
                .pipe(
                    // reset
                    tap(() => {
                        this.columnNames.clear();
                        this.additionalRasterLayers.setValue(undefined);
                        if (isVectorLayer(layerControl.value)) {
                            this.addColumn();
                        }
                    }),
                    // get vector attributes or []
                    mergeMap((layer: Layer) => {
                        if (layer instanceof VectorLayer) {
                            return this.projectService.getVectorLayerMetadata(layer).pipe(
                                map((metadata: VectorLayerMetadata) =>
                                    metadata.dataTypes
                                        .filter(
                                            (columnType) =>
                                                columnType === VectorColumnDataTypes.Float || columnType === VectorColumnDataTypes.Int,
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
                .subscribe((attributes) => {
                    this.attributes$.next(attributes);
                }),
        );

        this.isVectorLayer$ = this.form.controls['layer'].valueChanges.pipe(map((layer) => isVectorLayer(layer)));
        this.isRasterLayer$ = this.form.controls['layer'].valueChanges.pipe(map((layer) => isRasterLayer(layer)));
    }

    ngOnInit(): void {}

    get columnNames(): UntypedFormArray {
        return this.form.get('columnNames') as UntypedFormArray;
    }

    get additionalRasterLayers(): UntypedFormControl {
        return this.form.get('additionalRasterLayers') as UntypedFormControl;
    }

    addColumn(): void {
        this.columnNames.push(this.formBuilder.control(undefined, Validators.required));
    }

    removeColumn(i: number): void {
        this.columnNames.removeAt(i);
    }

    add(): void {
        const inputLayer = this.form.controls['layer'].value as Layer;

        const columnNames = this.columnNames.controls.map((fc) => fc.value.toString());

        const sources = [inputLayer] as Array<Layer>;

        if (inputLayer.layerType === 'raster') {
            const rasterLayers: Array<RasterLayer> = this.additionalRasterLayers.value;
            columnNames.push(inputLayer.name);
            rasterLayers.forEach((value) => {
                sources.push(value);
                columnNames.push(value.name);
            });
        }

        const workflowObservables: Array<Observable<WorkflowDict>> = sources.map((l) => this.projectService.getWorkflow(l.workflowId));

        combineLatest(workflowObservables)
            .pipe(
                map((workflows: Array<WorkflowDict>) => {
                    const inputOperators: Array<OperatorDict | SourceOperatorDict> = workflows.map((workflow) => workflow.operator);
                    return inputOperators;
                }),
                mergeMap((inputOperators: Array<OperatorDict | SourceOperatorDict>) =>
                    this.projectService.registerWorkflow({
                        type: 'Plot',
                        operator: {
                            type: 'Statistics',
                            params: {
                                columnNames,
                            } as StatisticsParams,
                            sources: {
                                source: isVectorLayer(inputLayer) ? inputOperators[0] : inputOperators,
                            },
                        } as StatisticsDict,
                    }),
                ),
                mergeMap((workflowId) =>
                    this.projectService.addPlot(
                        new Plot({
                            workflowId,
                            name: this.form.controls['name'].value.toString(),
                        }),
                    ),
                ),
            )
            .subscribe();
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.form.updateValueAndValidity({
                onlySelf: false,
                emitEvent: true,
            });
            this.form.controls['layer'].updateValueAndValidity();
        });
    }
}
