import {Component, Input, OnChanges, signal, SimpleChanges, WritableSignal} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {LayersService} from '@geoengine/common';
import {Layer, LayerListing} from '@geoengine/openapi-client';

export interface LayerForm {
    name: FormControl<string>;
    description: FormControl<string>;
}

@Component({
    selector: 'geoengine-manager-layer-editor',
    templateUrl: './layer-editor.component.html',
    styleUrl: './layer-editor.component.scss',
})
export class LayerEditorComponent implements OnChanges {
    @Input({required: true}) layerListing!: LayerListing;

    readonly layer: WritableSignal<Layer | undefined> = signal(undefined);

    form: FormGroup<LayerForm> = this.placeholderForm();

    constructor(private readonly layersService: LayersService) {}

    async ngOnChanges(changes: SimpleChanges): Promise<void> {
        if (changes.layerListing) {
            const layer = await this.layersService.getLayer(this.layerListing.id.providerId, this.layerListing.id.layerId);
            this.layer.set(layer);
            this.setUpForm(layer);
        }
    }

    private async setupLayer(): Promise<void> {}

    private setUpForm(layer: Layer): void {
        this.form = new FormGroup<LayerForm>({
            name: new FormControl(layer.name, {
                nonNullable: true,
                validators: [Validators.required, Validators.pattern(/^[a-zA-Z0-9_]+$/), Validators.minLength(1)],
            }),
            description: new FormControl(layer.description, {
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
        });
    }

    applyChanges(): void {
        // TODO
    }

    deleteLayer(): void {
        // TODO
    }
}
