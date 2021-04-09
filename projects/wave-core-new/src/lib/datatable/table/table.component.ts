import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
    ViewChild,
    AfterViewInit,
    OnDestroy,
    ElementRef,
    Input,
    OnChanges,
    SimpleChanges,
} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {BehaviorSubject, combineLatest, Observable, Subject, Subscription} from 'rxjs';
import {RasterLayerMetadata, VectorLayerMetadata} from '../../layers/layer-metadata.model';
import {Layer, RasterLayer, VectorLayer} from '../../layers/layer.model';
import {ResultTypes} from '../../operators/result-type.model';
import {Feature as OlFeature} from 'ol';
import {FeatureSelection, ProjectService} from '../../project/project.service';
import {VectorData} from '../../layers/layer-data.model';
import {DataSource} from '@angular/cdk/collections';

@Component({
    selector: 'wave-datatable',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    @Input() layer?: Layer;

    readonly layerTypes = ResultTypes.VECTOR_TYPES;

    selectedFeature$ = new BehaviorSubject<FeatureSelection>({feature: undefined});

    dataSource = new FeatureDataSource();
    displayedColumns: Array<string> = [];
    featureColumns: Array<string> = [];

    protected layerDataSubscription?: Subscription = undefined;
    protected selectedFeatureSubscription?: Subscription = undefined;

    constructor(protected readonly projectService: ProjectService, protected readonly hostElement: ElementRef<HTMLElement>) {}

    ngOnInit(): void {
        if (this.layer) {
            this.selectLayer(this.layer);
        } else {
            this.emptyTable();
        }

        this.selectedFeatureSubscription = this.projectService.getSelectedFeatureStream().subscribe((selection) => {
            this.selectedFeature$.next(selection);

            if (!!this.paginator) {
                for (let i = 0; i < this.dataSource.data.length; i++) {
                    const feature = this.dataSource.data[i];
                    if (((feature as any).ol_uid as number) === selection.feature) {
                        const page = Math.floor(i / this.paginator.pageSize);
                        this.paginator.pageIndex = page;
                        this.paginator.page.next({
                            pageIndex: page,
                            pageSize: this.paginator.pageSize,
                            length: this.paginator.length,
                        });
                    }
                }
            }
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.layer) {
            if (this.layer) {
                this.selectLayer(this.layer);
            } else {
                this.emptyTable();
            }
        }
    }

    ngAfterViewInit(): void {
        this.dataSource.paginator = this.paginator;
    }

    ngOnDestroy(): void {
        if (this.layerDataSubscription) {
            this.layerDataSubscription.unsubscribe();
        }

        if (this.selectedFeatureSubscription) {
            this.selectedFeatureSubscription.unsubscribe();
        }
    }

    selectLayer(layer: Layer): void {
        if (this.layerDataSubscription) {
            this.layerDataSubscription.unsubscribe();
        }

        const dataStream = this.projectService.getLayerDataStream(layer);
        const metadataStream = this.projectService.getLayerMetadata(layer);

        if (!dataStream || !metadataStream) {
            // layer was removed
            this.emptyTable();
            return;
        }

        this.layerDataSubscription = combineLatest([dataStream, metadataStream]).subscribe(
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
        this.featureColumns = metadata.columns.keySeq().toArray();
        this.displayedColumns = ['_____select'].concat(this.featureColumns);
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

    isSelected(feature: OlFeature): boolean {
        return ((feature as any).ol_uid as number) === this.selectedFeature$.value.feature;
    }

    select(feature: OlFeature, select: boolean): void {
        if (select) {
            this.projectService.setSelectedFeature(feature);
        } else {
            this.projectService.setSelectedFeature(undefined);
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

    protected _paginator?: MatPaginator;
    protected paginatorSubscription?: Subscription;

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

    set paginator(paginator: MatPaginator | undefined) {
        if (this.paginatorSubscription) {
            this.paginatorSubscription.unsubscribe();
        }

        this._paginator = paginator;

        if (!this.paginator) {
            return;
        }

        // update length wrt. data
        this.paginator.length = this.data.length;

        // subscribe to page events…
        this.paginatorSubscription = this.paginator.page.subscribe(() => this.processPage());

        // …but fire initial event
        this.processPage();
    }

    get paginator(): MatPaginator | undefined {
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
        if (!this.paginator) {
            return;
        }

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
