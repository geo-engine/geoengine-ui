import {Component, ChangeDetectionStrategy, ViewChild, Input, Output, EventEmitter, OnChanges, SimpleChanges} from '@angular/core';
import {DataSource} from '@angular/cdk/collections';
import {BehaviorSubject, EMPTY, from, Observable, range, Subject} from 'rxjs';
import {CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {concatMap, scan, startWith, tap} from 'rxjs/operators';
import {LayerCollectionSearch} from '../layer-collection.model';
import {
    CollectionItem as LayerCollectionItemDict,
    ProviderLayerCollectionId as ProviderLayerCollectionIdDict,
    LayerListing as LayerCollectionLayerDict,
    LayerCollectionListing as LayerCollectionListingDict,
    LayerListing,
    LayerCollectionListing,
} from '@geoengine/openapi-client';
import {LayersService} from '../layers.service';
import {createIconDataUrl} from '../../util/icons';

export enum CollectionNavigation {
    Element, // navigate into collection by clicking on it
    Button, // navigate into collection by clicking a button
}

@Component({
    selector: 'geoengine-layer-collection-list',
    templateUrl: './layer-collection-list.component.html',
    styleUrls: ['./layer-collection-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerCollectionListComponent implements OnChanges {
    readonly CollectionNavigation = CollectionNavigation;

    @ViewChild(CdkVirtualScrollViewport)
    viewport!: CdkVirtualScrollViewport;

    /**
     * Visualize…
     * - the root collection if `undefined`
     * - a collection if `ProviderLayerCollectionIdDict`
     * - a search result if `LayerCollectionSearch`
     */
    @Input()
    collection?: ProviderLayerCollectionIdDict | LayerCollectionSearch = undefined;

    @Input({required: false}) collectionNavigation = CollectionNavigation.Element;

    @Input({required: false}) showLayerToggle = true;

    @Output()
    navigateCollection = new EventEmitter<LayerCollectionListing>();

    @Output()
    selectCollection = new EventEmitter<LayerCollectionListing>();

    @Output()
    selectLayer = new EventEmitter<LayerListing>();

    readonly itemSizePx = 72;

    @Input() loadingSpinnerDiameterPx: number = 100; // TODO = 3 * LayoutService.remInPx;

    source?: LayerCollectionItemDataSource;

    constructor(private readonly layersService: LayersService) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.collection) {
            this.setUpSource();
        }
    }

    /**
     * Fetch new data when scrolled to the end of the list.
     */
    onScrolledIndexChange(_scrolledIndex: number): void {
        const end = this.viewport.getRenderedRange().end;
        const total = this.viewport.getDataLength();

        // only fetch when scrolled to the end
        if (end >= total) {
            this.source?.fetchMoreData(1);
        }
    }

    trackById(_index: number, item: LayerCollectionItemDict): string {
        if (item.type === 'collection') {
            const collection = item as LayerCollectionListingDict;
            return collection.id.providerId + collection.id.collectionId;
        } else if (item.type === 'layer') {
            const layer = item as LayerCollectionLayerDict;
            return layer.id.providerId + layer.id.layerId;
        }

        return '';
    }

    icon(item: LayerCollectionItemDict): string {
        return createIconDataUrl(item.type);
    }

    select(item: LayerCollectionItemDict): void {
        if (item.type === 'collection') {
            this.selectCollection.next(item);
        } else if (item.type === 'layer') {
            const layer = item as LayerCollectionLayerDict;
            this.selectLayer.next(layer);
        }
    }

    navigateToCollection(item: LayerCollectionListing): void {
        this.navigateCollection.next(item);
    }

    protected setUpSource(): void {
        this.source = new LayerCollectionItemDataSource(this.layersService, this.collection);

        setTimeout(() => {
            this.source?.init(this.calculateInitialNumberOfElements());
        });
    }

    protected calculateInitialNumberOfElements(): number {
        const element = this.viewport.elementRef.nativeElement;
        const numberOfElements = Math.ceil(element.clientHeight / this.itemSizePx);
        // add one such that scrolling happens
        return numberOfElements + 1;
    }
}

/**
 * A custom data source that allows fetching datasets for a virtual scroll source.
 */
class LayerCollectionItemDataSource extends DataSource<LayerCollectionItemDict> {
    // cannot increase this, since it is limited by the server
    readonly scrollFetchSize = 20;

    readonly loading$ = new BehaviorSubject(false);

    protected nextBatch$ = new Subject<number>();
    protected noMoreData = false;
    protected offset = 0;

    protected getCollectionItems: (offset: number, limit: number) => Promise<Array<LayerCollectionItemDict>>;

    constructor(
        protected layersService: LayersService,
        protected collection?: ProviderLayerCollectionIdDict | LayerCollectionSearch,
    ) {
        super();

        if (collection && 'providerId' in collection && 'collectionId' in collection) {
            this.getCollectionItems = async (offset, limit): Promise<Array<LayerCollectionItemDict>> => {
                const res = await layersService.getLayerCollectionItems(collection.providerId, collection.collectionId, offset, limit);
                return res.items;
            };
        } else if (collection && 'type' in collection && collection.type === 'search') {
            const search: LayerCollectionSearch = collection;
            this.getCollectionItems = async (offset, limit): Promise<Array<LayerCollectionItemDict>> => {
                const res = await layersService.search({
                    provider: search.id.providerId,
                    collection: search.id.collectionId,
                    searchType: search.searchType,
                    searchString: search.searchString,
                    limit,
                    offset,
                });
                return res.items;
            };
        } else {
            this.getCollectionItems = async (offset, limit): Promise<Array<LayerCollectionItemDict>> => {
                const res = await layersService.getRootLayerCollectionItems(offset, limit);
                return res.items;
            };
        }
    }

    init(numberOfElements: number): void {
        this.fetchMoreData(Math.ceil(numberOfElements / this.scrollFetchSize)); // initially populate source
    }

    connect(): Observable<Array<LayerCollectionItemDict>> {
        return this.nextBatch$.pipe(
            concatMap((numberOfTimes) => range(0, numberOfTimes)),
            concatMap(() => this.getMoreDataFromServer()),
            scan((acc, newValues) => [...acc, ...newValues]),
            startWith([]), // emit empty array initially to trigger loading animation properly
        );
    }

    /**
     * Clean up resources
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    disconnect(): void {}

    fetchMoreData(numberOfTimes: number): void {
        this.nextBatch$.next(numberOfTimes);
    }

    protected getMoreDataFromServer(): Observable<Array<LayerCollectionItemDict>> {
        if (this.noMoreData) {
            return EMPTY;
        }

        this.loading$.next(true);

        const offset = this.offset;
        const limit = this.scrollFetchSize;

        return from(this.getCollectionItems(offset, limit)).pipe(
            tap((items) => {
                this.offset += items.length;

                if (items.length < limit) {
                    this.noMoreData = true;
                }

                this.loading$.next(false);
            }),
        );
    }
}
