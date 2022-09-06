import {Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Input, EventEmitter, Output} from '@angular/core';
import {
    LayerCollectionDict,
    LayerCollectionListingDict,
    LayerCollectionItemDict,
    ProviderLayerCollectionIdDict,
    ProviderLayerIdDict,
} from '../../backend/backend.model';
import {LayerCollectionService} from '../layer-collection.service';

@Component({
    selector: 'geoengine-layer-collection-dropdown',
    templateUrl: './layer-collection-dropdown.component.html',
    styleUrls: ['./layer-collection-dropdown.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerCollectionDropdownComponent implements OnInit {
    @Input() root?: ProviderLayerCollectionIdDict = undefined;
    @Input() preselectedPath: Array<string | number> = []; // preselect entries in hierarchy either by name or index

    @Output() layerSelected = new EventEmitter<ProviderLayerIdDict>();

    readonly collections: Array<LayerCollectionDict> = [];

    selections: Array<LayerCollectionDict> = [];

    constructor(protected readonly layerCollectionService: LayerCollectionService, private readonly changeDetectorRef: ChangeDetectorRef) {}

    ngOnInit(): void {
        if (this.root) {
            this.layerCollectionService
                .getLayerCollectionItems(this.root.providerId, this.root.collectionId, 0, 9999)
                .subscribe((collection) => {
                    this.collections.push(collection);

                    this.preselect(this.preselectedPath);

                    this.changeDetectorRef.markForCheck();
                });
        } else {
            this.layerCollectionService.getRootLayerCollectionItems(0, 9999).subscribe((collection) => {
                this.collections.push(collection);

                this.preselect(this.preselectedPath);

                this.changeDetectorRef.markForCheck();
            });
        }
    }

    layersAvailable(): boolean {
        return this.collections.length > 0 && this.collections[0].items.length > 0;
    }

    preselect(path: Array<string | number>): void {
        const selection = path.shift();

        const currentCollection = this.collections[this.collections.length - 1];

        let found: LayerCollectionItemDict | undefined;
        if (typeof selection === 'string') {
            found = currentCollection.items.find((entry) => entry.name === selection);
        } else if (typeof selection === 'number') {
            found = currentCollection.items[selection];
        }

        if (!found) {
            return;
        }

        if (found.type === 'layer') {
            this.layerSelected.emit(found.id as ProviderLayerIdDict);
            this.changeDetectorRef.markForCheck();
            return;
        }

        const item = found as LayerCollectionListingDict;

        this.layerCollectionService.getLayerCollectionItems(item.id.providerId, item.id.collectionId, 0, 9999).subscribe((c) => {
            this.collections.push(c);

            if (path.length > 0) {
                this.preselect(path);
            } else {
                this.changeDetectorRef.markForCheck();
            }
        });
    }

    selectItem(item: LayerCollectionItemDict, index: number): void {
        if (item.type === 'layer') {
            this.layerSelected.emit(item.id as ProviderLayerIdDict);
            return;
        }

        const collection = item as LayerCollectionListingDict;

        this.layerSelected.emit(undefined);

        this.layerCollectionService.getLayerCollectionItems(collection.id.providerId, collection.id.collectionId).subscribe((c) => {
            this.collections.splice(index + 1);
            this.collections.push(c);

            this.changeDetectorRef.markForCheck();
        });
    }

    searchPredicate(filter: string, element: LayerCollectionItemDict): boolean {
        return element.name.toLowerCase().includes(filter);
    }
}
