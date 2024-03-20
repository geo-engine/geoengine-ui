import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {EMPTY, Subscription, combineLatest} from 'rxjs';
import {ProjectService} from '../../../project/project.service';
import {RandomColorService} from '../../../util/services/random-color.service';

import {mergeMap} from 'rxjs/operators';
import {NotificationService} from '../../../notification.service';
import {LetterNumberConverter} from '../helpers/multi-layer-selection/multi-layer-selection.component';
import {
    ColumnNamesDict,
    PointSymbology,
    RasterLayer,
    RasterLayerMetadata,
    RasterVectorJoinDict,
    RasterVectorJoinParams,
    ResultTypes,
    StaticColor,
    VectorLayer,
    geoengineValidators,
} from '@geoengine/common';

type TemporalAggregation = 'none' | 'first' | 'mean';
type FeatureAggregation = 'first' | 'mean';

interface RasterVectorJoinForm {
    vectorLayer: FormControl<VectorLayer | undefined>;
    rasterLayers: FormControl<Array<RasterLayer> | undefined>;
    columnNamesType: FormControl<ColumnNames>;
    columnNamesValues: FormArray<FormControl<string>>;
    temporalAggregation: FormControl<TemporalAggregation>;
    temporalAggregationIgnoreNodata: FormControl<boolean>;
    featureAggregation: FormControl<FeatureAggregation>;
    featureAggregationIgnoreNodata: FormControl<boolean>;
    name: FormControl<string>;
}

enum ColumnNames {
    Default,
    Suffix,
    Names,
}

@Component({
    selector: 'geoengine-raster-vector-join',
    templateUrl: './raster-vector-join.component.html',
    styleUrls: ['./raster-vector-join.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RasterVectorJoinComponent implements OnDestroy {
    minNumberOfRasterInputs = 1;
    maxNumberOfRasterInputs = 8;
    allowedVectorTypes = [ResultTypes.POINTS, ResultTypes.POLYGONS];
    allowedRasterTypes = [ResultTypes.RASTER];

    ColumnNames = ColumnNames;

    form: FormGroup<RasterVectorJoinForm>;

    private rasterLayerMetadata: Array<RasterLayerMetadata> = [];

    private subscriptions: Array<Subscription> = [];

    constructor(
        private readonly projectService: ProjectService,
        private readonly randomColorService: RandomColorService,
        private readonly notificationService: NotificationService,
        private readonly formBuilder: FormBuilder,
        private readonly changeDetectorRef: ChangeDetectorRef,
    ) {
        this.form = this.formBuilder.nonNullable.group({
            vectorLayer: new FormControl<VectorLayer | undefined>(undefined, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            rasterLayers: new FormControl<Array<RasterLayer> | undefined>(undefined, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            columnNamesType: new FormControl(ColumnNames.Default, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            columnNamesValues: new FormArray<FormControl<string>>([], {validators: geoengineValidators.duplicateInFormArrayValidator()}),
            temporalAggregation: ['none' as TemporalAggregation, Validators.required],
            temporalAggregationIgnoreNodata: [false, Validators.required],
            featureAggregation: ['first' as FeatureAggregation, Validators.required],
            featureAggregationIgnoreNodata: [false, Validators.required],
            name: ['Vectors With Raster Values', [Validators.required, geoengineValidators.notOnlyWhitespace]],
        });

        const rasterLayerSub = this.form.controls.rasterLayers.valueChanges
            .pipe(
                mergeMap((rasterLayers: Array<RasterLayer> | undefined) => {
                    if (!rasterLayers) {
                        return EMPTY;
                    }

                    const metaData = rasterLayers.map((l) => this.projectService.getRasterLayerMetadata(l));
                    return combineLatest(metaData);
                }),
            )
            .subscribe((rasterLayers: Array<RasterLayerMetadata>) => {
                this.rasterLayerMetadata = rasterLayers;
                this.updateColumnNamesType();
            });

        this.subscriptions.push(rasterLayerSub);
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }

    get columnNameValues(): FormArray {
        return this.form.get('columnNamesValues') as FormArray;
    }

    columnNameHint(i: number): string {
        switch (this.form.controls.columnNamesType.value) {
            case ColumnNames.Default:
                return '';
            case ColumnNames.Suffix:
                return `Suffix for input ${i}`;
            case ColumnNames.Names:
                return `New name for column ${i}`;
        }
    }

    updateColumnNamesType(): void {
        if (!this.form.controls.rasterLayers.value) {
            return;
        }

        const columnNamesValuesControl = this.form.controls.columnNamesValues;
        columnNamesValuesControl.clear();

        const columnNamesType = this.form.controls.columnNamesType.value;

        this.rasterLayerMetadata.forEach((layer, layerIndex) => {
            if (columnNamesType === ColumnNames.Suffix) {
                columnNamesValuesControl.push(
                    new FormControl(`_${layerIndex}`, {
                        nonNullable: true,
                    }),
                );
            } else if (columnNamesType === ColumnNames.Names) {
                layer.bands.forEach((band) => {
                    columnNamesValuesControl.push(
                        new FormControl(band.name, {
                            nonNullable: true,
                            validators: [Validators.required, geoengineValidators.notOnlyWhitespace],
                        }),
                    );
                });
            }
        });
    }

    getValueNameControls(): Array<FormControl> {
        const valueNames = this.form.get('valueNames');

        if (!valueNames || !(valueNames instanceof FormArray)) {
            return [];
        }

        return valueNames.controls as Array<FormControl>;
    }

    add(): void {
        const vectorLayer: VectorLayer | undefined = this.form.controls.vectorLayer.value;
        const rasterLayers: Array<RasterLayer> | undefined = this.form.controls.rasterLayers.value;
        if (!vectorLayer || !rasterLayers) {
            return;
        }
        const names = this.getColumnNames();
        const temporalAggregation: TemporalAggregation = this.form.controls.temporalAggregation.value;
        const temporalAggregationIgnoreNoData = this.form.controls.temporalAggregationIgnoreNodata.value;
        const featureAggregation: FeatureAggregation = this.form.controls.featureAggregation.value;
        const featureAggregationIgnoreNoData = this.form.controls.featureAggregationIgnoreNodata.value;
        const outputLayerName: string = this.form.controls['name'].value;
        const params: RasterVectorJoinParams = {
            names,
            temporalAggregation,
            temporalAggregationIgnoreNoData,
            featureAggregation,
            featureAggregationIgnoreNoData,
        };
        const sourceOperators = this.projectService.getAutomaticallyProjectedOperatorsFromLayers([vectorLayer, ...rasterLayers]);
        sourceOperators
            .pipe(
                mergeMap(([vectorOperator, ...rasterOperators]) =>
                    this.projectService.registerWorkflow({
                        type: 'Vector',
                        operator: {
                            type: 'RasterVectorJoin',
                            params,
                            sources: {
                                vector: vectorOperator,
                                rasters: rasterOperators,
                            },
                        } as RasterVectorJoinDict,
                    }),
                ),
                mergeMap((workflowId) =>
                    this.projectService.addLayer(
                        new VectorLayer({
                            workflowId,
                            name: outputLayerName,
                            symbology: this.symbologyWithNewColor(vectorLayer.symbology as PointSymbology),
                            isLegendVisible: false,
                            isVisible: true,
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

    toLetters(number: number): string {
        return LetterNumberConverter.toLetters(number);
    }

    private getColumnNames(): ColumnNamesDict {
        switch (this.form.controls.columnNamesType.value) {
            case ColumnNames.Default:
                return {
                    type: 'default',
                };
            case ColumnNames.Suffix:
                return {
                    type: 'suffix',
                    values: this.form.controls.columnNamesValues.value,
                };
            case ColumnNames.Names:
                return {
                    type: 'names',
                    values: this.form.controls.columnNamesValues.value,
                };
        }
    }

    private symbologyWithNewColor(inputSymbology: PointSymbology): PointSymbology {
        const symbology = inputSymbology.clone();

        // TODO: more sophisticated update method that makes sense for non-points
        symbology.fillColor = new StaticColor(this.randomColorService.getRandomColorRgba());

        return symbology;
    }
}
