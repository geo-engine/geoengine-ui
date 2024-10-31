import {Component, EventEmitter, Input, OnChanges, Output, signal, SimpleChanges, WritableSignal} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {
    ConfirmationComponent,
    errorToText,
    LayersService,
    RasterSymbology,
    Symbology,
    SymbologyWorkflow,
    VectorSymbology,
    WorkflowsService,
    createVectorSymbology as createDefaultVectorSymbology,
    WHITE,
    UUID,
} from '@geoengine/common';
import {Layer, LayerListing, TypedResultDescriptor, Symbology as SymbologyDict} from '@geoengine/openapi-client';
import {AppConfig} from '../../app-config.service';
import {firstValueFrom} from 'rxjs';

export interface LayerForm {
    name: FormControl<string>;
    description: FormControl<string>;
    workflow: FormControl<string>;
    symbology: FormControl<SymbologyDict | undefined>;
    properties: FormArray<FormArray<FormControl<string>>>;
}

@Component({
    selector: 'geoengine-manager-layer-editor',
    templateUrl: './layer-editor.component.html',
    styleUrl: './layer-editor.component.scss',
})
export class LayerEditorComponent implements OnChanges {
    @Input({required: true}) layerListing!: LayerListing;

    @Output() readonly layerUpdated = new EventEmitter<void>();
    @Output() readonly layerDeleted = new EventEmitter<void>();

    readonly layer: WritableSignal<Layer | undefined> = signal(undefined);

    readonly resultDescriptor: WritableSignal<TypedResultDescriptor | undefined> = signal(undefined);

    rasterSymbology: RasterSymbology | undefined;
    vectorSymbology: VectorSymbology | undefined;

    rasterSymbologyWorkflow: WritableSignal<SymbologyWorkflow<RasterSymbology> | undefined> = signal(undefined);
    vectorSymbologyWorkflow: WritableSignal<SymbologyWorkflow<VectorSymbology> | undefined> = signal(undefined);

    // workflowId: WritableSignal<UUID | undefined> = signal(undefined);

    workflowId: UUID | undefined = undefined;

    form: FormGroup<LayerForm> = this.placeholderForm();

    constructor(
        private readonly layersService: LayersService,
        private readonly workflowsService: WorkflowsService,
        private readonly dialog: MatDialog,
        private readonly snackBar: MatSnackBar,
        private readonly config: AppConfig,
    ) {}

    async ngOnChanges(changes: SimpleChanges): Promise<void> {
        if (changes.layerListing) {
            this.resetSymbology();

            const layer = await this.layersService.getLayer(this.layerListing.id.providerId, this.layerListing.id.layerId);
            this.layer.set(layer);

            this.setUpColorizer(layer);

            this.workflowsService.registerWorkflow(layer.workflow).then(async (workflowId) => {
                this.workflowId = workflowId;
                this.setUpSymbology();

                const resultDescriptor = await this.workflowsService.getMetadata(workflowId);
                this.resultDescriptor.set(resultDescriptor);
            });

            this.setUpForm(layer);
        }
    }

    private resetSymbology(): void {
        this.rasterSymbology = undefined;
        this.vectorSymbology = undefined;

        this.rasterSymbologyWorkflow.set(undefined);
        this.vectorSymbologyWorkflow.set(undefined);
    }

    private setUpSymbology(): void {
        const layer = this.layer();
        const workflowId = this.workflowId;

        if (!layer || !workflowId) {
            return;
        }

        if (layer.workflow.type == 'Raster') {
            if (this.rasterSymbology) {
                this.rasterSymbologyWorkflow.set({workflowId, symbology: this.rasterSymbology});
            }
        } else if (layer.workflow.type == 'Vector') {
            if (this.vectorSymbology) {
                this.vectorSymbologyWorkflow.set({workflowId, symbology: this.vectorSymbology});
            }
        }
    }

    changeVectorSymbology(symbology: VectorSymbology): void {
        this.vectorSymbology = symbology;
        this.form.controls.symbology.setValue(symbology.toDict());
    }

    changeRasterSymbology(symbology: RasterSymbology): void {
        this.rasterSymbology = symbology;
        this.form.controls.symbology.setValue(symbology.toDict());
    }

    createSymbology(layer: Layer): void {
        if (layer.workflow.type === 'Vector') {
            this.createVectorSymbology();
        }
        if (layer.workflow.type === 'Raster') {
            this.createRasterSymbology();
        }

        this.setUpSymbology();
    }

    private createVectorSymbology(): void {
        const resultDescriptor = this.resultDescriptor();
        if (!resultDescriptor || !(resultDescriptor.type === 'vector')) {
            return;
        }

        this.vectorSymbology = createDefaultVectorSymbology(resultDescriptor.dataType, WHITE);
    }

    private createRasterSymbology(): void {
        this.rasterSymbology = RasterSymbology.fromRasterSymbologyDict({
            type: 'raster',
            opacity: 1.0,
            rasterColorizer: {
                type: 'singleBand',
                band: 0,
                bandColorizer: {
                    type: 'linearGradient',
                    breakpoints: [
                        {value: 1, color: [0, 0, 0, 255]},
                        {value: 255, color: [255, 255, 255, 255]},
                    ],
                    overColor: [255, 255, 255, 127],
                    underColor: [0, 0, 0, 127],
                    noDataColor: [0, 0, 0, 0],
                },
            },
        });
    }

    private setUpForm(layer: Layer): void {
        this.form = new FormGroup<LayerForm>({
            name: new FormControl(layer.name, {
                nonNullable: true,
                validators: [Validators.required, Validators.minLength(1)],
            }),
            description: new FormControl(layer.description, {
                nonNullable: true,
            }),
            properties: new FormArray<FormArray<FormControl<string>>>(
                layer.properties?.map((p) => {
                    return new FormArray<FormControl<string>>([
                        new FormControl(p[0], {
                            nonNullable: true,
                            validators: [Validators.required],
                        }),
                        new FormControl(p[1], {
                            nonNullable: true,
                            validators: [Validators.required],
                        }),
                    ]);
                }) ?? [],
            ),
            workflow: new FormControl(JSON.stringify(layer.workflow, null, ' '), {
                nonNullable: true,
            }),
            symbology: new FormControl(layer.symbology ?? undefined, {
                nonNullable: true,
            }),
        });
    }

    private placeholderForm(): FormGroup<LayerForm> {
        return new FormGroup<LayerForm>({
            name: new FormControl('name', {
                nonNullable: true,
                validators: [Validators.required, Validators.minLength(1)],
            }),
            description: new FormControl('description', {
                nonNullable: true,
            }),
            properties: new FormArray<FormArray<FormControl<string>>>([]),
            workflow: new FormControl('{}', {
                nonNullable: true,
            }),
            symbology: new FormControl(undefined, {
                nonNullable: true,
            }),
        });
    }

    addProperty(): void {
        this.form.controls.properties.push(
            new FormArray<FormControl<string>>([
                new FormControl('newKey', {
                    nonNullable: true,
                    validators: [Validators.required],
                }),
                new FormControl('newValue', {
                    nonNullable: true,
                    validators: [Validators.required],
                }),
            ]),
        );
    }

    removeProperty(i: number): void {
        this.form.controls.properties.removeAt(i);
        this.form.markAsDirty();
    }

    private setUpColorizer(layer: Layer): void {
        if (layer.symbology) {
            const symbology = Symbology.fromDict(layer.symbology);

            if (symbology instanceof RasterSymbology) {
                this.rasterSymbology = symbology;
            } else {
                this.rasterSymbology = undefined;
            }

            if (symbology instanceof VectorSymbology) {
                this.vectorSymbology = symbology;
            } else {
                this.vectorSymbology = undefined;
            }
        } else {
            this.rasterSymbology = undefined;
            this.vectorSymbology = undefined;
        }
    }

    async applyChanges(): Promise<void> {
        if (this.form.invalid) {
            return;
        }

        const name = this.form.controls.name.value;
        const description = this.form.controls.description.value;
        const properties = this.form.controls.properties.value;
        // TODO: metadata

        try {
            this.layersService.updateLayer(this.layerListing.id.layerId, {
                description,
                name,
                properties,
                workflow: JSON.parse(this.form.controls.workflow.value),
                symbology: this.form.controls.symbology.value,
            });

            this.snackBar.open('Layer successfully updated.', 'Close', {duration: this.config.DEFAULTS.SNACKBAR_DURATION});
            this.layerListing.name = name;
            this.layerListing.description = description;
            this.form.markAsPristine();

            // TODO: make changes properly appear in the layer navigation, like for collection.
            this.layerUpdated.emit();
        } catch (error) {
            const errorMessage = await errorToText(error, 'Updating layer failed.');
            this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
        }
    }

    async deleteLayer(): Promise<void> {
        const dialogRef = this.dialog.open(ConfirmationComponent, {
            data: {message: 'Confirm the deletion of the layer. This cannot be undone.'},
        });

        const confirm = await firstValueFrom(dialogRef.afterClosed());

        if (!confirm) {
            return;
        }

        try {
            await this.layersService.removeLayer(this.layerListing.id.layerId);
            this.snackBar.open('Layer successfully deleted.', 'Close', {duration: this.config.DEFAULTS.SNACKBAR_DURATION});
            this.layerDeleted.emit();
        } catch (error) {
            const errorMessage = await errorToText(error, 'Deleting layer failed.');
            this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
        }
    }
}
