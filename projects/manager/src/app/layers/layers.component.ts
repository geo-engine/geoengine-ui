import {Component, signal, WritableSignal} from '@angular/core';
import {LAYER_DB_PROVIDER_ID, LAYER_DB_ROOT_COLLECTION_ID, LayersService} from '@geoengine/common';
import {LayerListing, ProviderLayerCollectionId} from '@geoengine/openapi-client';

@Component({
    selector: 'geoengine-manager-layers',
    templateUrl: './layers.component.html',
    styleUrl: './layers.component.scss',
})
export class LayersComponent {
    readonly collectionId: ProviderLayerCollectionId = {providerId: LAYER_DB_PROVIDER_ID, collectionId: LAYER_DB_ROOT_COLLECTION_ID};

    readonly selectedLayer: WritableSignal<LayerListing | undefined> = signal(undefined);

    constructor(protected readonly layersService: LayersService) {}

    selectLayer(layer: LayerListing): void {
        this.selectedLayer.set(layer);
    }
}
