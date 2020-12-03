import {Inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {Observable} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';

import {Config, MappingRequestParameters, NotificationService, ParametersType, UserService} from 'wave-core';

import {AppConfig} from '../app-config.service';
import {AbcdArchive} from '../operators/dialogs/abcd-repository/abcd.model';
import {Basket} from '../operators/dialogs/baskets/gfbio-basket.model';
import {CsvColumn} from '../operators/dialogs/baskets/csv.model';

@Injectable()
export class GFBioUserService extends UserService {

    constructor(@Inject(Config) protected readonly config: AppConfig,
                protected readonly http: HttpClient,
                protected readonly notificationService: NotificationService) {
        super(config, http, notificationService);
    }

    /**
     * Get the schema of a source operator. TODO: this should be replaced by a generic service call, which resolves the shema of a source.
     */
    getSourceSchemaAbcd(): Observable<Array<CsvColumn>> {
        const jsonUrl = './assets/abcd-mandatory-fields.json';

        return this.http.get<Array<CsvColumn>>(jsonUrl);
    }

    /**
     * Get as stream of Abcd sources depending on the logged in user.
     */
    getAbcdArchivesStream(): Observable<Array<AbcdArchive>> {
        interface AbcdResponse {
            archives: Array<AbcdArchive>;
            result: boolean;
        }

        return super.getSessionStream().pipe(switchMap(session => {
            const parameters = new GfbioServiceRequestParameters({
                request: 'abcd',
                sessionToken: session.sessionToken,
            });
            return super.request<AbcdResponse>(parameters).pipe(map(abcdResponse => abcdResponse.archives));
        }));
    }

    /**
     * Get as stream of GFBio baskets sources depending on the logged in user.
     */
    getGfbioBasketStream(): Observable<Array<Basket>> {
        interface GfbioBasketResponse {
            baskets: Array<Basket>;
            result: boolean;
        }

        return super.getSessionStream().pipe(switchMap(session => {
            const parameters = new GfbioServiceRequestParameters({
                request: 'baskets',
                sessionToken: session.sessionToken,
            });
            return super.request<GfbioBasketResponse>(parameters).pipe(map(gfbioBasketResponse => gfbioBasketResponse.baskets));
        }));
    }

    /**
     * Login using an OpenId Connect access token
     *
     * @returns `true` if the login was succesful, `false` otherwise.
     */
    oidcLogin(accessToken: string): Observable<boolean> {
        const parameters = new OidcServiceRequestParameters({
            sessionToken: undefined,
            request: 'login',
            parameters: {access_token: accessToken},
        });

        return super.loginRequestToUserDetails(parameters);
    }

    /**
     * Redirect current app to SSO page
     */
    redirectToOidcProvider(payload?: string) {
        const url = this.config.GFBIO.SSO.URL;
        const client_id = this.config.GFBIO.SSO.CLIENT_ID;
        const scope = this.config.GFBIO.SSO.SCOPE;
        const state = payload ? `&state=${encodeURIComponent(payload)}` : '';
        window.location.href = `${url}?client_id=${client_id}&response_type=token&scope=${scope}${state}`;
    }

    setIntroductoryPopup(show: boolean) {
        localStorage.setItem('showIntroductoryPopup', JSON.stringify(show));
    }

    shouldShowIntroductoryPopup(): boolean {
        const show = localStorage.getItem('showIntroductoryPopup');
        return show === null || JSON.parse(show);
    }

}

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

class OidcServiceRequestParameters extends MappingRequestParameters {
    constructor(config: {
        request: string,
        sessionToken: string,
        parameters?: ParametersType
    }) {
        super({
            service: 'oidc',
            request: config.request,
            sessionToken: config.sessionToken,
            parameters: config.parameters,
        });
    }
}
