import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {Observable} from 'rxjs';
import {Dataset} from '../dataset.model';
import {DatasetService} from '../dataset.service';

@Component({
    selector: 'wave-dataset-list',
    templateUrl: './dataset-list.component.html',
    styleUrls: ['./dataset-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetListComponent implements OnInit {
    searchTerm = '';
    // TODO: paginated data source
    datasets: Observable<Array<Dataset>>;

    constructor(public datasetService: DatasetService) {
        this.datasets = this.datasetService.getDatasets();
    }

    ngOnInit(): void {}
}
