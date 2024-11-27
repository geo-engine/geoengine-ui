import {DataSource} from '@angular/cdk/collections';
import {AfterViewInit, ChangeDetectionStrategy, Component, signal, ViewChild} from '@angular/core';
import {Observable, Subject, tap} from 'rxjs';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {UserService} from '@geoengine/common';
import {MatTableModule} from '@angular/material/table';
import {ComputationQuota, OperatorQuota} from '@geoengine/openapi-client';
import {MatButtonModule} from '@angular/material/button';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatIconModule} from '@angular/material/icon';

@Component({
    selector: 'geoengine-quota-log',
    templateUrl: './quota-log.component.html',
    styleUrl: './quota-log.component.scss',
    standalone: true,
    imports: [MatTableModule, MatPaginatorModule, MatProgressBarModule, MatButtonModule, MatIconModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuotaLogComponent implements AfterViewInit {
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    readonly loadingSpinnerDiameterPx: number = 3 * parseFloat(getComputedStyle(document.documentElement).fontSize);

    source!: QuotaLogDataSource;

    displayedColumns: string[] = ['timestamp', 'computationId', 'workflowId', 'count', 'details'];
    displayedDetailsColumns: string[] = ['name', 'path', 'count'];

    readonly detailsVisible = signal(false);
    readonly details = signal<OperatorQuota[] | undefined>(undefined);

    constructor(private readonly userService: UserService) {
        this.setUpSource();
    }

    ngAfterViewInit(): void {
        this.paginator.page.pipe(tap(() => this.loadQuotaLogsPage())).subscribe();
    }

    async showDetails(element: ComputationQuota): Promise<void> {
        this.detailsVisible.set(true);
        const quota = await this.userService.computationQuota(element.computationId);
        this.details.set(quota);
    }

    hideDetails(): void {
        this.details.set(undefined);
        this.detailsVisible.set(false);
    }

    protected loadQuotaLogsPage(): void {
        this.source.loadQuotaLogs(this.paginator.pageIndex, this.paginator.pageSize);
    }

    protected setUpSource(): void {
        this.source = new QuotaLogDataSource(this.userService, this.paginator);
        this.source.loadQuotaLogs(0, 5);
    }
}

/**
 * A custom data source that allows fetching datasets for a virtual scroll source.
 */
class QuotaLogDataSource extends DataSource<ComputationQuota> {
    readonly loading = signal(false);

    protected quotas$ = new Subject<Array<ComputationQuota>>();

    constructor(
        private userService: UserService,
        private paginator: MatPaginator,
    ) {
        super();
    }

    connect(): Observable<Array<ComputationQuota>> {
        return this.quotas$.asObservable();
    }

    /**
     * Clean up resources
     */
    disconnect(): void {
        this.quotas$.complete();
    }

    loadQuotaLogs(pageIndex: number, pageSize: number): void {
        this.loading.set(true);

        this.userService.computationsQuota(pageIndex * pageSize, pageSize).then((logs) => {
            this.loading.set(false);
            if (this.paginator && logs.length === pageSize) {
                // we do not know the number of items in total, so instead for each full page set the length to show the "next" button
                this.paginator.length = (pageIndex + 1) * pageSize + 1;
            }

            this.quotas$.next(logs);
        });
    }
}
