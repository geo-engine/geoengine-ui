import {Injectable} from '@angular/core';
import {
    Dataset,
    DatasetListing,
    DatasetsApi,
    MetaDataDefinition,
    MetaDataSuggestion,
    OrderBy,
    SuggestMetaDataHandlerRequest,
    Symbology,
} from '@geoengine/openapi-client';
import {ReplaySubject, firstValueFrom} from 'rxjs';
import {SessionService, apiConfigurationWithAccessKey} from '../session/session.service';

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

    async suggestMetaData(suggest: SuggestMetaDataHandlerRequest): Promise<MetaDataSuggestion> {
        const datasetApi = await firstValueFrom(this.datasetApi);

        return datasetApi.suggestMetaDataHandler(suggest);
    }

    async updateSymbology(datasetName: string, symbology: Symbology): Promise<void> {
        const datasetApi = await firstValueFrom(this.datasetApi);

        return datasetApi.updateDatasetSymbologyHandler({
            dataset: datasetName,
            symbology,
        });
    }
}
