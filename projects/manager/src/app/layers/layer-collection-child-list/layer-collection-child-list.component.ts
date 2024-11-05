import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {FormArray, FormControl} from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import {CollectionNavigation, ConfirmationComponent, LayerCollectionListComponent, LayersService} from '@geoengine/common';
import {LayerCollectionListing, LayerListing, ProviderLayerCollectionId} from '@geoengine/openapi-client';
import {firstValueFrom} from 'rxjs';
import {AddLayerItemComponent} from '../add-layer-item/add-layer-item.component';
import {LayerCollectionChildSelectionComponent} from '../layer-collection-child-selection/layer-collection-child-selection.component';
import {Item, ItemId, ItemType} from '../layers.component';

export interface CollectionForm {
    name: FormControl<string>;
    description: FormControl<string>;
    properties: FormArray<FormArray<FormControl<string>>>;
}

@Component({
    selector: 'geoengine-manager-layer-collection-child-list',
    templateUrl: './layer-collection-child-list.component.html',
    styleUrl: './layer-collection-child-list.component.scss',
})
export class LayerCollectionChildListComponent {
    readonly CollectionNavigation = CollectionNavigation;

    @Input({required: true}) collectionId!: ProviderLayerCollectionId;
    @Output() readonly modifiedChildren = new EventEmitter<LayerListing>();

    @ViewChild(LayerCollectionListComponent) layerCollectionListComponent!: LayerCollectionListComponent;

    selectedLayer?: LayerListing;
    selectedCollection?: LayerCollectionListing;

    constructor(
        private readonly layersService: LayersService,
        private readonly dialog: MatDialog,
    ) {}

    async removeChild(): Promise<void> {
        const dialogRef = this.dialog.open(ConfirmationComponent, {
            data: {message: 'Confirm the deletion of the child from this collection.'},
        });

        const confirm = await firstValueFrom(dialogRef.afterClosed());

        if (!confirm) {
            return;
        }

        if (this.selectedLayer) {
            await this.layersService.removeLayerFromCollection(this.selectedLayer.id.layerId, this.collectionId.collectionId);
            this.selectedLayer = undefined;
        } else if (this.selectedCollection) {
            await this.layersService.removeCollectionFromCollection(
                this.selectedCollection.id.collectionId,
                this.collectionId.collectionId,
            );
            this.selectedCollection = undefined;
        }
        this.layerCollectionListComponent.refreshCollection();
    }

    selectCollection(collection: LayerCollectionListing): void {
        this.selectedCollection = collection;
        this.selectedLayer = undefined;
    }

    selectLayer(layer: LayerListing): void {
        this.selectedLayer = layer;
        this.selectedCollection = undefined;
    }

    addChild(): void {
        const dialogRef = this.dialog.open(LayerCollectionChildSelectionComponent, {data: {collection: this.collectionId}});

        dialogRef.afterClosed().subscribe(async (item: Item | undefined) => {
            if (!item) {
                return;
            }

            if (item.type === ItemType.Layer) {
                await this.layersService.addLayerToCollection(item.layer.id.layerId, this.collectionId.collectionId);
                this.layerCollectionListComponent.refreshCollection();
            } else if (item.type === ItemType.Collection) {
                await this.layersService.addCollectionToCollection(item.collection.id.collectionId, this.collectionId.collectionId);
                this.layerCollectionListComponent.refreshCollection();
            }
        });
    }

    async createChild(): Promise<void> {
        const dialogRef = this.dialog.open(AddLayerItemComponent, {
            width: '66%',
            height: 'calc(66%)',
            autoFocus: false,
            disableClose: true,
            data: {
                parent: this.collectionId,
            },
        });

        const itemId: ItemId = await firstValueFrom(dialogRef.afterClosed());

        if (!itemId) {
            return;
        }

        if (itemId.type === ItemType.Layer) {
            this.layerCollectionListComponent.refreshCollection();
        } else {
            this.layerCollectionListComponent.refreshCollection();
        }
    }
}
