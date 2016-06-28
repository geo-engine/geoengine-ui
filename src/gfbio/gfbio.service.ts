
import {Injectable} from '@angular/core';
import { Observable} from 'rxjs/Rx';
import {Http} from '@angular/http';

import {UserService} from '../users/user.service';
import {MappingRequestParameters, ParametersType} from '../queries/request-parameters.model';
import {AbcdArchive} from '../models/abcd.model';

class GfbioServiceRequestParameters extends MappingRequestParameters {
    constructor(config: {
        request: string,
        sessionToken: string,
        parameters?: ParametersType
    }) {
        super({
            service: 'gfbio',
            request: config.request,
            sessionToken: config.sessionToken,
            parameters: config.parameters,
        });
    }
}

@Injectable()
export class GfbioService extends UserService {
    constructor(http: Http) {
        super(http);
    }
    /**
     * Get as stream of Abcd sources depending on the logged in user.
     */
    getAbcdArchivesStream(): Observable<Array<AbcdArchive>> {
        interface AbcdResponse {
            archives: Array<AbcdArchive>;
            result: boolean;
        }

        return this.getSessionStream().switchMap(session => {
            const parameters = new GfbioServiceRequestParameters({
                request: 'abcd',
                sessionToken: session.sessionToken,
            });
            return this.request(parameters).then(
                response => response.json()
            ).then((abcdResponse: AbcdResponse) => abcdResponse.archives);

        });
    }

}
