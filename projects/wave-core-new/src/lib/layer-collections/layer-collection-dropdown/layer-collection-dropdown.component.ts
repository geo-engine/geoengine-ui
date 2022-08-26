import {Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Input, EventEmitter, Output} from '@angular/core';
import {
    LayerCollectionListingDict,
    LayerCollectionItemDict,
    ProviderLayerCollectionIdDict,
    ProviderLayerIdDict,
} from '../../backend/backend.model';
import {LayerCollectionService} from '../layer-collection.service';

@Component({
    selector: 'wave-layer-collection-dropdown',
    templateUrl: './layer-collection-dropdown.component.html',
    styleUrls: ['./layer-collection-dropdown.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerCollectionDropdownComponent implements OnInit {
    @Input() root?: ProviderLayerCollectionIdDict = undefined;
    @Input() rootLabel = 'Layers';
    @Input() preselectedPath: Array<string | number> = []; // preselect entries in hierarchy either by name or index

    @Output() layerSelected = new EventEmitter<ProviderLayerIdDict>();

    // TODO: rework
    readonly items: Array<Array<LayerCollectionItemDict>> = [];
    readonly labels: Array<string> = [];
    readonly descriptions: Array<string> = [];
    readonly properties: Array<Array<[string, string]>> = [];

    selections: Array<LayerCollectionItemDict> = [];

    constructor(protected readonly layerCollectionService: LayerCollectionService, private readonly changeDetectorRef: ChangeDetectorRef) {}

    ngOnInit(): void {
        if (this.root) {
            this.layerCollectionService
                .getLayerCollectionItems(this.root.providerId, this.root.collectionId, 0, 9999)
                .subscribe((collection) => {
                    this.items.push(collection.items);
                    this.labels.push(this.rootLabel);
                    this.descriptions.push('');
                    this.properties.push([]);

                    this.preselect(this.preselectedPath);

                    this.changeDetectorRef.markForCheck();
                });
        } else {
            this.layerCollectionService.getRootLayerCollectionItems(0, 9999).subscribe((collection) => {
                this.items.push(collection.items);
                this.labels.push(this.rootLabel);
                this.descriptions.push('');
                this.properties.push([]);

                this.preselect(this.preselectedPath);

                this.changeDetectorRef.markForCheck();
            });
        }
    }

    layersAvailable(): boolean {
        return this.items.length > 0 && this.items[0].length > 0;
    }

    preselect(path: Array<string | number>): void {
        const selection = path.shift();

        const currentItems = this.items[this.items.length - 1];

        let found: LayerCollectionItemDict | undefined;
        if (typeof selection === 'string') {
            found = currentItems.find((entry) => entry.name === selection);
        } else if (typeof selection === 'number') {
            found = currentItems[selection];
        }

        if (!found) {
            return;
        }

        const item: LayerCollectionItemDict = found;

        this.selections.push(item);

        if (item.type === 'layer') {
            this.layerSelected.emit(item.id as ProviderLayerIdDict);
            this.changeDetectorRef.markForCheck();
            return;
        }

        const collection = item as LayerCollectionListingDict;
        const label = collection.entryLabel ?? collection.name;

        this.layerCollectionService
            .getLayerCollectionItems(collection.id.providerId, collection.id.collectionId, 0, 9999)
            .subscribe((c) => {
                this.items.push(c.items);
                this.labels.push(label);
                this.descriptions[this.descriptions.length - 1] = item.description;
                this.descriptions.push('');
                this.properties[this.properties.length - 1] = item.properties ?? [];
                this.properties.push([]);

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

        const label = collection.entryLabel ?? collection.name;

        this.layerCollectionService.getLayerCollectionItems(collection.id.providerId, collection.id.collectionId).subscribe((c) => {
            this.items.splice(index + 1);
            this.items.push(c.items);

            this.labels.splice(index + 1);
            this.labels.push(label);

            this.descriptions.splice(index);
            this.descriptions.push(item.description);
            this.descriptions.push('');

            this.properties.splice(index);
            this.properties.push(item.properties ?? []);

            this.changeDetectorRef.markForCheck();
        });
    }

    searchPredicate(filter: string, element: LayerCollectionItemDict): boolean {
        return element.name.toLowerCase().includes(filter);
    }
}
