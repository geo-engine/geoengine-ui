import {DataSource} from '@angular/cdk/collections';
import {CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {AfterContentInit, Component, EventEmitter, Output, ViewChild} from '@angular/core';
import {DatasetListing} from '@geoengine/openapi-client';
import {BehaviorSubject, EMPTY, Observable, Subject, concatMap, range, scan, startWith, tap} from 'rxjs';
import {DatasetsService} from '../datasets.service';

@Component({
    selector: 'geoengine-manager-dataset-list',
    templateUrl: './dataset-list.component.html',
    styleUrl: './dataset-list.component.scss',
})
export class DatasetListComponent implements AfterContentInit {
    @ViewChild(CdkVirtualScrollViewport)
    viewport!: CdkVirtualScrollViewport;

    @Output()
    selectDataset = new EventEmitter<DatasetListing>();

    readonly itemSizePx = 72;

    readonly loadingSpinnerDiameterPx: number = 3 * parseFloat(getComputedStyle(document.documentElement).fontSize);

    source?: DatasetDataSource;

    selectedDataset$ = new BehaviorSubject<DatasetListing | undefined>(undefined);

    constructor(private readonly datasetsService: DatasetsService) {}

    ngAfterContentInit(): void {
        this.setUpSource();
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

    trackById(_index: number, item: DatasetListing): string {
        return item.id;
    }

    select(item: DatasetListing): void {
        this.selectedDataset$.next(item);
        this.selectDataset.emit(item);
    }

    protected setUpSource(): void {
        this.source = new DatasetDataSource(this.datasetsService);

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
class DatasetDataSource extends DataSource<DatasetListing> {
    // cannot increase this, since it is limited by the server
    readonly scrollFetchSize = 20;

    readonly loading$ = new BehaviorSubject(false);

    protected nextBatch$ = new Subject<number>();
    protected noMoreData = false;
    protected offset = 0;

    constructor(private datasetsService: DatasetsService) {
        super();
    }

    init(numberOfElements: number): void {
        this.fetchMoreData(Math.ceil(numberOfElements / this.scrollFetchSize)); // initially populate source
    }

    connect(): Observable<Array<DatasetListing>> {
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

    protected getMoreDataFromServer(): Observable<Array<DatasetListing>> {
        if (this.noMoreData) {
            return EMPTY;
        }

        this.loading$.next(true);

        const offset = this.offset;
        const limit = this.scrollFetchSize;

        return this.datasetsService.getDatasets(offset, limit).pipe(
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
