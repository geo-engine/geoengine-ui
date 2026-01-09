import {AfterViewInit, ChangeDetectionStrategy, Component, inject, computed, effect, signal} from '@angular/core';
import {FormControl, FormBuilder, FormGroup, Validators, FormArray, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ProjectService} from '../../../project/project.service';
import {mergeMap} from 'rxjs/operators';
import {BehaviorSubject, Observable, of, firstValueFrom, merge} from 'rxjs';
import {toSignal} from '@angular/core/rxjs-interop';
import {LetterNumberConverter, MultiLayerSelectionComponent} from '../helpers/multi-layer-selection/multi-layer-selection.component';
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
    SpatialGridDefinition,
    ReprojectionDict,
} from '@geoengine/common';
import {Coordinate2D, SpatialResolution, TypedOperatorOperator} from '@geoengine/openapi-client';
import {SidenavHeaderComponent} from '../../../sidenav/sidenav-header/sidenav-header.component';
import {OperatorDialogContainerComponent} from '../helpers/operator-dialog-container/operator-dialog-container.component';
import {MatIconButton, MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatButtonToggleGroup, MatButtonToggle} from '@angular/material/button-toggle';
import {MatFormField, MatLabel, MatInput, MatError, MatHint} from '@angular/material/input';
import {MatSelect} from '@angular/material/select';
import {MatOption} from '@angular/material/autocomplete';
import {OperatorOutputNameComponent} from '../helpers/operator-output-name/operator-output-name.component';
import {AsyncPipe} from '@angular/common';

interface RasterStackerForm {
    rasterLayers: FormControl<Array<RasterLayer> | undefined>;
    name: FormControl<string>;
    renameBands: FormControl<RenameBands>;
    renameValues: FormArray<FormControl<string>>;
    dataType: FormControl<RasterDataType | undefined>;
    spatialReference: FormControl<string>;
    regrid: FormControl<Regrid>;
    // TODO: up/downsampling method for each input?
}

enum RenameBands {
    Default,
    Suffix,
    Rename,
}

type SpatialReferenceString = string;

interface Regrid {
    origin: Coordinate2D;
    resolution: SpatialResolution;
}

@Component({
    selector: 'geoengine-raster-stacker',
    templateUrl: './raster-stacker.component.html',
    styleUrls: ['./raster-stacker.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        SidenavHeaderComponent,
        FormsModule,
        ReactiveFormsModule,
        OperatorDialogContainerComponent,
        MatIconButton,
        MatIcon,
        MultiLayerSelectionComponent,
        MatButtonToggleGroup,
        MatButtonToggle,
        MatFormField,
        MatLabel,
        MatInput,
        MatError,
        MatSelect,
        MatOption,
        OperatorOutputNameComponent,
        MatHint,
        MatButton,
        AsyncPipe,
    ],
})
export class RasterStackerComponent implements AfterViewInit {
    private readonly projectService = inject(ProjectService);
    private readonly notificationService = inject(NotificationService);
    private readonly formBuilder = inject(FormBuilder);

    readonly inputTypes = [ResultTypes.RASTER];
    readonly rasterDataTypes = RasterDataTypes.ALL_DATATYPES;

    RenameBands = RenameBands;

    readonly form: FormGroup<RasterStackerForm>;

    readonly outputDataTypes = computed(() => {
        const metadata = this.layerMetadata();
        if (!metadata || metadata.length === 0) {
            return [];
        }

        const outputDataTypes: Array<[RasterDataType, string]> = RasterDataTypes.ALL_DATATYPES.map((dataType: RasterDataType) => [
            dataType,
            '',
        ]);

        for (const output of outputDataTypes) {
            const outputDataType = output[0];

            const indices = metadata
                .map((layer, index) => (layer.dataType === outputDataType ? index : -1))
                .filter((index) => index >= 0)
                .map((index) => LetterNumberConverter.toLetters(index + 1));

            if (indices.length > 0) {
                output[1] = `(like ${indices.length > 1 ? 'layers' : 'layer'} ${indices.join(', ')})`;
            }
        }
        return outputDataTypes;
    });

    readonly outputSpatialReferences = computed(() => {
        const metadata = this.layerMetadata();
        if (!metadata || metadata.length === 0) {
            return [];
        }

        const outputSpatialReferences: Array<[SpatialReferenceString, string]> = metadata.map((layer: RasterLayerMetadata) => [
            layer.spatialReference.srsString,
            '',
        ]);

        const dedupedOutputSpatialReferences = outputSpatialReferences.reduce(
            (acc, spatialReference) => {
                if (!acc.find((p) => p[0] === spatialReference[0])) {
                    acc.push(spatialReference);
                }
                return acc;
            },
            [] as Array<[SpatialReferenceString, string]>,
        );

        for (const output of dedupedOutputSpatialReferences) {
            const outputSpatialReference = output[0];

            const indices = metadata
                .map((layer, index) => (layer.spatialReference.srsString === outputSpatialReference ? index : -1))
                .filter((index) => index >= 0)
                .map((index) => LetterNumberConverter.toLetters(index + 1));

            if (indices.length > 0) {
                output[1] = `(like ${indices.length > 1 ? 'layers' : 'layer'} ${indices.join(', ')})`;
            }
        }
        return dedupedOutputSpatialReferences;
    });

    readonly outputRegrids = computed(() => {
        const metadata = this.reprojectedLayerMetadata();
        const spatialReference = this.spatialReferenceSignal();
        const rasterLayers = this.rasterLayersSignal();

        if (!metadata || metadata.length === 0 || !spatialReference || !rasterLayers) {
            return [];
        }

        // Use the spatial grids from the reprojected metadata
        const outputRegrids: Array<[Regrid, string]> = metadata.map((layer: RasterLayerMetadata) => [
            this.spatialGridToRegrid(layer.spatialGrid.spatialGrid),
            '',
        ]);

        // Deduplicate based on regrid equality
        const dedupedOutputRegrids: Array<[Regrid, string]> = [];
        for (const regrid of outputRegrids) {
            if (!dedupedOutputRegrids.find((r) => this.areRegridsEqual(r[0], regrid[0]))) {
                dedupedOutputRegrids.push(regrid);
            }
        }

        for (const output of dedupedOutputRegrids) {
            const outputRegrid = output[0];

            const indices = metadata
                .map((layer, index) =>
                    this.areRegridsEqual(this.spatialGridToRegrid(layer.spatialGrid.spatialGrid), outputRegrid) ? index : -1,
                )
                .filter((index) => index >= 0)
                .map((index) => LetterNumberConverter.toLetters(index + 1));

            if (indices.length > 0) {
                output[1] = `(like ${indices.length > 1 ? 'layers' : 'layer'} ${indices.join(', ')})`;
            }
        }
        return dedupedOutputRegrids;
    });

    readonly loading$ = new BehaviorSubject<boolean>(false);

    private readonly inputDataTypes = signal<Array<RasterDataType>>([]);
    private readonly layerMetadata = signal<Array<RasterLayerMetadata>>([]);
    private readonly reprojectedLayerMetadata = signal<Array<RasterLayerMetadata>>([]);
    private readonly rasterLayersSignal!: ReturnType<typeof toSignal<Array<RasterLayer> | undefined>>;
    private readonly spatialReferenceSignal!: ReturnType<typeof toSignal<string | undefined>>;

    constructor() {
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
            spatialReference: new FormControl('EPSG:4326', {nonNullable: true, validators: [Validators.required]}),
            regrid: new FormControl(
                {
                    origin: {x: 0, y: 0},
                    resolution: {x: 1, y: 1},
                },
                {
                    nonNullable: true,
                    validators: [Validators.required],
                },
            ),
        });

        this.rasterLayersSignal = toSignal(merge(of(this.form.controls.rasterLayers.value), this.form.controls.rasterLayers.valueChanges), {
            initialValue: undefined,
        });
        this.spatialReferenceSignal = toSignal(
            merge(of(this.form.controls.spatialReference.value), this.form.controls.spatialReference.valueChanges),
            {initialValue: undefined},
        );

        // Fetch metadata when raster layers change
        effect(() => {
            const rasterLayers = this.rasterLayersSignal();
            if (!rasterLayers || rasterLayers.length === 0) {
                this.layerMetadata.set([]);
                this.inputDataTypes.set([]);
                return;
            }

            const metadataPromises = rasterLayers.map((l) => firstValueFrom(this.projectService.getRasterLayerMetadata(l)));
            void Promise.all(metadataPromises).then((metadata: Array<RasterLayerMetadata>) => {
                this.layerMetadata.set(metadata);
                this.inputDataTypes.set(metadata.map((layer: RasterLayerMetadata) => layer.dataType));
            });
        });

        // Update form when layer metadata changes
        effect(() => {
            const metadata = this.layerMetadata();
            if (!metadata || metadata.length === 0) {
                return;
            }

            this.updateRenameType();

            // datatypes
            const dataTypeControl = this.form.controls.dataType;
            const currentDataType: RasterDataType | undefined = dataTypeControl.value;
            const rasterDataTypes = metadata.map((layer) => layer.dataType);

            if (currentDataType && rasterDataTypes.includes(currentDataType)) {
                // is already set at a meaningful type
                return;
            }

            const outputDataTypes = this.outputDataTypes();
            let selectedDataType: RasterDataType = currentDataType ?? outputDataTypes[0][0]; // use default
            if (rasterDataTypes.length) {
                selectedDataType = rasterDataTypes[0];
            }

            setTimeout(() => {
                dataTypeControl.setValue(selectedDataType);
            });

            // spatial references
            const spatialReferenceControl = this.form.controls.spatialReference;
            const currentSpatialReference: string = spatialReferenceControl.value;
            const rasterSpatialReferences = metadata.map((layer) => layer.spatialReference.srsString);

            if (currentSpatialReference && rasterSpatialReferences.includes(currentSpatialReference)) {
                // is already set at a meaningful spatial reference
                return;
            }

            let selectedSpatialReference: string = currentSpatialReference; // use current
            if (rasterSpatialReferences.length) {
                selectedSpatialReference = rasterSpatialReferences[0];
            }

            setTimeout(() => {
                spatialReferenceControl.setValue(selectedSpatialReference);
            });
        });

        // Update regrid when output regrids change
        effect(() => {
            const outputRegrids = this.outputRegrids();

            if (outputRegrids.length === 0) {
                return;
            }

            const regridControl = this.form.controls.regrid;
            const currentRegrid: Regrid = regridControl.value;

            // Find the matching regrid from the new options (if it exists)
            const matchingRegrid = outputRegrids.find((r) => this.areRegridsEqual(r[0], currentRegrid));

            // Select the matching regrid or the first available one
            const selectedRegrid: Regrid = matchingRegrid ? matchingRegrid[0] : outputRegrids[0][0];

            setTimeout(() => {
                regridControl.setValue(selectedRegrid);
            });
        });

        // Fetch reprojected metadata when spatial reference or layers change
        effect(() => {
            const rasterLayers = this.rasterLayersSignal();
            const spatialReference = this.spatialReferenceSignal() ?? this.form.controls.spatialReference.value;

            if (!rasterLayers || rasterLayers.length === 0 || !spatialReference) {
                this.reprojectedLayerMetadata.set([]);
                return;
            }

            // Get workflows for all layers and create reprojected operators
            const workflowPromises = rasterLayers.map((layer) => firstValueFrom(this.projectService.getWorkflow(layer.workflowId)));

            void Promise.all(workflowPromises).then((workflows) => {
                // Create reprojected operators
                const reprojectedOperators = workflows.map((workflow, index) => {
                    const layerSref = this.layerMetadata()[index]?.spatialReference.srsString;

                    if (layerSref === spatialReference) {
                        // No reprojection needed
                        return workflow.operator;
                    } else {
                        // Create reprojection operator
                        return {
                            type: 'Reprojection',
                            params: {
                                targetSpatialReference: spatialReference,
                            },
                            sources: {
                                source: workflow.operator,
                            },
                        } as ReprojectionDict;
                    }
                });

                // Register temporary workflows and fetch their metadata
                const metadataPromises = reprojectedOperators.map((operator) => {
                    const workflowPromise = firstValueFrom(
                        this.projectService.registerWorkflow({
                            type: 'Raster',
                            operator,
                        }),
                    );

                    return workflowPromise.then((workflowId) =>
                        firstValueFrom(this.projectService.getWorkflowMetaData(workflowId)).then((descriptor) => {
                            if (descriptor.type !== 'raster') {
                                throw new Error('Expected raster result descriptor');
                            }
                            return RasterLayerMetadata.fromDict(descriptor);
                        }),
                    );
                });

                void Promise.all(metadataPromises).then((metadata) => {
                    this.reprojectedLayerMetadata.set(metadata);
                });
            });
        });
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

        this.layerMetadata().forEach((layer, layerIndex) => {
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

    regridToString(regrid: Regrid): string {
        return `Origin: (${regrid.origin.x.toFixed(2)}, ${regrid.origin.y.toFixed(2)}), Resolution: (${regrid.resolution.x.toFixed(
            2,
        )}, ${regrid.resolution.y.toFixed(2)})`;
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
                        const inputDataType = this.inputDataTypes()[index];

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
                error: (error: {error?: {message?: string}}) => {
                    const errorMsg = error.error?.message ?? 'An error occurred';

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

    private spatialGridToRegrid(spatialGrid: SpatialGridDefinition): Regrid {
        return {
            origin: spatialGrid.geoTransform.originCoordinate,
            resolution: {
                x: Math.abs(spatialGrid.geoTransform.pixelSizeX),
                y: Math.abs(spatialGrid.geoTransform.pixelSizeY),
            },
        };
    }

    private areRegridsEqual(regrid1: Regrid, regrid2: Regrid): boolean {
        return (
            regrid1.origin.x === regrid2.origin.x &&
            regrid1.origin.y === regrid2.origin.y &&
            regrid1.resolution.x === regrid2.resolution.x &&
            regrid1.resolution.y === regrid2.resolution.y
        );
    }
}
