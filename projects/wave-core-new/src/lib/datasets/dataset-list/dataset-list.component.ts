import {Component, OnInit, ChangeDetectionStrategy, AfterViewInit, ViewChild, Input} from '@angular/core';
import {Dataset, DatasetId} from '../dataset.model';
import {DatasetService} from '../dataset.service';
import {DataSource} from '@angular/cdk/collections';
import {BehaviorSubject, EMPTY, Observable, Subject} from 'rxjs';
import {CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {filter, mergeMap, scan, tap} from 'rxjs/operators';
import {LayoutService} from '../../layout.service';
import {UUID} from '../../backend/backend.model';

@Component({
    selector: 'wave-dataset-list',
    templateUrl: './dataset-list.component.html',
    styleUrls: ['./dataset-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetListComponent implements OnInit, AfterViewInit {
    @ViewChild(CdkVirtualScrollViewport)
    viewport!: CdkVirtualScrollViewport;

    // leave undefined for internal datasets
    @Input() externalDatasetProviderId?: UUID = undefined;

    @Input() repositoryName = 'Data Repository';

    // TODO: dataset search

    // TODO: ordering of datasets

    readonly loadingSpinnerDiameterPx: number = 3 * LayoutService.remInPx;

    datasetSource?: DatasetDataSource;

    constructor(public datasetService: DatasetService) {}

    ngOnInit(): void {
        this.datasetSource = new DatasetDataSource(this.datasetService, this.externalDatasetProviderId);
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
            this.datasetSource?.fetchMoreData();
        }
    }

    trackById(_index: number, dataset: Dataset): DatasetId {
        return dataset.id;
    }
}

/**
 * A custom data source that allows fetching datasets for a virtual scroll source.
 */
class DatasetDataSource extends DataSource<Dataset> {
    readonly scrollFetchSize = 20;

    readonly loading$ = new BehaviorSubject(false);

    protected nextBatch$ = new Subject<void>();
    protected noMoreData = false;
    protected offset = 0;

    protected getDatasets: (offset: number, limit: number) => Observable<Array<Dataset>>;

    constructor(protected datasetService: DatasetService, protected externalDatasetProviderId?: UUID) {
        super();

        if (externalDatasetProviderId) {
            this.getDatasets = (offset, limit): Observable<Array<Dataset>> =>
                datasetService.getExternalDatasets(externalDatasetProviderId, offset, limit);
        } else {
            this.getDatasets = (offset, limit): Observable<Array<Dataset>> => datasetService.getDatasets(offset, limit);
        }

        this.fetchMoreData(); // initially populate source
    }

    connect(): Observable<Array<Dataset>> {
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

    protected getMoreDataFromServer(): Observable<Array<Dataset>> {
        if (this.noMoreData) {
            return EMPTY;
        }

        this.loading$.next(true);

        const offset = this.offset;
        const limit = this.scrollFetchSize;

        return this.getDatasets(offset, limit).pipe(
            tap((datasets) => {
                this.offset += datasets.length;

                if (datasets.length < limit) {
                    this.noMoreData = true;
                }

                this.loading$.next(false);
            }),
        );
    }
}
