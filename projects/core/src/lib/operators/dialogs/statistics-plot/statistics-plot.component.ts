import {Component, ChangeDetectionStrategy, AfterViewInit, OnDestroy, ViewChild} from '@angular/core';
import {Validators, FormBuilder, FormControl, FormArray, FormGroup} from '@angular/forms';

import {ProjectService} from '../../../project/project.service';
import {geoengineValidators} from '../../../util/form.validators';
import {concat, Observable, of, ReplaySubject, Subscription} from 'rxjs';
import {map, mergeMap, tap} from 'rxjs/operators';
import {
    Layer,
    Plot,
    RasterLayer,
    ResultTypes,
    StatisticsDict,
    StatisticsParams,
    VectorColumnDataTypes,
    VectorLayer,
    VectorLayerMetadata,
} from '@geoengine/common';
import {TypedOperatorOperator} from '@geoengine/openapi-client';
import {LayerSelectionComponent} from '../helpers/layer-selection/layer-selection.component';
import {MultiLayerSelectionComponent} from '../helpers/multi-layer-selection/multi-layer-selection.component';

interface StatisticsPlotForm {
    layer: FormControl<Layer | null>;
    name: FormControl<string>;
    columnNames: FormArray<FormControl<string | null>>;
    additionalRasterLayers: FormControl<Array<RasterLayer> | null>;
}

/**
 * Checks whether the layer is a vector layer (points, lines, polygons).
 */
const isVectorLayer = (layer: Layer | null): boolean => {
    if (!layer) {
        return false;
    }
    return layer.layerType === 'vector';
};

/**
 * Checks whether the layer is a raster layer.
 */
const isRasterLayer = (layer: Layer | null): boolean => {
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
export class StatisticsPlotComponent implements AfterViewInit, OnDestroy {
    readonly allowedLayerTypes = ResultTypes.LAYER_TYPES;

    readonly RASTER_TYPE = [ResultTypes.RASTER];

    attributes$ = new ReplaySubject<Array<string>>(1);

    isVectorLayer$: Observable<boolean>;

    isRasterLayer$: Observable<boolean>;

    form: FormGroup<StatisticsPlotForm>;

    @ViewChild('layerSelection') layerSelection!: LayerSelectionComponent;
    @ViewChild('multiRasterSelection') multiRasterSelection: MultiLayerSelectionComponent | undefined;

    private subscriptions: Array<Subscription> = [];

    constructor(
        private formBuilder: FormBuilder,
        private projectService: ProjectService,
    ) {
        const layerControl = this.formBuilder.control<Layer | null>(null, Validators.required);
        this.form = this.formBuilder.group({
            layer: layerControl,
            name: this.formBuilder.nonNullable.control<string>('Statistics', [Validators.required, geoengineValidators.notOnlyWhitespace]),
            columnNames: this.formBuilder.array<string>(
                [],
                geoengineValidators.conditionalValidator(Validators.required, () => isVectorLayer(layerControl.value)),
            ),
            additionalRasterLayers: this.formBuilder.control<Array<RasterLayer> | null>(null), // new FormControl<Array<RasterLayer> | null>(null),
        });
        this.subscriptions.push(
            this.form.controls['layer'].valueChanges
                .pipe(
                    // reset
                    tap(() => {
                        this.columnNames.clear();
                        this.additionalRasterLayers.setValue(null);
                        if (isVectorLayer(layerControl.value)) {
                            this.addColumn();
                        }
                    }),
                    // get vector attributes or []
                    mergeMap((layer: Layer | null) => {
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
        this.isVectorLayer$ = this.form.controls['layer']?.valueChanges.pipe(map((layer) => isVectorLayer(layer)));
        this.isRasterLayer$ = this.form.controls['layer']?.valueChanges.pipe(map((layer) => isRasterLayer(layer)));
    }

    get columnNames(): FormArray<FormControl<string | null>> {
        return this.form.get('columnNames') as FormArray<FormControl<string | null>>;
    }

    get additionalRasterLayers(): FormControl<Array<RasterLayer> | null> {
        return this.form.get('additionalRasterLayers') as FormControl<Array<RasterLayer> | null>;
    }

    addColumn(): void {
        this.columnNames.push(this.formBuilder.control<string | null>(null, Validators.required));
    }

    removeColumn(i: number): void {
        this.columnNames.removeAt(i);
    }

    add(): void {
        const inputLayer = this.form.controls['layer'].value as Layer;

        const columnNames = this.columnNames.controls.map((fc) => (fc ? fc.value?.toString() : ''));

        const sources = [inputLayer] as Array<Layer>;

        if (inputLayer.layerType === 'raster') {
            const rasterLayers: Array<RasterLayer> | null = this.additionalRasterLayers.value;
            columnNames.push(inputLayer.name);
            rasterLayers?.forEach((value) => {
                sources.push(value);
                columnNames.push(value.name);
            });
        }

        concat(
            this.projectService.getAutomaticallyProjectedOperatorsFromLayers(sources).pipe(
                mergeMap((inputOperators: Array<TypedOperatorOperator>) =>
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
            ),
            this.layerSelection.deleteIfSelected(),
            this.multiRasterSelection ? this.multiRasterSelection.deleteIfSelected() : of(),
        ).subscribe();
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
