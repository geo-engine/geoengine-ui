import {Component, ViewChild} from '@angular/core';
import {DatasetListing} from '@geoengine/openapi-client';
import {BehaviorSubject} from 'rxjs';
import {DatasetListComponent} from './dataset-list/dataset-list.component';
import {DatasetEditorComponent} from './dataset-editor/dataset-editor.component';
import {AsyncPipe} from '@angular/common';

@Component({
    selector: 'geoengine-manager-datasets',
    templateUrl: './datasets.component.html',
    styleUrl: './datasets.component.scss',
    imports: [DatasetListComponent, DatasetEditorComponent, AsyncPipe],
})
export class DatasetsComponent {
    @ViewChild(DatasetListComponent) datasetList!: DatasetListComponent;

    selectedDataset$: BehaviorSubject<DatasetListing | undefined> = new BehaviorSubject<DatasetListing | undefined>(undefined);

    selectDataset(dataset: DatasetListing | undefined): void {
        this.selectedDataset$.next(dataset);
    }

    datasetDeleted(): void {
        this.datasetList.backToAllDatasets();
        this.selectedDataset$.next(undefined);
    }
}
