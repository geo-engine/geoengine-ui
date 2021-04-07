import {Component, OnInit, ChangeDetectionStrategy, Input} from '@angular/core';
import {Dataset} from '../dataset.model';
import {DatasetService} from '../dataset.service';

@Component({
    selector: 'wave-dataset',
    templateUrl: './dataset.component.html',
    styleUrls: ['./dataset.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetComponent implements OnInit {
    @Input() dataset: Dataset;

    constructor(private datasetService: DatasetService) {}

    ngOnInit(): void {}

    add(): void {
        this.datasetService.addDatasetToMap(this.dataset).subscribe();
    }
}
