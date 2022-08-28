import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
    AfterViewInit,
    ViewChild,
    ChangeDetectorRef,
    Inject,
    InjectionToken,
} from '@angular/core';
import {DataSource} from '@angular/cdk/collections';
import {BehaviorSubject, combineLatest, EMPTY, Observable, of, range, Subject} from 'rxjs';
import {CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {concatMap, filter, first, mergeMap, scan, tap} from 'rxjs/operators';
import {LayoutService} from '../../layout.service';
import {
    GeoEngineError,
    LayerCollectionDict,
    LayerCollectionItemDict,
    LayerCollectionLayerDict,
    LayerDict,
    ProviderLayerCollectionIdDict,
    ProviderLayerIdDict,
    RasterResultDescriptorDict,
    RasterSymbologyDict,
    ResultDescriptorDict,
    SymbologyDict,
    UUID,
    VectorResultDescriptorDict,
    VectorSymbologyDict,
} from '../../backend/backend.model';
import {LayerCollectionService} from '../layer-collection.service';
import {createIconDataUrl} from '../../util/icons';
import {ProjectService} from '../../project/project.service';
import {NotificationService} from '../../notification.service';
import {RasterLayer, VectorLayer} from '../../layers/layer.model';
import {
    ClusteredPointSymbology,
    LineSymbology,
    PointSymbology,
    PolygonSymbology,
    RasterSymbology,
    VectorSymbology,
} from '../../layers/symbology/symbology.model';
import {colorToDict} from '../../colors/color';
import {RandomColorService} from '../../util/services/random-color.service';

export interface LayerCollectionListConfig {
    id?: ProviderLayerCollectionIdDict;
    selectListener: (id: LayerCollectionItemDict) => void;
}

export const CONTEXT_TOKEN = new InjectionToken<LayerCollectionListConfig>('CONTEXT_TOKEN');

@Component({
    selector: 'wave-layer-collection-list',
    templateUrl: './layer-collection-list.component.html',
    styleUrls: ['./layer-collection-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerCollectionListComponent implements OnInit, AfterViewInit {
    @ViewChild(CdkVirtualScrollViewport)
    viewport!: CdkVirtualScrollViewport;

    readonly itemSizePx = 72;

    collection?: ProviderLayerCollectionIdDict = undefined;

    selectListener!: (id: LayerCollectionItemDict) => void;

    readonly loadingSpinnerDiameterPx: number = 3 * LayoutService.remInPx;

    source?: LayerCollectionItemDataSource;

    constructor(
        @Inject(CONTEXT_TOKEN) private data: LayerCollectionListConfig,
        private readonly layerService: LayerCollectionService,
        private readonly layoutService: LayoutService,
        private readonly projectService: ProjectService,
        private readonly notificationService: NotificationService,
        private readonly randomColorService: RandomColorService,
        private readonly changeDetectorRef: ChangeDetectorRef,
    ) {
        this.collection = data.id;
        this.selectListener = data.selectListener;
    }

    ngOnInit(): void {
        this.source = new LayerCollectionItemDataSource(this.layerService, this.collection);
    }

    ngAfterViewInit(): void {
        this.source?.init(this.calculateInitialNumberOfElements());
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
            const collection = item as LayerCollectionDict;
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
            this.selectListener(item);
            // const collection = item as LayerCollectionDict;
            // this.selectListener(collection.id);
        } else if (item.type === 'layer') {
            const layer = item as LayerCollectionLayerDict;
            this.addLayer(layer.id);
        }
    }

    protected calculateInitialNumberOfElements(): number {
        const element = this.viewport.elementRef.nativeElement;
        const numberOfElements = Math.ceil(element.clientHeight / this.itemSizePx);
        // add one such that scrolling happens
        return numberOfElements + 1;
    }

    private addLayer(layerId: ProviderLayerIdDict): void {
        this.layerService
            .getLayer(layerId.providerId, layerId.layerId)
            .pipe(
                mergeMap((layer: LayerDict) => combineLatest([of(layer), this.projectService.registerWorkflow(layer.workflow)])),
                mergeMap(([layer, workflowId]: [LayerDict, UUID]) =>
                    combineLatest([of(layer), of(workflowId), this.projectService.getWorkflowMetaData(workflowId)]),
                ),
            )
            .subscribe(
                ([layer, workflowId, resultDescriptorDict]: [LayerDict, UUID, ResultDescriptorDict]) => {
                    const keys = Object.keys(resultDescriptorDict);

                    if (keys.includes('columns')) {
                        this.addVectorLayer(layer.name, workflowId, resultDescriptorDict as VectorResultDescriptorDict, layer.symbology);
                    } else if (keys.includes('measurement')) {
                        this.addRasterLayer(layer.name, workflowId, resultDescriptorDict as RasterResultDescriptorDict, layer.symbology);
                    } else {
                        // TODO: implement plots, etc.
                        this.notificationService.error('Adding this workflow type is unimplemented, yet');
                    }
                },
                (requestError) => this.handleError(requestError.error, layerId.layerId),
            );
    }

    private addVectorLayer(
        layerName: string,
        workflowId: UUID,
        resultDescriptor: VectorResultDescriptorDict,
        symbology?: SymbologyDict,
    ): void {
        let vectorSymbology: VectorSymbology;
        if (symbology && symbology.type !== 'raster') {
            vectorSymbology = VectorSymbology.fromVectorSymbologyDict(symbology as VectorSymbologyDict);
        } else {
            vectorSymbology = this.createVectorSymbology(resultDescriptor.dataType);
        }

        const layer = new VectorLayer({
            name: layerName,
            workflowId,
            isVisible: true,
            isLegendVisible: false,
            symbology: vectorSymbology,
        });

        this.projectService.addLayer(layer);
    }

    private createVectorSymbology(dataType: 'Data' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon'): VectorSymbology {
        switch (dataType) {
            case 'Data':
                // TODO: cope with that
                throw Error('we cannot add data layers here, yet');
            case 'MultiPoint':
                return ClusteredPointSymbology.fromPointSymbologyDict({
                    type: 'point',
                    radius: {type: 'static', value: PointSymbology.DEFAULT_POINT_RADIUS},
                    stroke: {
                        width: {type: 'static', value: 1},
                        color: {type: 'static', color: [0, 0, 0, 255]},
                    },
                    fillColor: {type: 'static', color: colorToDict(this.randomColorService.getRandomColorRgba())},
                });
            case 'MultiLineString':
                return LineSymbology.fromLineSymbologyDict({
                    type: 'line',
                    stroke: {
                        width: {type: 'static', value: 1},
                        color: {type: 'static', color: [0, 0, 0, 255]},
                    },
                });
            case 'MultiPolygon':
                return PolygonSymbology.fromPolygonSymbologyDict({
                    type: 'polygon',
                    stroke: {
                        width: {type: 'static', value: 1},
                        color: {type: 'static', color: [0, 0, 0, 255]},
                    },
                    fillColor: {type: 'static', color: colorToDict(this.randomColorService.getRandomColorRgba())},
                });
        }
    }

    private addRasterLayer(
        layerName: string,
        workflowId: UUID,
        _resultDescriptor: RasterResultDescriptorDict,
        symbology?: SymbologyDict,
    ): void {
        let rasterSymbologyDict: RasterSymbologyDict;
        if (symbology && symbology.type === 'raster') {
            rasterSymbologyDict = symbology as RasterSymbologyDict;
        } else {
            rasterSymbologyDict = {
                type: 'raster',
                opacity: 1.0,
                colorizer: {
                    type: 'linearGradient',
                    breakpoints: [
                        {value: 1, color: [0, 0, 0, 255]},
                        {value: 255, color: [255, 255, 255, 255]},
                    ],
                    defaultColor: [0, 0, 0, 0],
                    noDataColor: [0, 0, 0, 0],
                },
            };
        }

        const layer = new RasterLayer({
            name: layerName,
            workflowId,
            isVisible: true,
            isLegendVisible: false,
            symbology: RasterSymbology.fromRasterSymbologyDict(rasterSymbologyDict),
        });

        this.projectService.addLayer(layer);
    }

    private handleError(error: GeoEngineError, workflowId: UUID): void {
        let errorMessage = `No workflow found for id: ${workflowId}`;

        if (error.error !== 'NoWorkflowForGivenId') {
            errorMessage = `Unknown error -> ${error.error}: ${error.message}`;
        }

        this.notificationService.error(errorMessage);
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

    constructor(protected layerCollectionService: LayerCollectionService, protected collection?: ProviderLayerCollectionIdDict) {
        super();

        if (collection) {
            this.getCollectionItems = (offset, limit): Observable<Array<LayerCollectionItemDict>> =>
                layerCollectionService.getLayerCollectionItems(collection.providerId, collection.collectionId, offset, limit).pipe(
                    first(), // first because we only want to fetch once
                );
        } else {
            this.getCollectionItems = (offset, limit): Observable<Array<LayerCollectionItemDict>> =>
                layerCollectionService.getRootLayerCollectionItems(offset, limit).pipe(
                    first(), // first because we only want to fetch once
                );
        }
    }

    init(numberOfElements: number): void {
        this.fetchMoreData(Math.ceil(numberOfElements / this.scrollFetchSize)); // initially populate source
    }

    connect(): Observable<Array<LayerCollectionItemDict>> {
        return this.nextBatch$.pipe(
            filter(() => !this.loading$.value),
            concatMap((numberOfTimes) => range(0, numberOfTimes)),
            concatMap(() => this.getMoreDataFromServer()),
            scan((acc, newValues) => [...acc, ...newValues]),
        );
    }

    /**
     * Clean up resources
     */
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
