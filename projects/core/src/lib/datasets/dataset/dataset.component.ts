import {Component, OnInit, ChangeDetectionStrategy, Input} from '@angular/core';
import {createIconDataUrl} from '../../util/icons';
import {Dataset} from '../dataset.model';
import {DatasetService} from '../dataset.service';

@Component({
    selector: 'ge-dataset',
    templateUrl: './dataset.component.html',
    styleUrls: ['./dataset.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetComponent implements OnInit {
    @Input() dataset!: Dataset;

    datasetType: 'Raster' | 'Vector' = 'Raster';
    datasetImg = '';

    constructor(private datasetService: DatasetService) {}

    ngOnInit(): void {
        this.datasetType = this.dataset.resultDescriptor.getTypeString();
        this.datasetImg = createIconDataUrl(this.datasetType);
    }

    add(): void {
        this.datasetService.addDatasetToMap(this.dataset).subscribe();
    }
}
