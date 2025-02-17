import {AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, UntypedFormArray, Validators, UntypedFormControl} from '@angular/forms';
import {Observable, of, ReplaySubject, Subscription} from 'rxjs';
import {ProjectService} from '../../../project/project.service';

import {map, mergeMap, tap} from 'rxjs/operators';
import {
    BoxPlotDict,
    BoxPlotParams,
    Layer,
    NotificationService,
    Plot,
    RasterLayer,
    ResultTypes,
    VectorColumnDataTypes,
    VectorLayer,
    VectorLayerMetadata,
    geoengineValidators,
} from '@geoengine/common';
import {TypedOperatorOperator} from '@geoengine/openapi-client';

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

/**
 * This dialog allows creating a box plot of a layer's values.
 */
@Component({
    selector: 'geoengine-boxplot-operator',
    templateUrl: './boxplot-operator.component.html',
    styleUrls: ['./boxplot-operator.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class BoxPlotOperatorComponent implements AfterViewInit, OnDestroy {
    readonly inputTypes = ResultTypes.INPUT_TYPES;

    readonly RASTER_TYPE = [ResultTypes.RASTER];

    form: UntypedFormGroup;

    attributes$ = new ReplaySubject<Array<string>>(1);

    isVectorLayer$: Observable<boolean>;

    isRasterLayer$: Observable<boolean>;

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
            columnNames: this.formBuilder.array(
                [],
                geoengineValidators.conditionalValidator(Validators.required, () => isVectorLayer(layerControl.value)),
            ),
            additionalRasterLayers: new UntypedFormControl(undefined),
        });

        this.subscriptions.push(
            this.form.controls['layer'].valueChanges
                .pipe(
                    tap(() => {
                        this.columnNames.clear();
                        this.additionalRasterLayers.setValue(undefined);
                        if (isVectorLayer(layerControl.value)) {
                            this.addColumn();
                        }
                    }),
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
                .subscribe((attributes) => this.attributes$.next(attributes)),
        );
        this.isVectorLayer$ = this.form.controls['layer'].valueChanges.pipe(map((layer) => isVectorLayer(layer)));
        this.isRasterLayer$ = this.form.controls['layer'].valueChanges.pipe(map((layer) => isRasterLayer(layer)));
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

    get additionalRasterLayers(): UntypedFormControl {
        return this.form.get('additionalRasterLayers') as UntypedFormControl;
    }

    rasterInputNaming(_idx: number): string {
        return 'Input';
    }

    get columnNames(): UntypedFormArray {
        return this.form.get('columnNames') as UntypedFormArray;
    }

    addColumn(): void {
        this.columnNames.push(this.formBuilder.control(undefined, Validators.required));
    }

    removeColumn(i: number): void {
        this.columnNames.removeAt(i);
    }

    /**
     * Uses the user input to create a box plot.
     * The plot is added to the plot view.
     */
    add(): void {
        const inputLayer = this.form.controls['layer'].value as Layer;

        const columnNames = this.columnNames.controls.map((fc) => fc.value.toString());

        const outputName: string = this.form.controls['name'].value;

        const sources = [inputLayer] as Array<Layer>;

        if (inputLayer.layerType === 'raster') {
            const rasterLayers: Array<RasterLayer> = this.form.controls['additionalRasterLayers'].value;
            columnNames.push(inputLayer.name);
            rasterLayers.forEach((value) => {
                sources.push(value);
                columnNames.push(value.name);
            });
        }

        this.projectService
            .getAutomaticallyProjectedOperatorsFromLayers(sources)
            .pipe(
                mergeMap((inputOperators: Array<TypedOperatorOperator>) =>
                    this.projectService.registerWorkflow({
                        type: 'Plot',
                        operator: {
                            type: 'BoxPlot',
                            params: {
                                columnNames,
                            } as BoxPlotParams,
                            sources: {
                                source: isVectorLayer(inputLayer) ? inputOperators[0] : inputOperators,
                            },
                        } as BoxPlotDict,
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
