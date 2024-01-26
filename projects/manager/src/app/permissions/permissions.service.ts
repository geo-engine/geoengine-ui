import {Injectable} from '@angular/core';
import {PermissionListing, PermissionsApi} from '@geoengine/openapi-client';
import {Observable, ReplaySubject, mergeMap} from 'rxjs';
import {SessionService, apiConfigurationWithAccessKey} from '../session/session.service';

@Injectable({
    providedIn: 'root',
})
export class PermissionsService {
    permissionsApi = new ReplaySubject<PermissionsApi>(1);

    constructor(private sessionService: SessionService) {
        this.sessionService.getSessionStream().subscribe({
            next: (session) => this.permissionsApi.next(new PermissionsApi(apiConfigurationWithAccessKey(session.id))),
        });
    }

    getPermissions(resourceType: string, resourceId: string, offset = 0, limit = 20): Observable<PermissionListing[]> {
        return this.permissionsApi.pipe(
            mergeMap((api) =>
                api.getResourcePermissionsHandler({
                    resourceType,
                    resourceId,
                    offset,
                    limit,
                }),
            ),
        );
    }
}
