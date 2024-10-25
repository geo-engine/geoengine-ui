import {Component, Input, OnChanges, signal, SimpleChanges, WritableSignal} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {LayersService} from '@geoengine/common';
import {LayerCollection, LayerCollectionListing} from '@geoengine/openapi-client';

export interface CollectionForm {
    name: FormControl<string>;
    description: FormControl<string>;
}

@Component({
    selector: 'geoengine-manager-layer-collection-editor',
    templateUrl: './layer-collection-editor.component.html',
    styleUrl: './layer-collection-editor.component.scss',
})
export class LayerCollectionEditorComponent implements OnChanges {
    @Input({required: true}) collectionListing!: LayerCollectionListing;

    readonly collection: WritableSignal<LayerCollection | undefined> = signal(undefined);

    form: FormGroup<CollectionForm> = this.placeholderForm();

    constructor(private readonly layersService: LayersService) {}

    async ngOnChanges(changes: SimpleChanges): Promise<void> {
        if (changes.collectionListing) {
            const collection = await this.layersService.getLayerCollectionItems(
                this.collectionListing.id.providerId,
                this.collectionListing.id.collectionId,
                0,
                0,
            );
            this.collection.set(collection);
            this.setUpForm(collection);
        }
    }

    private async setupLayer(): Promise<void> {}

    private setUpForm(collection: LayerCollection): void {
        this.form = new FormGroup<CollectionForm>({
            name: new FormControl(collection.name, {
                nonNullable: true,
                validators: [Validators.required, Validators.pattern(/^[a-zA-Z0-9_]+$/), Validators.minLength(1)],
            }),
            description: new FormControl(collection.description, {
                nonNullable: true,
            }),
        });
    }

    private placeholderForm(): FormGroup<CollectionForm> {
        return new FormGroup<CollectionForm>({
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

    deleteCollection(): void {
        // TODO
    }
}
