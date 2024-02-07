import {Injectable} from '@angular/core';
import {DatasetListing, DatasetsApi, MetaDataDefinition, OrderBy} from '@geoengine/openapi-client';
import {SessionService, apiConfigurationWithAccessKey} from '../session/session.service';
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
