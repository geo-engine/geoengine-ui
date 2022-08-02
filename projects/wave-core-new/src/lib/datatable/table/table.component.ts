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
    ChangeDetectorRef,
} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {combineLatest, Observable, Subject, Subscription} from 'rxjs';
import {RasterLayerMetadata, VectorLayerMetadata} from '../../layers/layer-metadata.model';
import {Layer, RasterLayer, VectorLayer} from '../../layers/layer.model';
import {ResultTypes} from '../../operators/result-type.model';
import {Feature as OlFeature} from 'ol';
import {FeatureSelection, ProjectService} from '../../project/project.service';
import {VectorData} from '../../layers/layer-data.model';
import {DataSource} from '@angular/cdk/collections';
import OlGeometry from 'ol/geom/Geometry';
import OlPolygon from 'ol/geom/Polygon';
import {MatDialog} from '@angular/material/dialog';
import {FullDisplayComponent} from './full-display/full-display.component';

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

    // selectedFeature$ = new BehaviorSubject<FeatureSelection>({feature: undefined});

    dataSource = new FeatureDataSource();
    displayedColumns: Array<string> = [];
    featureColumns: Array<string> = [];

    protected layerDataSubscription?: Subscription = undefined;
    protected selectedFeatureSubscription?: Subscription = undefined;

    constructor(
        protected readonly dialog: MatDialog,
        protected readonly projectService: ProjectService,
        protected readonly hostElement: ElementRef<HTMLElement>,
        protected readonly changeDetectorRef: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        if (this.layer) {
            this.selectLayer(this.layer);
        } else {
            this.emptyTable();
        }

        this.selectedFeatureSubscription = this.projectService.getSelectedFeatureStream().subscribe((selection) => {
            this.changeDetectorRef.markForCheck();
            this.navigatePage(selection);
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
        this.featureColumns = metadata.dataTypes.keySeq().toArray();
        this.displayedColumns = ['_____select', '_____coordinates', '_____table__start', '_____table__end'].concat(this.featureColumns);
        this.dataSource.data = data.data;
        setTimeout(() => this.navigatePage(this.projectService.getSelectedFeature()));
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

    isSelected(feature: OlFeature<OlGeometry>): boolean {
        return feature.getId() === this.projectService.getSelectedFeature().feature;
    }

    coordinateFromGeometry(geometry: OlFeature): string {
        // For truncated coordinate view in table
        const coords: string[][] = this.readCoordinates(geometry);
        const contd: string = coords[0].length > 1 ? '...' : '';
        const output = ` ${coords[0][0]}, ${coords[1][0]} ${contd}`;
        return output;
    }

    /**
     * Extracts the coordinates of an open layers feature as strings
     *
     * @param geometry The feature to extract coordinates from
     * @returns A nested string[][] where index 0 of the outer array are x-Coordinates, index 1 are y-Coordinates
     */
    readCoordinates(geometry: OlFeature): string[][] {
        const type: string = geometry.getGeometry()?.getType();
        const xCoords: string[] = [];
        const yCoords: string[] = [];

        if (!(type === 'Polygon' || type === 'MultiPolygon' || type === 'LineString' || type === 'MultiLineString' || type === 'Point')) {
            xCoords.push('N/A');
            yCoords.push('N/A');
            return new Array(xCoords, yCoords);
        }

        const poly: OlPolygon = geometry.getGeometry() as OlPolygon;
        const l = poly.getCoordinates().length;
        let allCoords: string[] = [];
        for (let i = 0; i < l; i++) {
            const coord = poly.getCoordinates()[i].toString().split(',');
            allCoords = allCoords.concat(coord);
        }
        for (let i = 0; i < allCoords.length - 1; i += 2) {
            xCoords.push(allCoords[i]);
            yCoords.push(allCoords[i + 1]);
        }
        return new Array(xCoords, yCoords);
    }

    onFullDisplayClick(output: OlFeature): void {
        const coords: string[][] = this.readCoordinates(output);
        this.dialog.open(FullDisplayComponent, {data: {xStrings: coords[0], yStrings: coords[1], geometry: output.getGeometry()}});
    }

    readTimePropertyStart(geometry: OlFeature): string {
        const minimum = '-262144-01-01T00:00:00+00:00';
        const result = geometry['values_']['_____table__start'];
        return result === minimum ? '-∞' : result;
    }

    readTimePropertyEnd(geometry: OlFeature): string {
        const maximum = '+262143-12-31T23:59:59.999+00:00';
        const result: string = geometry['values_']['_____table__end'];
        return result === maximum ? '∞' : result;
    }

    select(feature: OlFeature<OlGeometry>, select: boolean): void {
        if (select) {
            this.projectService.setSelectedFeature(feature);
        } else {
            this.projectService.setSelectedFeature(undefined);
        }
    }

    protected navigatePage(selection: FeatureSelection): void {
        if (!this.paginator) {
            return;
        }

        for (let i = 0; i < this.dataSource.data.length; i++) {
            const feature = this.dataSource.data[i];
            if (feature.getId() === selection.feature) {
                const page = Math.floor(i / this.paginator.pageSize);
                this.paginator.pageIndex = page;
                this.paginator.page.next({
                    pageIndex: page,
                    pageSize: this.paginator.pageSize,
                    length: this.paginator.length,
                });
                break;
            }
        }
    }
}

/**
 * A custom data source that reacts on pagination and input data changes.
 *
 * It was necessary to implement it because it seems to be much faster than `MatTableDataSource`.
 */
class FeatureDataSource extends DataSource<OlFeature<OlGeometry>> {
    protected _data: Array<OlFeature<OlGeometry>> = [];
    protected data$ = new Subject<Array<OlFeature<OlGeometry>>>();

    protected _paginator?: MatPaginator;
    protected paginatorSubscription?: Subscription;

    constructor() {
        super();
    }

    set data(data: Array<OlFeature<OlGeometry>>) {
        this._data = data;

        if (this.paginator) {
            this.paginator.length = data.length;
            this.processPage();
        }
    }

    get data(): Array<OlFeature<OlGeometry>> {
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

    connect(): Observable<Array<OlFeature<OlGeometry>>> {
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
