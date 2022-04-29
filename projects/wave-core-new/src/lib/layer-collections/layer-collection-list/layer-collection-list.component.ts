import {Component, OnInit, ChangeDetectionStrategy, AfterViewInit, ViewChild, Input} from '@angular/core';
import {DataSource} from '@angular/cdk/collections';
import {BehaviorSubject, EMPTY, Observable, Subject} from 'rxjs';
import {CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {filter, mergeMap, scan, tap} from 'rxjs/operators';
import {LayoutService} from '../../layout.service';
import {
    GeoEngineError,
    LayerCollectionItem,
    LayerCollectionLayer,
    RasterResultDescriptorDict,
    UUID,
    VectorResultDescriptorDict,
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

@Component({
    selector: 'wave-layer-collection-list',
    templateUrl: './layer-collection-list.component.html',
    styleUrls: ['./layer-collection-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerCollectionListComponent implements OnInit, AfterViewInit {
    @ViewChild(CdkVirtualScrollViewport)
    viewport!: CdkVirtualScrollViewport;

    @Input() collection?: UUID = undefined;

    readonly loadingSpinnerDiameterPx: number = 3 * LayoutService.remInPx;

    source?: LayerCollectionItemDataSource;

    constructor(
        private readonly layerService: LayerCollectionService,
        private readonly layoutService: LayoutService,
        private readonly projectService: ProjectService,
        private readonly notificationService: NotificationService,
        private readonly randomColorService: RandomColorService,
    ) {}

    ngOnInit(): void {
        this.source = new LayerCollectionItemDataSource(this.layerService, this.collection);
    }

    ngAfterViewInit(): void {}

    /**
     * Fetch new data when scrolled to the end of the list.
     */
    onScrolledIndexChange(_scrolledIndex: number): void {
        const end = this.viewport.getRenderedRange().end;
        const total = this.viewport.getDataLength();

        // only fetch when scrolled to the end
        if (end >= total) {
            this.source?.fetchMoreData();
        }
    }

    trackById(_index: number, item: LayerCollectionItem): UUID {
        return item.id;
    }

    icon(item: LayerCollectionItem): string {
        return createIconDataUrl(item.type);
    }

    select(item: LayerCollectionItem): void {
        if (item.type === 'collection') {
            this.layoutService.setSidenavContentComponent({
                component: LayerCollectionListComponent,
                config: {collection: item.id},
                keepParent: true,
            });
        } else if (item.type === 'layer') {
            const layer = item as LayerCollectionLayer;
            this.addLayer(layer.name, layer.workflow);
        }
    }

    private addLayer(layerName: string, workflowId: UUID): void {
        this.projectService.getWorkflowMetaData(workflowId).subscribe(
            (resultDescriptorDict) => {
                const keys = Object.keys(resultDescriptorDict);

                if (keys.includes('columns')) {
                    this.addVectorLayer(layerName, workflowId, resultDescriptorDict as VectorResultDescriptorDict);
                } else if (keys.includes('measurement')) {
                    this.addRasterLayer(layerName, workflowId, resultDescriptorDict as RasterResultDescriptorDict);
                } else {
                    // TODO: implement plots, etc.
                    this.notificationService.error('Adding this workflow type is unimplemented, yet');
                }
            },
            (requestError) => this.handleError(requestError.error, workflowId),
        );
    }

    private addVectorLayer(layerName: string, workflowId: UUID, resultDescriptor: VectorResultDescriptorDict): void {
        const layer = new VectorLayer({
            name: layerName,
            workflowId,
            isVisible: true,
            isLegendVisible: false,
            symbology: this.createVectorSymbology(resultDescriptor.dataType),
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

    private addRasterLayer(layerName: string, workflowId: UUID, _resultDescriptor: RasterResultDescriptorDict): void {
        const layer = new RasterLayer({
            name: layerName,
            workflowId,
            isVisible: true,
            isLegendVisible: false,
            symbology: RasterSymbology.fromRasterSymbologyDict({
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
            }),
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
class LayerCollectionItemDataSource extends DataSource<LayerCollectionItem> {
    readonly scrollFetchSize = 20;

    readonly loading$ = new BehaviorSubject(false);

    protected nextBatch$ = new Subject<void>();
    protected noMoreData = false;
    protected offset = 0;

    protected getCollectionItems: (offset: number, limit: number) => Observable<Array<LayerCollectionItem>>;

    constructor(protected layerCollectionService: LayerCollectionService, protected collection?: UUID) {
        super();

        if (collection) {
            this.getCollectionItems = (offset, limit): Observable<Array<LayerCollectionItem>> =>
                layerCollectionService.getLayerCollectionItems(collection, offset, limit);
        } else {
            this.getCollectionItems = (offset, limit): Observable<Array<LayerCollectionItem>> =>
                layerCollectionService.getRootLayerCollectionItems(offset, limit);
        }

        this.fetchMoreData(); // initially populate source
    }

    connect(): Observable<Array<LayerCollectionItem>> {
        return this.nextBatch$.pipe(
            filter(() => !this.loading$.value),
            mergeMap(() => this.getMoreDataFromServer()),
            scan((acc, newValues) => [...acc, ...newValues]),
        );
    }

    /**
     * Clean up resources
     */
    disconnect(): void {}

    fetchMoreData(): void {
        this.nextBatch$.next();
    }

    protected getMoreDataFromServer(): Observable<Array<LayerCollectionItem>> {
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
