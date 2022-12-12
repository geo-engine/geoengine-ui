import {Injectable} from '@angular/core';
import {BackendService} from '../backend/backend.service';
import {Observable} from 'rxjs';
import {UserService} from '../users/user.service';
import {map, mergeMap} from 'rxjs/operators';
import {LayerCollectionDict, LayerDict, ResultDescriptorDict, UUID} from '../backend/backend.model';
import {LayerMetadata, RasterLayerMetadata, VectorLayerMetadata} from '../layers/layer-metadata.model';

@Injectable({
    providedIn: 'root',
})
export class LayerCollectionService {
    constructor(protected backend: BackendService, protected userService: UserService) {}

    getLayerCollectionItems(provider: UUID, collection: string, offset = 0, limit = 20): Observable<LayerCollectionDict> {
        return this.userService
            .getSessionStream()
            .pipe(mergeMap((session) => this.backend.getLayerCollectionItems(session.sessionToken, provider, collection, offset, limit)));
    }

    getRootLayerCollectionItems(offset = 0, limit = 20): Observable<LayerCollectionDict> {
        return this.userService
            .getSessionStream()
            .pipe(mergeMap((session) => this.backend.getRootLayerCollectionItems(session.sessionToken, offset, limit)));
    }

    getLayer(provider: UUID, layer: string): Observable<LayerDict> {
        return this.userService
            .getSessionStream()
            .pipe(mergeMap((session) => this.backend.getLayerCollectionLayer(session.sessionToken, provider, layer)));
    }

    registerAndGetLayerWorkflowId(providerId: UUID, layerId: string): Observable<UUID> {
        return this.userService
            .getSessionStream()
            .pipe(mergeMap((session) => this.backend.registerWorkflowForLayer(session.sessionToken, providerId, layerId)));
    }

    getWorkflowIdMetadata(workflowId: UUID): Observable<VectorLayerMetadata | RasterLayerMetadata> {
        return this.getWorkflowIdMetadataDict(workflowId).pipe(map((workflowMetadataDict) => LayerMetadata.fromDict(workflowMetadataDict)));
    }

    getWorkflowIdMetadataDict(workflowId: UUID): Observable<ResultDescriptorDict> {
        return this.userService
            .getSessionStream()
            .pipe(mergeMap((session) => this.backend.getWorkflowMetadata(workflowId, session.sessionToken)));
    }
}
