import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Input,
    EventEmitter,
    Output,
    OnChanges,
    OnDestroy,
    SimpleChanges,
} from '@angular/core';
import {
    LayerCollectionDict,
    LayerCollectionListingDict,
    LayerCollectionItemDict,
    ProviderLayerCollectionIdDict,
    LayerCollectionLayerDict,
} from '../../backend/backend.model';
import {LayerCollectionService} from '../layer-collection.service';
import {BehaviorSubject, Observable, Subject, firstValueFrom, map, takeUntil} from 'rxjs';

interface CollectionAndSelected {
    collection: LayerCollectionDict;
    selected?: LayerCollectionItemDict;
}

// TODO: use pagination
const FETCH_SIZE = 9999;

export interface PathChange {
    path: Array<LayerCollectionDict>;
    source: PathChangeSource;
}

export enum PathChangeSource {
    Manual,
    Preselection,
}

@Component({
    selector: 'geoengine-layer-collection-dropdown',
    templateUrl: './layer-collection-dropdown.component.html',
    styleUrls: ['./layer-collection-dropdown.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerCollectionDropdownComponent implements OnInit, OnChanges, OnDestroy {
    @Input() root?: ProviderLayerCollectionIdDict = undefined;
    @Input() preselectedPath: Array<string | number> = []; // preselect entries in hierarchy either by name or index

    @Output() layerSelected = new EventEmitter<LayerCollectionLayerDict>();
    @Output() pathChange = new EventEmitter<PathChange>();

    preselecting$ = new BehaviorSubject<boolean>(false);

    readonly collections = new BehaviorSubject<Array<LayerCollectionDict>>([]);
    selections: Array<LayerCollectionItemDict> = [];

    readonly collectionsAndSelected: Observable<Array<CollectionAndSelected>>;

    private onDestroy$: Subject<boolean> = new Subject();

    constructor(
        protected readonly layerCollectionService: LayerCollectionService,
        private readonly changeDetectorRef: ChangeDetectorRef,
    ) {
        this.collectionsAndSelected = this.collections.pipe(
            map((collections) => {
                const result: Array<CollectionAndSelected> = [];

                for (let i = 0; i < collections.length; ++i) {
                    const collection = collections[i];
                    const selected = this.selections[i];

                    result.push({collection, selected});
                }

                return result;
            }),
        );
    }

    async ngOnInit(): Promise<void> {
        await this.setupRoot();
        await this.preselect(this.preselectedPath);
    }

    async ngOnChanges(changes: SimpleChanges): Promise<void> {
        if (changes.root && changes.root.currentValue !== changes.root.previousValue) {
            await this.setupRoot();
            await this.preselect(this.preselectedPath);
        }

        if (
            changes.preselectedPath &&
            this.collections.value.length // we need to wait for the root collection to be loaded
        ) {
            await this.preselect(this.preselectedPath);
        }
    }

    ngOnDestroy(): void {
        this.onDestroy$.next(true);
        this.onDestroy$.complete();
    }

    get layersAvailable(): boolean {
        return this.collections.value.length > 0 && this.collections.value[0].items.length > 0;
    }

    /** Select a path, starting from the root */
    async preselect(path: Array<string | number>): Promise<void> {
        this.preselecting$.next(true);
        const newCollections = [this.collections.value[0]]; // root collection
        const newSelections = [];
        for (let i = 0; i < path.length; ++i) {
            const selection = path[i];
            const previousCollection = newCollections[i];
            const currentCollection: LayerCollectionDict | undefined = this.collections.value[i + 1];

            if (typeof selection === 'string' && currentCollection?.name === selection) {
                newCollections.push(currentCollection);
                newSelections.push(this.selections[i]);
                continue; // already selected
            }

            let found: LayerCollectionItemDict | undefined;
            if (typeof selection === 'string') {
                found = previousCollection.items.find((entry) => entry.name === selection);
            } else if (typeof selection === 'number') {
                found = previousCollection.items[selection];
            }

            if (!found) {
                break; // we cannot continue selecting the next item
            }

            newSelections.push(found as LayerCollectionItemDict);

            if (found.type === 'layer') {
                this.layerSelected.emit(found as LayerCollectionLayerDict);

                break;
            }

            const collection = found as LayerCollectionListingDict;

            const collectionItems = await firstValueFrom(
                this.layerCollectionService.getLayerCollectionItems(collection.id.providerId, collection.id.collectionId, 0, FETCH_SIZE),
            );

            newCollections.push(collectionItems);
        }

        this.selections = newSelections;
        this.collections.next(newCollections);

        this.pathChange.emit({path: newCollections, source: PathChangeSource.Preselection});

        this.preselecting$.next(false);

        this.changeDetectorRef.markForCheck();
    }

    selectItem(item: LayerCollectionItemDict, index: number): void {
        if (item.type === 'layer') {
            this.layerSelected.emit(item as LayerCollectionLayerDict);
            return;
        }

        const collection = item as LayerCollectionListingDict;

        this.layerSelected.emit(undefined);

        this.layerCollectionService
            .getLayerCollectionItems(collection.id.providerId, collection.id.collectionId, 0, FETCH_SIZE)
            .subscribe((c) => {
                const selections = this.selections;
                selections.splice(index);
                selections.push(item);
                this.selections = selections;

                const collections = this.collections.value;
                collections.splice(index + 1);
                collections.push(c);
                this.collections.next(collections);

                this.pathChange.emit({path: collections, source: PathChangeSource.Manual});

                this.changeDetectorRef.markForCheck();
            });
    }

    searchPredicate(filter: string, element: LayerCollectionItemDict): boolean {
        return element.name.toLowerCase().includes(filter);
    }

    protected async setupRoot(): Promise<void> {
        const collection$ = this.root
            ? this.layerCollectionService.getLayerCollectionItems(this.root.providerId, this.root.collectionId, 0, FETCH_SIZE)
            : this.layerCollectionService.getRootLayerCollectionItems(0, FETCH_SIZE);
        const collection = await firstValueFrom(collection$);

        this.collections.next([collection]);
    }
}
