import {Component} from '@angular/core';
import {DatasetsService} from '@geoengine/common';
import {DatasetListing} from '@geoengine/openapi-client';
import {BehaviorSubject} from 'rxjs';

@Component({
    selector: 'geoengine-manager-datasets',
    templateUrl: './datasets.component.html',
    styleUrl: './datasets.component.scss',
})
export class DatasetsComponent {
    selectedDataset$: BehaviorSubject<DatasetListing | undefined> = new BehaviorSubject<DatasetListing | undefined>(undefined);

    constructor() {}

    selectDataset(dataset: DatasetListing): void {
        this.selectedDataset$.next(dataset);
    }
}
