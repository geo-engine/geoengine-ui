import {Inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {Observable, of, throwError} from 'rxjs';
import {map, mergeMap, switchMap} from 'rxjs/operators';

import {Config, MappingRequestParameters, NotificationService, ParametersType, RequestParameters, UserService} from 'wave-core';

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
     * Get the GFBio login token from the portal.
     * Get the GFBio login token from the portal.
     */
    getGFBioToken(credentials: { username: string, password: string }): Observable<string> {
        const parameters = new GFBioPortalLoginRequestParameters(credentials);

        return this.http.get<string | { exception: string, message: string }>(
            this.config.GFBIO.LIFERAY_PORTAL_URL + 'api/jsonws/GFBioProject-portlet.basket/get-token',
            {headers: parameters.getHeaders()}
        ).pipe(
            mergeMap(response => {
                if (typeof response === 'string') {
                    return of(response); // token
                } else {
                    return throwError(response.message);
                }
            }),
        );
    }

    /**
     * Login using gfbio credentials. If it was successful, set a new user.
     * @param credentials.user The user name.
     * @param credentials.password The user's password.
     * @returns `true` if the login was succesful, `false` otherwise.
     */
    gfbioLogin(credentials: { user: string, password: string, staySignedIn?: boolean }): Observable<boolean> {
        if (!credentials.staySignedIn) {
            credentials.staySignedIn = true;
        }

        const token$ = this.getGFBioToken({
            username: credentials.user,
            password: credentials.password,
        });
        return token$.pipe(mergeMap(token => {
                const parameters = new MappingRequestParameters({
                    service: 'gfbio',
                    sessionToken: undefined,
                    request: 'login',
                    parameters: {token},
                });
                return this.request<{ result: string | boolean, session: string }>(parameters).pipe(
                    map(response => {
                        const success = typeof response.result === 'boolean' && response.result === true;

                        if (success) {
                            this.session$.next({
                                user: credentials.user,
                                sessionToken: response.session,
                                staySignedIn: credentials.staySignedIn,
                                isExternallyConnected: true,
                            });
                        }

                        return success;
                    }));
            }
        ));
    }

    /**
     * Login using the gfbio token. If it was successful, set a new user.
     * @param token The user's token.
     * @returns `true` if the login was succesful, `false` otherwise.
     */
    gfbioTokenLogin(token: string): Observable<boolean> {
        const parameters = new MappingRequestParameters({
            service: 'gfbio',
            sessionToken: undefined,
            request: 'login',
            parameters: {token},
        });

        return super.loginRequestToUserDetails(parameters);
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

class GFBioPortalLoginRequestParameters extends RequestParameters {
    constructor(config: { username: string, password: string }) {
        super();
        super.addAuthentication(config.username, config.password);
    }
}
