import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {Observable} from 'rxjs';
import {Dataset} from '../dataset.model';
import {DatasetService} from '../dataset.service';
import {PageEvent} from '@angular/material/paginator';

@Component({
    selector: 'wave-dataset-list',
    templateUrl: './dataset-list.component.html',
    styleUrls: ['./dataset-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetListComponent implements OnInit {
    searchTerm = '';
    pageEvent: PageEvent | undefined;
    offset = 0;
    limit = 5;
    datasets: Observable<Array<Dataset>>;
    displayedColumns: string[] = ['id', 'name', 'description', 'add'];

    constructor(public datasetService: DatasetService) {
        this.datasets = this.datasetService.getDatasets(this.offset, this.limit);
    }

    ngOnInit(): void {}

    add(dataset: Dataset): void {
        this.datasetService.addDatasetToMap(dataset).subscribe();
    }

    onPaginationChange(event: PageEvent): void {
        const page = event.pageIndex;
        const size = event.pageSize;

        this.offset = page * size;
        this.limit = size;

        this.datasets = this.datasetService.getDatasets(this.offset, this.limit);
    }
}
