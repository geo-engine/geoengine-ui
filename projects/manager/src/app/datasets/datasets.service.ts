import {Injectable} from '@angular/core';
import {SessionService, apiConfigurationWithAccessKey} from '@geoengine/common';
import {Dataset, DatasetListing, DatasetsApi, MetaDataDefinition, OrderBy} from '@geoengine/openapi-client';
import {ReplaySubject, firstValueFrom} from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class DatasetsService {
    datasetApi = new ReplaySubject<DatasetsApi>(1);

    constructor(private sessionService: SessionService) {
        this.sessionService.getSessionStream().subscribe({
            next: (session) => this.datasetApi.next(new DatasetsApi(apiConfigurationWithAccessKey(session.id))),
        });
    }

    async getDataset(name: string): Promise<Dataset> {
        const datasetApi = await firstValueFrom(this.datasetApi);

        return datasetApi.getDatasetHandler({
            dataset: name,
        });
    }

    async getDatasets(offset = 0, limit = 20, filter?: string): Promise<DatasetListing[]> {
        const datasetApi = await firstValueFrom(this.datasetApi);

        return datasetApi.listDatasetsHandler({
            order: OrderBy.NameAsc,
            offset,
            limit,
            filter,
        });
    }

    async getLoadingInfo(datasetName: string): Promise<MetaDataDefinition> {
        const datasetApi = await firstValueFrom(this.datasetApi);

        return datasetApi.getLoadingInfoHandler({
            dataset: datasetName,
        });
    }
}
