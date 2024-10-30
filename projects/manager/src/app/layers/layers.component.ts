import {Component, signal, ViewChild, WritableSignal} from '@angular/core';
import {
    CollectionNavigation,
    LAYER_DB_PROVIDER_ID,
    LAYER_DB_ROOT_COLLECTION_ID,
    LayerCollectionNavigationComponent,
    LayersService,
    UUID,
} from '@geoengine/common';
import {LayerCollectionListing, LayerListing, ProviderLayerCollectionId} from '@geoengine/openapi-client';
import {AddLayerItemComponent} from './add-layer-item/add-layer-item.component';
import {firstValueFrom} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';

export enum ItemType {
    Layer,
    Collection,
}

export type Item = {type: ItemType.Layer; layer: LayerListing} | {type: ItemType.Collection; collection: LayerCollectionListing};
export type ItemId = {type: ItemType.Layer; layer: UUID} | {type: ItemType.Collection; collection: UUID};

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

    constructor(
        protected readonly layersService: LayersService,
        protected readonly dialog: MatDialog,
    ) {}

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

    async addItem(): Promise<void> {
        const dialogRef = this.dialog.open(AddLayerItemComponent, {
            width: '66%',
            height: 'calc(66%)',
            autoFocus: false,
            disableClose: true,
            data: {
                parent: this.layerCollectionNavigationComponent.selectedCollection,
            },
        });

        const itemId: ItemId = await firstValueFrom(dialogRef.afterClosed());

        if (!itemId) {
            return;
        }

        if (itemId.type === ItemType.Layer) {
            this.layerCollectionNavigationComponent.refreshCollection();

            const layer = await this.layersService.getLayer(LAYER_DB_PROVIDER_ID, itemId.layer);

            const listing: LayerListing = {
                description: layer.description,
                id: layer.id,
                name: layer.name,
                type: 'layer',
            };
            this.selectLayer(listing);
        } else {
            this.layerCollectionNavigationComponent.refreshCollection();

            const collection = await this.layersService.getLayerCollectionItems(LAYER_DB_PROVIDER_ID, itemId.collection);

            const listing: LayerCollectionListing = {
                description: collection.description,
                id: collection.id,
                name: collection.name,
                type: 'collection',
            };
            this.selectCollection(listing);
        }
    }
}
