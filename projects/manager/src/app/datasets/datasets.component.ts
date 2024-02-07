import {Component} from '@angular/core';
import {DatasetListing} from '@geoengine/openapi-client';
import {BehaviorSubject} from 'rxjs';
import {DatasetsService} from './datasets.service';

@Component({
    selector: 'geoengine-manager-datasets',
    templateUrl: './datasets.component.html',
    styleUrl: './datasets.component.scss',
})
export class DatasetsComponent {
    selectedDataset$: BehaviorSubject<DatasetListing | undefined> = new BehaviorSubject<DatasetListing | undefined>(undefined);

    constructor(private readonly datasetsService: DatasetsService) {}

    selectDataset(dataset: DatasetListing): void {
        this.selectedDataset$.next(dataset);
    }
}
