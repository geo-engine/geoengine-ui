import {Component, OnInit, ChangeDetectionStrategy, Input} from '@angular/core';
import {DatasetService} from '../dataset.service';
import {createIconDataUrl, Dataset} from '@geoengine/common';
import {MatListItem, MatListItemIcon, MatListItemTitle, MatListItemLine} from '@angular/material/list';
import {MatTooltip} from '@angular/material/tooltip';

@Component({
    selector: 'geoengine-dataset',
    templateUrl: './dataset.component.html',
    styleUrls: ['./dataset.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatListItem, MatListItemIcon, MatListItemTitle, MatTooltip, MatListItemLine],
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
