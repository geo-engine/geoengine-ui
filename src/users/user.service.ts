import {Injectable} from '@angular/core';
import {Http, Response} from '@angular/http';

import {BehaviorSubject, Observable} from 'rxjs/Rx';

import Config from '../app/config.model';
import {User, Guest} from './user.model';

import {RequestParameters, MappingRequestParameters, ParametersType} from '../queries/request-parameters.model';
import {AbcdArchive} from '../models/abcd.model';
import {IBasket} from '../baskets/gfbio-basket.model';

import {
    MappingSource, MappingSourceChannel, MappingTransform,
} from '../models/mapping-source.model';
import {CsvFile, CsvColumn} from '../models/csv.model';

import {Unit, UnitMappingDict} from '../operators/unit.model';

export interface Session {
    user: string;
    sessionToken: string;
    staySignedIn?: boolean;
}

class UserServiceRequestParameters extends MappingRequestParameters {
    constructor(config: {
        request: string,
        sessionToken: string,
        parameters?: ParametersType
    }) {
        super({
            service: 'USER',
            request: config.request,
            sessionToken: config.sessionToken,
            parameters: config.parameters,
        });
    }
}

class LoginRequestParameters extends UserServiceRequestParameters {
    constructor(config: {
        username: string;
        password: string;
    }) {
        super({
            request: 'login',
            sessionToken: undefined,
            parameters: {
                username: config.username,
                password: config.password,
            },
        });
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
    constructor(config: { username: string; password: string; }) {
        super();
        this.addAuthentication(config.username, config.password);
    }
}

/**
 * A service that is responsible for retrieving user information and modifying the current user.
 */
@Injectable()
export class UserService {
    private user$: BehaviorSubject<User>;
    private session$: BehaviorSubject<Session>;

    private isGuestUser$: Observable<boolean>;

    constructor(
        private http: Http
    ) {
        this.session$ = new BehaviorSubject(
            this.loadSessionData()
        );

        this.isGuestUser$ = this.session$.map(s => s.user === Config.USER.GUEST.NAME);

        // storage of the session
        this.session$.subscribe(newSession => this.saveSessionData(newSession));

        // user info
        this.user$ = new BehaviorSubject(new Guest());
        this.session$.subscribe(
            session => this.getUserDetails(session).then(
                user => user ? this.user$.next(user) : new Guest()
            )
        );
    }

    /**
     * @returns Retrieve the current user.
     */
    getUser() {
        return this.user$.getValue();
    }

    /**
     * @returns Retrieve a stream that notifies about the current user.
     */
    getUserStream(): Observable<User> {
        return this.user$;
    }

    /**
     * @returns Retrieve the current session.
     */
    getSession() {
        return this.session$.getValue();
    }

    /**
     * @returns Retrieve a stream that notifies about the current session.
     */
    getSessionStream(): Observable<Session> {
        return this.session$;
    }

    isGuestUserStream(): Observable<boolean> {
        return this.isGuestUser$;
    }

    /**
     * Login using user credentials. If it was successful, set a new user.
     * @param credentials.user The user name.
     * @param credentials.password The user's password.
     * @returns `true` if the login was succesful, `false` otherwise.
     */
    login(credentials: {user: string, password: string, staySignedIn?: boolean}): Promise<boolean> {
        if (credentials.staySignedIn === undefined) {
            credentials.staySignedIn = true;
        }

        const parameters = new LoginRequestParameters({
            username: credentials.user,
            password: credentials.password,
        });
        return this.request(parameters).then(response => {
            const result = response.json() as {result: string | boolean, session: string};
            const success = typeof result.result === 'boolean' && result.result === true;

            if (success) {
                this.session$.next({
                    user: credentials.user,
                    sessionToken: result.session,
                    staySignedIn: credentials.staySignedIn,
                });
            }

            return success;
        });
    }

    guestLogin(): Promise<boolean> {
        return this.login({
            user: Config.USER.GUEST.NAME,
            password: Config.USER.GUEST.PASSWORD,
        });
    }

    /**
     * Login using user credentials. If it was successful, set a new user.
     * @param session.user The user name.
     * @param session.password The user's password.
     * @returns `true` if the login was succesful, `false` otherwise.
     */
    isSessionValid(session: Session): Promise<boolean> {
        // use >>user info request<< for this
        const parameters = new UserServiceRequestParameters({
            request: 'info',
            sessionToken: session.sessionToken,
        });
        return this.request(parameters).then(response => {
            const result = response.json() as {result: string | boolean};
            const valid = typeof result.result === 'boolean' && result.result;

            return valid;
        });

        // return this.getUserDetails(session).then(user => !!user);
    }

    /**
     * Retrieve the user details.
     * @param session.user The user name.
     * @param session.password The user's password.
     * @returns the user details.
     */
    getUserDetails(session: Session): Promise<User> {
        if (session.user === Config.USER.GUEST.NAME) {
            return Promise.resolve(new Guest());
        }

        const parameters = new UserServiceRequestParameters({
            request: 'info',
            sessionToken: session.sessionToken,
        });
        return this.request(parameters).then(response => {
            const result = response.json() as {result: string | boolean};
            const valid = typeof result.result === 'boolean' && result.result;

            if (valid) {
                const userResult = result as {
                    result: string | boolean,
                    username: string,
                    realname: string,
                    email: string,
                };
                return new User({
                    name: userResult.username,
                    realName: userResult.realname,
                    email: userResult.email,
                });
            } else {
                return undefined;
            }
        });
    }

    /**
     * Change the details of the current user.
     * @param details.firstName The first name
     * @param details.lastName  The last name
     * @param details.email     The E-Mail address
     */
    changeDetails(details: {realName: string, email: string}) {
        let user = this.getUser();
        user.realName = details.realName;
        user.email = details.email;

        this.user$.next(user);
    }

    /**
     * Get as stream of raster sources depending on the logged in user.
     */
    getRasterSourcesStream(): Observable<Array<MappingSource>> {
        interface MappingSourceResponse {
            sourcelist: {[index: string]: MappingSourceDict};
        }

        interface MappingSourceDict {
            name: string;
            colorizer: string;
            uri: string;
            license: string;
            citation: string;
            coords: {
                epsg: number,
                origin: number[],
                scale: number[],
                size: number[],
            };
            channels: [{
                datatype: string,
                nodata: number,
                name?: string,
                unit?: UnitMappingDict,
                transform?: {
                    unit?: UnitMappingDict,
                    datatype: string,
                    scale: number,
                    offset: number,
                },
            }];
        };

        return this.session$.switchMap(session => {
            const parameters = new UserServiceRequestParameters({
                request: 'sourcelist',
                sessionToken: session.sessionToken,
            });
            return this.request(parameters).then(
                response => response.json()
            ).then((json: MappingSourceResponse) => {
                const sources: Array<MappingSource> = [];

                for (const sourceId in json.sourcelist) {
                    const source: MappingSourceDict = json.sourcelist[sourceId];
                    sources.push({
                        source: sourceId,
                        name: (source.name) ? source.name : sourceId,
                        uri: source.uri,
                        citation: source.citation,
                        license: source.license,
                        colorizer: source.colorizer,
                        coords: source.coords,
                        channels: source.channels.map((channel, index) => {
                            return {
                                id: index,
                                name: channel.name || 'Channel #' + index,
                                datatype: channel.datatype,
                                nodata: channel.nodata,
                                unit: channel.unit ?
                                    Unit.fromMappingDict(channel.unit) : Unit.defaultUnit,
                                hasTransform: !!channel.transform,
                                isSwitchable: !!channel.transform &&
                                                        !!channel.transform.unit && !!channel.unit,
                                transform: channel.transform === undefined ?
                                    undefined : {
                                        unit: channel.transform.unit ?
                                            Unit.fromMappingDict(channel.transform.unit)
                                            : Unit.defaultUnit,
                                        datatype: channel.transform.datatype,
                                        offset: channel.transform.offset,
                                        scale: channel.transform.scale,
                                    } as MappingTransform,
                            } as MappingSourceChannel;
                        }),
                    });
                }

                return sources;
            });
        });

    }

    /**
     * Get as stream of CSV sources depending on the logged in user. TODO: should this be a service?
     */
    getCsvStream(): Observable<Array<CsvFile>> {
        type CsvResponse = Array<CsvFile>;

        const csvSourcesUrl = './assets/csv-data-sources.json';

        return this.http.get(csvSourcesUrl).map(
            response => response.json()
        ).map((csvs: CsvResponse) => csvs);
    }

    /**
     * Get the schema of a source operator. TODO: this should be replaced by a generic service call, which resolves the shema of a source.
     */
    getSourceSchemaAbcd(): Observable<Array<CsvColumn>> {
        type CsvResponse = Array<CsvColumn>;

        const jsonUrl = './assets/abcd-mandatory-fields.json';

        return this.http.get(jsonUrl).map(
            response => response.json()
        ).map((csvs: CsvResponse) => csvs);
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

    /**
     * Get as stream of GFBio baskets sources depending on the logged in user.
     */
    getGfbioBasketStream(): Observable<Array<IBasket>> {
        interface GfbioBasketResponse {
            baskets: Array<IBasket>;
            result: boolean;
        }

        return this.getSessionStream().switchMap(session => {
            const parameters = new GfbioServiceRequestParameters({
                request: 'baskets',
                sessionToken: session.sessionToken,
            });
            return this.request(parameters).then(
                response => response.json()
            ).then((gfbioBasketResponse: GfbioBasketResponse) => gfbioBasketResponse.baskets);

        });
    }

    /**
     * Get the GFBio login token from the portal.
     */
    getGFBioToken(credentials: {username: string, password: string}): Promise<string> {
        const parameters = new GFBioPortalLoginRequestParameters(credentials);

        return this.http.get(
            Config.GFBIO.LIFERAY_PORTAL_URL + 'api/jsonws/GFBioProject-portlet.basket/get-token',
            {headers: parameters.getHeaders()}
        ).flatMap(response => {
            const json = response.json();
            if (typeof json === 'string') {
                return Observable.of(json); // token
            } else {
                const result: { exception: string, message: string } = json;
                return Observable.throw(result.message);
            }
        }).toPromise();
    }

    /**
     * Login using gfbio credentials. If it was successful, set a new user.
     * @param credentials.user The user name.
     * @param credentials.password The user's password.
     * @returns `true` if the login was succesful, `false` otherwise.
     */
    gfbioLogin(credentials: {user: string, password: string, staySignedIn?: boolean}): Promise<boolean> {
        const tokenPromise = this.getGFBioToken({
            username: credentials.user,
            password: credentials.password,
        });
        return tokenPromise.then(
            token => {
                const parameters = new MappingRequestParameters({
                    service: 'gfbio',
                    sessionToken: undefined,
                    request: 'login',
                    parameters: {token: token},
                });
                return this.request(parameters).then(response => {
                    const result = response.json() as {result: string | boolean, session: string};
                    const success = typeof result.result === 'boolean' && result.result === true;

                    if (success) {
                        this.session$.next({
                            user: credentials.user,
                            sessionToken: result.session,
                            staySignedIn: credentials.staySignedIn,
                        });
                    }

                    return success;
                });
            },
            error => Promise.resolve(false)
        );
    }

    /**
     * Login using the gfbio token. If it was successful, set a new user.
     * @param token The user's token.
     * @returns `true` if the login was succesful, `false` otherwise.
     */
    gfbioTokenLogin(token: string): Promise<boolean> {
        const parameters = new MappingRequestParameters({
            service: 'gfbio',
            sessionToken: undefined,
            request: 'login',
            parameters: {token: token},
        });
        return this.request(parameters).then(response => {
            const result = response.json() as {result: string | boolean, session: string};
            const success = typeof result.result === 'boolean' && result.result === true;

            if (success) {
                return this.getUserDetails({user: undefined, sessionToken: result.session}).then(user => {
                    this.session$.next({
                        user: user.name,
                        sessionToken: result.session,
                        staySignedIn: false, // TODO: think about good default value
                    });
                    return true;
                });
            } else {
                return false;
            }
        });
    }

    /**
     * Get the session data.
     * @returns the session data
     */
    protected loadSessionData(): Session {
        // look first into the localStorage, then sessionStorage and if there is no data
        // return an empty guest session

        const sessionData = JSON.parse(localStorage.getItem('session')) as Session;
        if (sessionData === null) { // tslint:disable-line:no-null-keyword
            const sessionData2 = JSON.parse(sessionStorage.getItem('session')) as Session;
            if (sessionData2 === null) { // tslint:disable-line:no-null-keyword
                return {
                    user: Config.USER.GUEST.NAME,
                    sessionToken: '',
                };
            } else {
                return sessionData2;
            }
        } else {
            return sessionData;
        }
    }

    protected saveSessionData(sessionData: Session) {
        if (sessionData.staySignedIn) {
            localStorage.setItem('session', JSON.stringify(sessionData));
            sessionStorage.removeItem('session');
        } else {
            sessionStorage.setItem('session', JSON.stringify(sessionData));
            localStorage.removeItem('session');
        }
    }

    protected request(requestParameters: MappingRequestParameters): Promise<Response> {
        return this.http.post(
            Config.MAPPING_URL,
            requestParameters.toMessageBody(),
            {headers: requestParameters.getHeaders()}
        ).toPromise();
    }

}
