import {Component, OnInit, ChangeDetectionStrategy, Input} from '@angular/core';
import {DataSet} from '../dataset.model';
import {DataSetService} from '../dataset.service';

@Component({
    selector: 'wave-dataset',
    templateUrl: './dataset.component.html',
    styleUrls: ['./dataset.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataSetComponent implements OnInit {
    @Input() dataset: DataSet;

    constructor(private datasetService: DataSetService) {}

    ngOnInit(): void {}

    add(): void {
        this.datasetService.addDataSetToMap(this.dataset).subscribe();
    }
}
