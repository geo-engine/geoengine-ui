import {Component, ChangeDetectionStrategy} from '@angular/core';
import {Observable} from 'rxjs';
import {DataSetProviderListingDict, UUID} from '../../backend/backend.model';
import {LayoutService} from '../../layout.service';
import {DatasetService} from '../dataset.service';
import {ExternalDatasetListComponent} from '../external-dataset-list/external-dataset-list.component';

@Component({
    selector: 'wave-provider-list',
    templateUrl: './provider-list.component.html',
    styleUrls: ['./provider-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProviderListComponent {
    providers: Observable<Array<DataSetProviderListingDict>>;

    constructor(protected readonly datasetService: DatasetService, protected readonly layoutService: LayoutService) {
        this.providers = this.datasetService.getDatasetProviders();
    }

    show(providerId: UUID): void {
        this.layoutService.setSidenavContentComponent({component: ExternalDatasetListComponent, config: {providerId}});
    }
}
