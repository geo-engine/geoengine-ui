import {Injectable} from '@angular/core';
import {BackendService} from '../backend/backend.service';
import {Observable} from 'rxjs';
import {UserService} from '../users/user.service';
import {mergeMap} from 'rxjs/operators';
import {LayerCollectionItemDict, LayerCollectionLayerDict, UUID} from '../backend/backend.model';

@Injectable({
    providedIn: 'root',
})
export class LayerCollectionService {
    constructor(protected backend: BackendService, protected userService: UserService) {}

    getLayerCollectionItems(collection: UUID, offset = 0, limit = 20): Observable<Array<LayerCollectionItemDict>> {
        return this.userService
            .getSessionStream()
            .pipe(mergeMap((session) => this.backend.getLayerCollectionItems(session.sessionToken, collection, offset, limit)));
    }

    getRootLayerCollectionItems(offset = 0, limit = 20): Observable<Array<LayerCollectionItemDict>> {
        return this.userService
            .getSessionStream()
            .pipe(mergeMap((session) => this.backend.getRootLayerCollectionItems(session.sessionToken, offset, limit)));
    }

    getLayer(layer: UUID): Observable<LayerCollectionLayerDict> {
        return this.userService
            .getSessionStream()
            .pipe(mergeMap((session) => this.backend.getLayerCollectionLayer(session.sessionToken, layer)));
    }
}
