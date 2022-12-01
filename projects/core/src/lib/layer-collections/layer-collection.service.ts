import {Injectable} from '@angular/core';
import {BackendService} from '../backend/backend.service';
import {Observable, of} from 'rxjs';
import {UserService} from '../users/user.service';
import {mergeMap, tap} from 'rxjs/operators';
import {LayerCollectionDict, LayerDict, ProviderLayerIdDict, UUID} from '../backend/backend.model';

@Injectable({
    providedIn: 'root',
})
export class LayerCollectionService {
    constructor(protected backend: BackendService, protected userService: UserService) {
        userService.getBackendStatus().subscribe((status) => {
            if (!status.available) {
                this._layerIdToWorkflowIdMap.clear();
            }
        });
    }

    protected readonly _layerIdToWorkflowIdMap: Map<ProviderLayerIdDict, UUID> = new Map();

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

    registeredWorkflowForLayer(providerId: UUID, layerId: string): Observable<UUID> {
        const comboId: ProviderLayerIdDict = {providerId, layerId};
        if (this._layerIdToWorkflowIdMap.has(comboId)) {
            return of(this._layerIdToWorkflowIdMap.get(comboId) as UUID);
        }
        return this.userService
            .getSessionStream()
            .pipe(mergeMap((session) => this.backend.registerWorkflowForLayer(session.sessionToken, providerId, layerId)))
            .pipe(tap((workflowId) => this._layerIdToWorkflowIdMap.set(comboId, workflowId)));
    }
}
