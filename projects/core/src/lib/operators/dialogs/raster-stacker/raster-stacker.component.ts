import {AfterViewInit, ChangeDetectionStrategy, Component} from '@angular/core';
import {FormControl, FormBuilder, FormGroup, Validators, FormArray} from '@angular/forms';
import {ProjectService} from '../../../project/project.service';
import {map, mergeMap, tap} from 'rxjs/operators';
import {BehaviorSubject, EMPTY, Observable, combineLatest, of} from 'rxjs';
import {LetterNumberConverter} from '../helpers/multi-layer-selection/multi-layer-selection.component';
import {
    RasterDataType,
    RasterDataTypes,
    RasterLayer,
    RasterLayerMetadata,
    RasterStackerDict,
    RasterTypeConversionDict,
    ResultTypes,
    RenameBandsDict,
    geoengineValidators,
    NotificationService,
} from '@geoengine/common';
import {TypedOperatorOperator} from '@geoengine/openapi-client';

interface RasterStackerForm {
    rasterLayers: FormControl<Array<RasterLayer> | undefined>;
    name: FormControl<string>;
    dataType: FormControl<RasterDataType | undefined>;
    renameBands: FormControl<RenameBands>;
    renameValues: FormArray<FormControl<string>>;
}

enum RenameBands {
    Default,
    Suffix,
    Rename,
}

@Component({
    selector: 'geoengine-raster-stacker',
    templateUrl: './raster-stacker.component.html',
    styleUrls: ['./raster-stacker.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class RasterStackerComponent implements AfterViewInit {
    readonly inputTypes = [ResultTypes.RASTER];
    readonly rasterDataTypes = RasterDataTypes.ALL_DATATYPES;

    RenameBands = RenameBands;

    readonly form: FormGroup<RasterStackerForm>;

    readonly outputDataTypes$: Observable<Array<[RasterDataType, string]>>;

    readonly loading$ = new BehaviorSubject<boolean>(false);

    private inputDataTypes: Array<RasterDataType> = [];
    private layerMetadata: Array<RasterLayerMetadata> = [];

    constructor(
        private readonly projectService: ProjectService,
        private readonly notificationService: NotificationService,
        private readonly formBuilder: FormBuilder,
    ) {
        this.form = new FormGroup<RasterStackerForm>({
            rasterLayers: new FormControl<Array<RasterLayer> | undefined>(undefined, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            dataType: new FormControl(undefined, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            name: new FormControl('Stacked raster bands', {
                nonNullable: true,
                validators: [Validators.required, geoengineValidators.notOnlyWhitespace],
            }),
            renameBands: new FormControl(RenameBands.Default, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            renameValues: new FormArray<FormControl<string>>([], {validators: geoengineValidators.duplicateInFormArrayValidator()}),
        });

        // TODO: also update when layer selection changes and not only when new layer is added
        this.outputDataTypes$ = this.form.controls.rasterLayers.valueChanges.pipe(
            mergeMap((rasterLayers: Array<RasterLayer> | undefined) => {
                if (!rasterLayers) {
                    return EMPTY;
                }

                const metaData = rasterLayers.map((l) => this.projectService.getRasterLayerMetadata(l));
                return combineLatest(metaData);
            }),
            map((rasterLayers: Array<RasterLayerMetadata>) => {
                this.inputDataTypes = rasterLayers.map((layer) => layer.dataType);

                const outputDataTypes: Array<[RasterDataType, string]> = RasterDataTypes.ALL_DATATYPES.map((dataType: RasterDataType) => [
                    dataType,
                    '',
                ]);

                for (const output of outputDataTypes) {
                    const outputDataType = output[0];

                    const indices = rasterLayers
                        .map((layer, index) => (layer.dataType === outputDataType ? index : -1))
                        .filter((index) => index >= 0)
                        .map((index) => LetterNumberConverter.toLetters(index + 1));

                    if (indices.length > 0) {
                        output[1] = `(like ${indices.length > 1 ? 'layers' : 'layer'} ${indices.join(', ')})`;
                    }
                }
                return [rasterLayers, outputDataTypes] as [Array<RasterLayerMetadata>, Array<[RasterDataType, string]>];
            }),
            tap(([rasterLayers, outputDataTypes]: [Array<RasterLayerMetadata>, Array<[RasterDataType, string]>]) => {
                this.layerMetadata = rasterLayers;
                this.updateRenameType();

                const dataTypeControl = this.form.controls.dataType;
                const currentDataType: RasterDataType | undefined = dataTypeControl.value;
                const rasterDataTypes = rasterLayers.map((layer) => layer.dataType);
                if (currentDataType && rasterDataTypes.includes(currentDataType)) {
                    // is already set at a meaningful type
                    return;
                }
                let selectedDataType: RasterDataType = currentDataType ?? outputDataTypes[0][0]; // use default
                if (rasterDataTypes.length) {
                    selectedDataType = rasterDataTypes[0];
                }
                setTimeout(() => {
                    dataTypeControl.setValue(selectedDataType);
                });
            }),
            map(([_rasterLayers, outputDataTypes]: [Array<RasterLayerMetadata>, Array<[RasterDataType, string]>]) => outputDataTypes),
        );
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            setTimeout(() =>
                this.form.controls['rasterLayers'].updateValueAndValidity({
                    onlySelf: false,
                    emitEvent: true,
                }),
            );
        });
    }

    updateRenameType(): void {
        if (!this.form.controls.rasterLayers.value) {
            return;
        }

        const renameControl = this.form.controls.renameValues;
        renameControl.clear();

        const renameType = this.form.controls.renameBands.value;

        this.layerMetadata.forEach((layer, layerIndex) => {
            if (renameType === RenameBands.Suffix) {
                renameControl.push(
                    new FormControl(`_${layerIndex}`, {
                        nonNullable: true,
                    }),
                );
            } else if (renameType === RenameBands.Rename) {
                layer.bands.forEach((band) => {
                    renameControl.push(
                        new FormControl(band.name, {
                            nonNullable: true,
                            validators: [Validators.required, geoengineValidators.notOnlyWhitespace],
                        }),
                    );
                });
            }
        });
    }

    add(): void {
        if (this.loading$.value) {
            return; // don't add while loading
        }

        const name: string = this.form.controls['name'].value;
        const dataType: RasterDataType | undefined = this.form.controls['dataType'].value;
        const rasterLayers: Array<RasterLayer> | undefined = this.form.controls['rasterLayers'].value;

        if (!dataType || !rasterLayers) {
            return; // checked by form validator
        }

        const renameBands = this.getRename();

        // harmonize projection of all input layers
        const projectedOperators = this.projectService.getAutomaticallyProjectedOperatorsFromLayers(rasterLayers);

        // convert all input layers to the selected data type, if they are not already of that type
        const convertedOperators: Observable<Array<TypedOperatorOperator>> = projectedOperators.pipe(
            mergeMap((operators) =>
                of(
                    operators.map((operator, index) => {
                        const inputDataType = this.inputDataTypes[index];

                        if (inputDataType === dataType) {
                            return operator;
                        } else {
                            return {
                                type: 'RasterTypeConversion',
                                params: {
                                    outputDataType: dataType.getCode(),
                                },
                                sources: {
                                    raster: operator,
                                },
                            } as RasterTypeConversionDict as TypedOperatorOperator;
                        }
                    }),
                ),
            ),
        );

        this.loading$.next(true);

        convertedOperators
            .pipe(
                mergeMap((operators: Array<TypedOperatorOperator>) =>
                    this.projectService.registerWorkflow({
                        type: 'Raster',
                        operator: {
                            type: 'RasterStacker',
                            params: {
                                renameBands,
                            },
                            sources: {
                                rasters: operators,
                            },
                        } as RasterStackerDict,
                    }),
                ),
                mergeMap((workflowId) =>
                    this.projectService.addLayer(
                        new RasterLayer({
                            workflowId,
                            name,
                            symbology: rasterLayers[0].symbology.clone(),
                            isLegendVisible: false,
                            isVisible: true,
                        }),
                    ),
                ),
            )
            .subscribe({
                next: () => {
                    this.loading$.next(false);
                },
                error: (error) => {
                    const errorMsg = error.error.message;

                    this.notificationService.error(errorMsg);
                    this.loading$.next(false);
                },
            });
    }

    get renameValues(): FormArray {
        return this.form.get('renameValues') as FormArray;
    }

    renameHint(i: number): string {
        switch (this.form.controls.renameBands.value) {
            case RenameBands.Default:
                return '';
            case RenameBands.Suffix:
                return `Suffix for input ${i}`;
            case RenameBands.Rename:
                return `New name for band ${i}`;
        }
    }

    private getRename(): RenameBandsDict {
        switch (this.form.controls.renameBands.value) {
            case RenameBands.Default:
                return {
                    type: 'default',
                };
            case RenameBands.Suffix:
                return {
                    type: 'suffix',
                    values: this.form.controls.renameValues.value,
                };
            case RenameBands.Rename:
                return {
                    type: 'rename',
                    values: this.form.controls.renameValues.value,
                };
        }
    }
}
