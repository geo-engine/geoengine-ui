import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
    ViewChild,
    AfterViewInit,
    OnDestroy,
    AfterViewChecked,
    ElementRef,
    HostListener,
} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {combineLatest, Observable, Subject, Subscription} from 'rxjs';
import {RasterLayerMetadata, VectorLayerMetadata} from '../../layers/layer-metadata.model';
import {Layer, RasterLayer, VectorLayer} from '../../layers/layer.model';
import {ResultTypes} from '../../operators/result-type.model';
import {ProjectService} from '../../project/project.service';
import {Feature as OlFeature} from 'ol/Feature';
import {VectorData} from '../../layers/layer-data.model';
import {DataSource} from '@angular/cdk/collections';

@Component({
    selector: 'wave-datatable',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent implements OnInit, AfterViewInit, OnDestroy, AfterViewChecked {
    @ViewChild(MatPaginator) paginator: MatPaginator;

    readonly layerTypes = ResultTypes.VECTOR_TYPES;
    tableHeight: number;

    dataSource = new FeatureDataSource();
    displayedColumns: Array<string> = [];

    protected layerDataSubscription: Subscription = undefined;
    protected layerSelectionSubscription: Subscription = undefined;

    constructor(protected readonly projectService: ProjectService, protected readonly hostElement: ElementRef<HTMLElement>) {
        // TODO: remove
        console.log('DataTableComponent', 'constructor');
    }

    ngOnInit(): void {
        // TODO: remove
        console.log('DataTableComponent', 'ngOnInit');

        // TODO: allow specifying a layer as `@Input()`
        this.layerSelectionSubscription = this.projectService.getLayerStream().subscribe((layers) => {
            if (layers.length) {
                this.selectLayer(layers[0]);
            } else {
                this.emptyTable();
            }
        });
    }

    ngAfterViewInit(): void {
        this.dataSource.paginator = this.paginator;
    }

    ngAfterViewChecked(): void {
        this.setTableHeight();
    }

    ngOnDestroy(): void {
        if (this.layerDataSubscription) {
            this.layerDataSubscription.unsubscribe();
        }
        if (this.layerSelectionSubscription) {
            this.layerSelectionSubscription.unsubscribe();
        }
    }

    selectLayer(layer: Layer): void {
        if (this.layerDataSubscription) {
            this.layerDataSubscription.unsubscribe();
        }

        this.layerDataSubscription = combineLatest([
            this.projectService.getLayerDataStream(layer),
            this.projectService.getLayerMetadata(layer),
        ]).subscribe(
            ([data, metadata]) => {
                if (layer instanceof VectorLayer) {
                    this.processVectorLayer(layer, metadata as VectorLayerMetadata, data);
                } else if (layer instanceof RasterLayer) {
                    this.processRasterLayer(layer, metadata as RasterLayerMetadata, data);
                }
            },
            (_error) => {
                // TODO: cope with error
            },
        );
    }

    processVectorLayer(_layer: VectorLayer, metadata: VectorLayerMetadata, data: VectorData): void {
        this.displayedColumns = metadata.columns.keySeq().toArray();
        this.dataSource.data = data.data;
    }

    processRasterLayer(_layer: RasterLayer, _metadata: RasterLayerMetadata, _data: any): void {
        // TODO: implement

        this.emptyTable();
    }

    /**
     * Show an empty table when there is no data to display
     */
    emptyTable(): void {
        this.displayedColumns = [];
        this.dataSource.data = [];

        // TODO: implement some default message
    }

    @HostListener('window:resize')
    protected onResize(): void {
        this.setTableHeight();
    }

    /**
     * Dynamically adjust table height to be as high as the host style.height-property (in px)
     */
    protected setTableHeight(): void {
        const availableHeight = parseInt(this.hostElement.nativeElement.style.height, 10);

        const paginatorHeight = 56;
        const tableHeight = availableHeight - paginatorHeight;

        if (tableHeight !== this.tableHeight) {
            this.tableHeight = tableHeight;
        }
    }
}

/**
 * A custom data source that reacts on pagination and input data changes.
 *
 * It was necessary to implement it because it seems to be much faster than `MatTableDataSource`.
 */
class FeatureDataSource extends DataSource<OlFeature> {
    protected _data: Array<OlFeature> = [];
    protected data$ = new Subject<Array<OlFeature>>();

    protected _paginator: MatPaginator;
    protected paginatorSubscription: Subscription;

    constructor() {
        super();
    }

    set data(data: Array<OlFeature>) {
        this._data = data;

        if (this.paginator) {
            this.paginator.length = data.length;
            this.processPage();
        }
    }

    get data(): Array<OlFeature> {
        return this._data;
    }

    set paginator(paginator: MatPaginator) {
        if (this.paginatorSubscription) {
            this.paginatorSubscription.unsubscribe();
        }

        this._paginator = paginator;

        // update length wrt. data
        this.paginator.length = this.data.length;

        // subscribe to page events…
        this.paginatorSubscription = this.paginator.page.subscribe(() => this.processPage());

        // …but fire initial event
        this.processPage();
    }

    get paginator(): MatPaginator {
        return this._paginator;
    }

    connect(): Observable<Array<OlFeature>> {
        return this.data$;
    }

    /**
     * Clean up resources
     */
    disconnect(): void {
        if (this.paginatorSubscription) {
            this.paginatorSubscription.unsubscribe();
        }
    }

    /**
     * display a portion of the data
     */
    protected processPage(): void {
        const start = this.paginator.pageIndex * this.paginator.pageSize;
        const end = start + this.paginator.pageSize;

        if (start > this.data.length) {
            // reset paginator
            this.paginator.pageIndex = 0;

            this.processPage();
            return;
        }

        this.data$.next(this.data.slice(start, end));
    }
}
