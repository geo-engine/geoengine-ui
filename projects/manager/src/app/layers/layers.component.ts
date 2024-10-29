import {Component, signal, ViewChild, WritableSignal} from '@angular/core';
import {
    CollectionNavigation,
    LAYER_DB_PROVIDER_ID,
    LAYER_DB_ROOT_COLLECTION_ID,
    LayerCollectionNavigationComponent,
    LayersService,
} from '@geoengine/common';
import {LayerCollectionListing, LayerListing, ProviderLayerCollectionId} from '@geoengine/openapi-client';

export enum ItemType {
    Layer,
    Collection,
}

export type Item = {type: ItemType.Layer; layer: LayerListing} | {type: ItemType.Collection; collection: LayerCollectionListing};

@Component({
    selector: 'geoengine-manager-layers',
    templateUrl: './layers.component.html',
    styleUrl: './layers.component.scss',
})
export class LayersComponent {
    readonly CollectionNavigation = CollectionNavigation;
    readonly ItemType = ItemType;

    readonly collectionId: ProviderLayerCollectionId = {providerId: LAYER_DB_PROVIDER_ID, collectionId: LAYER_DB_ROOT_COLLECTION_ID};

    readonly selectedItem: WritableSignal<Item | undefined> = signal(undefined);

    @ViewChild(LayerCollectionNavigationComponent) layerCollectionNavigationComponent!: LayerCollectionNavigationComponent;

    constructor(protected readonly layersService: LayersService) {}

    selectLayer(layer: LayerListing): void {
        this.selectedItem.set({layer, type: ItemType.Layer});
    }

    selectCollection(collection: LayerCollectionListing): void {
        this.selectedItem.set({collection, type: ItemType.Collection});
    }

    collectionUpdated(): void {
        this.layerCollectionNavigationComponent.refresh();
    }

    collectionDeleted(): void {
        this.layerCollectionNavigationComponent.refreshCollection();
        this.selectedItem.set(undefined);
    }

    layerUpdated(): void {
        this.layerCollectionNavigationComponent.refresh();
    }

    layerDeleted(): void {
        this.layerCollectionNavigationComponent.refreshCollection();
        this.selectedItem.set(undefined);
    }
}
