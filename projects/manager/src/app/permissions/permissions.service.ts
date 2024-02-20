import {Injectable} from '@angular/core';
import {SessionService, apiConfigurationWithAccessKey} from '@geoengine/common';
import {PermissionListing, PermissionsApi} from '@geoengine/openapi-client';
import {ReplaySubject, firstValueFrom} from 'rxjs';

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

    async getPermissions(resourceType: string, resourceId: string, offset = 0, limit = 20): Promise<PermissionListing[]> {
        const permissionsApi = await firstValueFrom(this.permissionsApi);

        return permissionsApi.getResourcePermissionsHandler({
            resourceType,
            resourceId,
            offset,
            limit,
        });
    }
}
