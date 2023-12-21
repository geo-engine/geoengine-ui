import {Component, ChangeDetectionStrategy, ViewChild, Input, Output, EventEmitter, OnChanges, SimpleChanges} from '@angular/core';
import {DataSource} from '@angular/cdk/collections';
import {BehaviorSubject, EMPTY, from, Observable, range, Subject} from 'rxjs';
import {CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {concatMap, first, map, scan, tap} from 'rxjs/operators';
import {LayoutService} from '../../layout.service';
import {
    LayerCollectionItemDict,
    LayerCollectionLayerDict,
    LayerCollectionListingDict,
    ProviderLayerCollectionIdDict,
    ProviderLayerIdDict,
    ResultDescriptorDict,
    UUID,
} from '../../backend/backend.model';
import {LayerCollectionService} from '../layer-collection.service';
import {createIconDataUrl} from '../../util/icons';
import {ProjectService} from '../../project/project.service';
import {NotificationService} from '../../notification.service';
import {LayerCollectionSearch} from '../layer-collection.model';

@Component({
    selector: 'geoengine-layer-collection-list',
    templateUrl: './layer-collection-list.component.html',
    styleUrls: ['./layer-collection-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerCollectionListComponent implements OnChanges {
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

    @Output()
    selectCollection = new EventEmitter<LayerCollectionListingDict>();

    readonly itemSizePx = 72;

    readonly loadingSpinnerDiameterPx: number = 3 * LayoutService.remInPx;

    source?: LayerCollectionItemDataSource;

    constructor(
        private readonly layerCollectionService: LayerCollectionService,
        private readonly projectService: ProjectService,
        private readonly notificationService: NotificationService,
    ) {}

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
            this.selectCollection.next(item as LayerCollectionListingDict);
        } else if (item.type === 'layer') {
            const layer = item as LayerCollectionLayerDict;
            this.layerCollectionService.addLayerToProject(layer.id).subscribe(() => this.showGbifHint(layer.id));
        }
    }

    getWorkflowMetaData(workflowId: UUID): Observable<ResultDescriptorDict> {
        return this.projectService.getWorkflowMetaData(workflowId);
    }

    addLayer(layerId: ProviderLayerIdDict): void {
        this.layerCollectionService.addLayerToProject(layerId).subscribe(() => this.showGbifHint(layerId));
    }

    protected setUpSource(): void {
        this.source = new LayerCollectionItemDataSource(this.layerCollectionService, this.collection);

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

    private showGbifHint(layerId: ProviderLayerIdDict): void {
        if (layerId.providerId === '1c01dbb9-e3ab-f9a2-06f5-228ba4b6bf7a') {
            this.notificationService.info('Loading this layer might time out. In this case, try zooming in to request less occurrences.');
        }
    }
}

/**
 * A custom data source that allows fetching datasets for a virtual scroll source.
 */
class LayerCollectionItemDataSource extends DataSource<LayerCollectionItemDict> {
    // cannot increase this, since it is limited by the server
    readonly scrollFetchSize = 5;

    readonly loading$ = new BehaviorSubject(false);

    protected nextBatch$ = new Subject<number>();
    protected noMoreData = false;
    protected offset = 0;

    protected getCollectionItems: (offset: number, limit: number) => Observable<Array<LayerCollectionItemDict>>;

    constructor(
        protected layerCollectionService: LayerCollectionService,
        protected collection?: ProviderLayerCollectionIdDict | LayerCollectionSearch,
    ) {
        super();

        if (collection && 'providerId' in collection && 'collectionId' in collection) {
            this.getCollectionItems = (offset, limit): Observable<Array<LayerCollectionItemDict>> =>
                layerCollectionService.getLayerCollectionItems(collection.providerId, collection.collectionId, offset, limit).pipe(
                    first(), // first because we only want to fetch once
                    map((c) => c.items),
                );
        } else if (collection && 'type' in collection && collection.type === 'search') {
            const search: LayerCollectionSearch = collection;
            this.getCollectionItems = (offset, limit): Observable<Array<LayerCollectionItemDict>> =>
                from(
                    layerCollectionService
                        .search({
                            provider: search.id.providerId,
                            collection: search.id.collectionId,
                            searchType: search.searchType,
                            searchString: search.searchString,
                            limit,
                            offset,
                        })
                        .then((c) => c.items as Array<LayerCollectionListingDict>),
                );
        } else {
            this.getCollectionItems = (offset, limit): Observable<Array<LayerCollectionItemDict>> =>
                layerCollectionService.getRootLayerCollectionItems(offset, limit).pipe(
                    first(), // first because we only want to fetch once
                    map((c) => c.items),
                );
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

        return this.getCollectionItems(offset, limit).pipe(
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
