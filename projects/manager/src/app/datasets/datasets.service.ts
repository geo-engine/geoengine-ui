import {Injectable} from '@angular/core';
import {DatasetListing, DatasetsApi, MetaDataDefinition, OrderBy} from '@geoengine/openapi-client';
import {SessionService, apiConfigurationWithAccessKey} from '../session/session.service';
import {Observable, ReplaySubject, mergeMap} from 'rxjs';

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

    getDatasets(offset = 0, limit = 20, filter?: string): Observable<DatasetListing[]> {
        return this.datasetApi.pipe(
            mergeMap((api) =>
                api.listDatasetsHandler({
                    order: OrderBy.NameAsc,
                    offset,
                    limit,
                    filter,
                }),
            ),
        );
    }

    getLoadingInfo(datasetName: string): Observable<MetaDataDefinition> {
        return this.datasetApi.pipe(
            mergeMap((api) =>
                api.getLoadingInfoHandler({
                    dataset: datasetName,
                }),
            ),
        );
    }
}
