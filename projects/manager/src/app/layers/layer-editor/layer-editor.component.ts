import {Component, EventEmitter, Input, OnChanges, Output, signal, SimpleChanges, WritableSignal} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ConfirmationComponent, errorToText, LayersService} from '@geoengine/common';
import {Layer, LayerListing} from '@geoengine/openapi-client';
import {AppConfig} from '../../app-config.service';
import {firstValueFrom} from 'rxjs';

export interface LayerForm {
    name: FormControl<string>;
    description: FormControl<string>;
    workflow: FormControl<string>;
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

    form: FormGroup<LayerForm> = this.placeholderForm();

    constructor(
        private readonly layersService: LayersService,
        private readonly dialog: MatDialog,
        private readonly snackBar: MatSnackBar,
        private readonly config: AppConfig,
    ) {}

    async ngOnChanges(changes: SimpleChanges): Promise<void> {
        if (changes.layerListing) {
            const layer = await this.layersService.getLayer(this.layerListing.id.providerId, this.layerListing.id.layerId);
            this.layer.set(layer);
            this.setUpForm(layer);
        }
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
            workflow: new FormControl(JSON.stringify(layer.workflow, null, ' '), {
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
            workflow: new FormControl('{}', {
                nonNullable: true,
            }),
        });
    }

    async applyChanges(): Promise<void> {
        if (this.form.invalid) {
            return;
        }

        const name = this.form.controls.name.value;
        const description = this.form.controls.description.value;
        // TODO: properties, metadata

        try {
            this.layersService.updateLayer(this.layerListing.id.layerId, {
                description,
                name,
                workflow: JSON.parse(this.form.controls.workflow.value),
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
