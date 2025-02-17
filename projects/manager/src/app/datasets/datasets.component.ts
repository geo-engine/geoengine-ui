import {Component, ViewChild} from '@angular/core';
import {DatasetListing} from '@geoengine/openapi-client';
import {BehaviorSubject} from 'rxjs';
import {DatasetListComponent} from './dataset-list/dataset-list.component';

@Component({
    selector: 'geoengine-manager-datasets',
    templateUrl: './datasets.component.html',
    styleUrl: './datasets.component.scss',
    standalone: false,
})
export class DatasetsComponent {
    @ViewChild(DatasetListComponent) datasetList!: DatasetListComponent;

    selectedDataset$: BehaviorSubject<DatasetListing | undefined> = new BehaviorSubject<DatasetListing | undefined>(undefined);

    constructor() {}

    selectDataset(dataset: DatasetListing): void {
        this.selectedDataset$.next(dataset);
    }

    datasetDeleted(): void {
        this.datasetList.backToAllDatasets();
        this.selectedDataset$.next(undefined);
    }
}
