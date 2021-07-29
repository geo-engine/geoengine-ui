import {Component, OnInit, ChangeDetectionStrategy, AfterViewInit, ViewChild} from '@angular/core';
import {Dataset} from '../dataset.model';
import {DatasetService} from '../dataset.service';
import {DataSource} from '@angular/cdk/collections';
import {BehaviorSubject, Observable, Subject, Subscription} from 'rxjs';
import {CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {filter} from 'rxjs/operators';
import {Config} from '../../config.service';
import {LayoutService} from '../../layout.service';

@Component({
    selector: 'wave-dataset-list',
    templateUrl: './dataset-list.component.html',
    styleUrls: ['./dataset-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetListComponent implements OnInit, AfterViewInit {
    @ViewChild(CdkVirtualScrollViewport)
    viewport!: CdkVirtualScrollViewport;

    // TODO: dataset search

    // TODO: ordering of datasets

    readonly loadingSpinnerDiameterPx: number = 3 * LayoutService.remInPx;

    readonly datasetSource: DatasetDataSource;

    constructor(public datasetService: DatasetService, protected config: Config) {
        this.datasetSource = new DatasetDataSource(this.datasetService, this.config);
    }

    ngOnInit(): void {}

    ngAfterViewInit(): void {}

    /**
     * Fetch new data when scrolled to the end of the list.
     */
    onScrolledIndexChange(_scrolledIndex: number): void {
        const end = this.viewport.getRenderedRange().end;
        const total = this.viewport.getDataLength();

        // only fetch when scrolled to the end
        if (end >= total) {
            this.datasetSource.fetchMoreData();
        }
    }
}

/**
 * A custom data source that allows fetching datasets for a virtual scroll source.
 */
class DatasetDataSource extends DataSource<Dataset> {
    readonly scrollFetchSize = 3;
    readonly debounceTime: number;

    readonly loading$ = new BehaviorSubject(false);

    protected data$ = new BehaviorSubject<Array<Dataset>>([]);

    protected datasetService: DatasetService;

    protected moreData$ = new Subject<void>();
    protected moreDataSubscription?: Subscription;
    protected noMoreData = false;

    constructor(datasetService: DatasetService, config: Config) {
        super();

        this.debounceTime = config.DELAYS.DEBOUNCE;

        this.datasetService = datasetService;

        this.fetchMoreData(); // initially populate source
    }

    connect(): Observable<Array<Dataset>> {
        this.moreDataSubscription = this.moreData$.pipe(filter(() => !this.loading$.value)).subscribe(() => {
            this.getMoreDataFromServer();
        });

        return this.data$;
    }

    /**
     * Clean up resources
     */
    disconnect(): void {
        this.moreDataSubscription?.unsubscribe();
    }

    fetchMoreData(): void {
        this.moreData$.next();
    }

    protected getMoreDataFromServer(): void {
        if (this.noMoreData) {
            return;
        }

        this.loading$.next(true);

        const offset = this.data$.value.length;
        const limit = this.scrollFetchSize;

        this.datasetService.getDatasets(offset, limit).subscribe((datasets) => {
            const data = this.data$.value;
            data.push(...datasets);
            this.data$.next(data);

            if (datasets.length < limit) {
                this.noMoreData = true;
            }

            this.loading$.next(false);
        });
    }
}
