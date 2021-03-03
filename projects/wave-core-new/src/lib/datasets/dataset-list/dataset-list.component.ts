import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {Observable} from 'rxjs';
import {DataSet} from '../dataset.model';
import {DataSetService} from '../dataset.service';

@Component({
    selector: 'wave-dataset-list',
    templateUrl: './dataset-list.component.html',
    styleUrls: ['./dataset-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetListComponent implements OnInit {
    searchTerm: string = '';
    // TODO: paginated data source
    datasets: Observable<Array<DataSet>>;

    constructor(public dataSetService: DataSetService) {
        this.datasets = this.dataSetService.getDataSets();
    }

    ngOnInit(): void {}
}
