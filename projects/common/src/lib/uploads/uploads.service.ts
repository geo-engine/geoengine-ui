import {Injectable} from '@angular/core';
import {UploadFileLayersResponse, UploadsApi} from '@geoengine/openapi-client';
import {ReplaySubject, firstValueFrom} from 'rxjs';
import {UserService, apiConfigurationWithAccessKey} from '../user/user.service';

@Injectable({
    providedIn: 'root',
})
export class UploadsService {
    uploadsApi = new ReplaySubject<UploadsApi>(1);

    constructor(private sessionService: UserService) {
        this.sessionService.getSessionStream().subscribe({
            next: (session) => this.uploadsApi.next(new UploadsApi(apiConfigurationWithAccessKey(session.id))),
        });
    }

    async getUploadFileLayers(uploadId: string, fileName: string): Promise<UploadFileLayersResponse> {
        const uploadsApi = await firstValueFrom(this.uploadsApi);

        return uploadsApi.listUploadFileLayersHandler({uploadId, fileName});
    }
}
