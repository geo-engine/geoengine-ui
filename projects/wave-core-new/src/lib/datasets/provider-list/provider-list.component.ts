import {Component, ChangeDetectionStrategy} from '@angular/core';
import {Observable} from 'rxjs';
import {DataSetProviderListingDict} from '../../backend/backend.model';
import {LayoutService} from '../../layout.service';
import {DatasetListComponent} from '../dataset-list/dataset-list.component';
import {DatasetService} from '../dataset.service';

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

    show(provider: DataSetProviderListingDict): void {
        this.layoutService.setSidenavContentComponent({
            component: DatasetListComponent,
            config: {externalDatasetProviderId: provider.id, repositoryName: provider.name},
            keepParent: true,
        });
    }
}
