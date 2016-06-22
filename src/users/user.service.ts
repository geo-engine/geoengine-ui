import {Injectable} from '@angular/core';
import {Http, Headers, Response} from '@angular/http';

import {BehaviorSubject, Observable} from 'rxjs/Rx';

import Config from '../app/config.model';
import {User, Guest} from './user.model';

import {
    MappingSource, MappingSourceChannel, MappingTransform,
} from '../models/mapping-source.model';
import {Unit, UnitMappingDict} from '../operators/unit.model';

export interface Session {
    user: string;
    sessionToken: string;
}

class UserServiceRequestParameters {
    private parameters: {[index: string]: string | boolean | number};

    constructor(config: {
        request: string,
        sessionToken: string,
        parameters?: {[index: string]: string | boolean | number}
    }) {
        this.parameters = {
            service: 'USER',
            request: config.request,
            sessiontoken: config.sessionToken,
        };
        if (config.parameters) {
            Object.keys(config.parameters).forEach(
                key => this.parameters[key] = config.parameters[key]
            );
        }
    }

    toMessageBody(): string {
        return Object.keys(this.parameters).map(
            key => [key, this.parameters[key]].join('=')
        ).join('&');
    }

    getHeaders(): Headers {
        return new Headers({
           'Content-Type': 'application/x-www-form-urlencoded',
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
        this.user$ = new BehaviorSubject(new Guest());

        const session: Session = JSON.parse(localStorage.getItem('session'));
        this.session$ = new BehaviorSubject(
            // tslint:disable-next-line:no-null-keyword
            session !== null ? session : {user: Config.USER.GUEST.NAME, sessionToken: ''}
        );

        this.isGuestUser$ = this.session$.map(s => s.user === Config.USER.GUEST.NAME);

        // storage of the session
        this.session$.subscribe(newSession =>
            localStorage.setItem('session', JSON.stringify(newSession))
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
    login(credentials: {user: string, password: string}): Promise<boolean> {
        const parameters = new LoginRequestParameters({
            username: credentials.user,
            password: credentials.password,
        });
        return this.request(parameters).then(response => {
            const result = response.json() as {result: string | boolean, session: string};
            const success = typeof result.result === 'boolean' && result.result === true;

            if (success) {
                // TODO: get user information
                this.session$.next({
                    user: credentials.user,
                    sessionToken: result.session,
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
     * @param credentials.user The user name.
     * @param credentials.password The user's password.
     * @returns `true` if the login was succesful, `false` otherwise.
     */
    isSessionValid(session: Session): Promise<boolean> {
        const parameters = new UserServiceRequestParameters({
            request: 'sourcelist',
            sessionToken: session.sessionToken,
        });
        return this.request(parameters).then(response => {
            const result = response.json() as {result: string | boolean};

            return typeof result.result === 'boolean' && result.result;
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
            sourcelist: {[key: string]: MappingSourceDict};
        }

        interface MappingSourceDict {
            name: string;
            colorizer: string;
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
                        name: source.name,
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

    private request(requestParameters: UserServiceRequestParameters): Promise<Response> {
        return this.http.post(
            Config.MAPPING_URL,
            requestParameters.toMessageBody(),
            {headers: requestParameters.getHeaders()}
        ).toPromise();
    }

}
