import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {ResultTypes} from '../../result-type.model';
import {RasterLayer, VectorLayer} from '../../../layers/layer.model';
import {ProjectService} from '../../../project/project.service';
import {RandomColorService} from '../../../util/services/random-color.service';
import {geoengineValidators} from '../../../util/form.validators';
import {filter, map, mergeMap} from 'rxjs/operators';
import {NotificationService} from '../../../notification.service';
import {LetterNumberConverter} from '../helpers/multi-layer-selection/multi-layer-selection.component';
import {VectorLayerMetadata} from '../../../layers/layer-metadata.model';
import {PointSymbology, StaticColor} from '../../../layers/symbology/symbology.model';
import {RasterVectorJoinDict, RasterVectorJoinParams} from '../../../backend/operator.model';

type TemporalAggregation = 'none' | 'first' | 'mean';
type FeatureAggregation = 'first' | 'mean';

interface RasterVectorJoinForm {
    vectorLayer: FormControl<VectorLayer | undefined>;
    rasterLayers: FormControl<Array<RasterLayer> | undefined>;
    valueNames: FormArray<FormControl<string>>;
    temporalAggregation: FormControl<TemporalAggregation>;
    temporalAggregationIgnoreNodata: FormControl<boolean>;
    featureAggregation: FormControl<FeatureAggregation>;
    featureAggregationIgnoreNodata: FormControl<boolean>;
    name: FormControl<string>;
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

    form: FormGroup<RasterVectorJoinForm>;

    private vectorColumns: Array<string> = [];
    private valueNameUserChanges: Array<boolean> = [];

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
            valueNames: this.formBuilder.nonNullable.array<FormControl<string>>([]),
            temporalAggregation: ['none' as TemporalAggregation, Validators.required],
            temporalAggregationIgnoreNodata: [false, Validators.required],
            featureAggregation: ['first' as FeatureAggregation, Validators.required],
            featureAggregationIgnoreNodata: [false, Validators.required],
            name: ['Vectors With Raster Values', [Validators.required, geoengineValidators.notOnlyWhitespace]],
        });

        this.setupNameValidation();
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
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

        const valueNames: Array<string> = this.form.controls.valueNames.value;
        const temporalAggregation: TemporalAggregation = this.form.controls.temporalAggregation.value;
        const temporalAggregationIgnoreNoData = this.form.controls.temporalAggregationIgnoreNodata.value;
        const featureAggregation: FeatureAggregation = this.form.controls.featureAggregation.value;
        const featureAggregationIgnoreNoData = this.form.controls.featureAggregationIgnoreNodata.value;

        const outputLayerName: string = this.form.controls['name'].value;

        const params: RasterVectorJoinParams = {
            names: valueNames,
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

    private reCheckValueNames(): void {
        setTimeout(() => {
            const valueNames = this.form.controls['valueNames'];
            valueNames.controls.forEach((control) => {
                control.updateValueAndValidity({
                    onlySelf: false,
                    emitEvent: false,
                });
            });
            this.changeDetectorRef.markForCheck();
        });
    }

    private setupNameValidation(): void {
        const vectorLayerSubscription = this.form.controls['vectorLayer'].valueChanges
            .pipe(
                filter((vectorLayer): vectorLayer is VectorLayer => !!vectorLayer),
                mergeMap((vectorLayer: VectorLayer) => this.projectService.getLayerMetadata(vectorLayer)),
                map((metadata) => {
                    if (!(metadata instanceof VectorLayerMetadata)) {
                        throw Error('expected to get vector metadata');
                    }

                    return metadata.dataTypes.keySeq().toArray();
                }),
            )
            .subscribe((columns) => {
                this.vectorColumns = columns;
                this.reCheckValueNames();
            });
        this.subscriptions.push(vectorLayerSubscription);

        // update valueNames
        const rasterLayersSubscription = this.form.controls['rasterLayers'].valueChanges.subscribe((rasters) => {
            if (!rasters) {
                return;
            }

            const valueNames = this.form.controls['valueNames'];

            if (valueNames.length > rasters.length) {
                // remove name fields
                for (let i = rasters.length; i < valueNames.length; i++) {
                    valueNames.removeAt(i);
                    this.valueNameUserChanges.splice(i, 1);
                }
            } else if (valueNames.length < rasters.length) {
                // add name fields
                for (let i = valueNames.length; i < rasters.length; i++) {
                    const control = this.formBuilder.nonNullable.control(
                        rasters[i].name,
                        Validators.compose([Validators.required, this.valueNameCollision(this.form.controls['valueNames'] as FormArray)]),
                    );
                    valueNames.push(control);
                    this.valueNameUserChanges.push(false);

                    this.subscriptions.push(
                        control.valueChanges.subscribe((valueName) => {
                            const rasterName = rasters[i].name;
                            if (valueName !== rasterName) {
                                this.valueNameUserChanges[i] = true;
                            }

                            this.reCheckValueNames();
                        }),
                    );
                }
            } else {
                // update names if not changed by user
                for (let i = 0; i < rasters.length; i++) {
                    if (!this.valueNameUserChanges[i]) {
                        (valueNames.at(i) as FormControl).setValue(rasters[i].name, {emitEvent: false});
                    }
                }
            }

            this.reCheckValueNames();
        });
        this.subscriptions.push(rasterLayersSubscription);
    }

    /**
     * Checks for collisions of value name.
     * Uses `startsWith` semantics.
     */
    private valueNameCollision(valueNames: FormArray) {
        return (control: FormControl): {[key: string]: boolean | undefined} | null => {
            const errors: {
                duplicateName?: boolean;
            } = {};

            const valueName: string = control.value;

            let duplicates = -1; // subtracting self

            for (const otherValueName of valueNames.value as Array<string>) {
                if (otherValueName === valueName) {
                    duplicates++;
                }
            }

            if (duplicates < 1) {
                // check for conflicts with extisting column in input
                for (const otherValueName of this.vectorColumns) {
                    if (otherValueName === valueName) {
                        duplicates++;
                        break;
                    }
                }
            }

            if (duplicates > 0) {
                errors.duplicateName = true;
            }

            return Object.keys(errors).length > 0 ? errors : null;
        };
    }

    private symbologyWithNewColor(inputSymbology: PointSymbology): PointSymbology {
        const symbology = inputSymbology.clone();

        // TODO: more sophisticated update method that makes sense for non-points
        symbology.fillColor = new StaticColor(this.randomColorService.getRandomColorRgba());

        return symbology;
    }
}
