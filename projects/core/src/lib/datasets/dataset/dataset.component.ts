import {Component, OnInit, ChangeDetectionStrategy, Input} from '@angular/core';
import {createIconDataUrl} from '../../util/icons';
import {DatasetService} from '../dataset.service';
import {Dataset} from '@geoengine/common';

@Component({
    selector: 'geoengine-dataset',
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
        // this.datasetService.addDatasetToMap(this.dataset).subscribe();
    }
}
