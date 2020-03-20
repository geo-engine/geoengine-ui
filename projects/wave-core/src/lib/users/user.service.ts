import {BehaviorSubject, Observable, Subject, combineLatest, EMPTY, of as observableOf, ReplaySubject} from 'rxjs';
import {catchError, map, tap, switchMap, mergeMap} from 'rxjs/operators';

import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {Guest, User} from './user.model';
import {MappingRequestParameters, ParametersType, RequestParameters} from '../queries/request-parameters.model';
import {
    MappingSource,
    SourceRasterLayerDescription,
    MappingSourceDict,
    MappingSourceResponse,
    MappingTransform, SourceVectorLayerDescription, ProvenanceInfo, MappingSourceRasterLayerDict, MappingSourceVectorLayerDict
} from '../operators/dialogs/data-repository/mapping-source.model';

import {Unit} from '../operators/unit.model';
import {Config} from '../config.service';
import {Operator} from '../operators/operator.model';
import {
    FeatureDBList,
    FeatureDBListEntry,
    featureDBListEntryToOperator,
    FeatureDBServiceListParameters,
    FeatureDBServiceUploadParameters
} from '../queries/feature-db.model';
import {NotificationService} from '../notification.service';
import {ColorizerData} from '../colors/colorizer-data.model';

const PATH_PREFIX = window.location.pathname.replace(/\//g, '_').replace(/-/g, '_');

export interface Session {
    user: string;
    sessionToken: string;
    staySignedIn?: boolean;
    isExternallyConnected?: boolean;
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

/**
 * A service that is responsible for retrieving user information and modifying the current user.
 */
@Injectable()
export class UserService {
    protected readonly user$: BehaviorSubject<User>;
    protected readonly session$: BehaviorSubject<Session>;

    protected readonly isGuestUser$: Observable<boolean>;

    protected rasterSources$ = new BehaviorSubject<Array<MappingSource>>([]);
    protected rasterSourceError$ = new BehaviorSubject<boolean>(false);
    protected reloadRasterSources$ = new BehaviorSubject<void>(undefined);

    constructor(protected readonly config: Config,
                protected readonly http: HttpClient,
                protected readonly notificationService: NotificationService) {
        this.session$ = new BehaviorSubject(
            this.loadSessionData()
        );

        this.user$ = new BehaviorSubject(new Guest(config));
        this.isGuestUser$ = this.session$.pipe(map(s => s.user === this.config.USER.GUEST.NAME));

        // storage of the session
        this.session$.subscribe(newSession => {
            this.isSessionValid(newSession).subscribe(isValid => {
                if (isValid) {
                    this.saveSessionData(newSession);

                    this.getUserDetails(newSession)
                        .subscribe(user => {
                            if (user) {
                                this.user$.next(user);
                            } else {
                                this.user$.next(new Guest(config));
                            }
                        });
                } else {
                    this.guestLogin().subscribe();
                }
            });
        });

        this.createRasterSourcesStream(this.session$, this.reloadRasterSources$)
            .subscribe(sources => {
                this.rasterSources$.next(sources);
                if (this.rasterSourceError$.getValue()) {
                    this.rasterSourceError$.next(false);
                }
            });
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

    isGuestUser(): boolean {
        return this.session$.getValue().user === this.config.USER.GUEST.NAME;
    }

    /**
     * Login using user credentials. If it was successful, set a new user.
     * @param credentials.user The user name.
     * @param credentials.password The user's password.
     * @returns `true` if the login was succesful, `false` otherwise.
     */
    login(credentials: { user: string, password: string, staySignedIn?: boolean }): Observable<boolean> {
        if (credentials.staySignedIn === undefined) {
            credentials.staySignedIn = true;
        }

        const parameters = new LoginRequestParameters({
            username: credentials.user,
            password: credentials.password,
        });
        return this.request<{ result: string | boolean, session: string }>(parameters).pipe(
            map(result => {
                const success = typeof result.result === 'boolean' && result.result === true;

                return [result.session, success];
            }), tap(([session, success]: [string, boolean]) => {
                if (success) {
                    this.session$.next({
                        user: credentials.user,
                        sessionToken: session,
                        staySignedIn: credentials.staySignedIn,
                        isExternallyConnected: false,
                    });
                }
            }),
            map(([_, success]) => success as boolean));
    }

    guestLogin(): Observable<boolean> {
        return this.login({
            user: this.config.USER.GUEST.NAME,
            password: this.config.USER.GUEST.PASSWORD,
        });
    }

    /**
     * Login using a JSON Web Token (JWT).
     * If it was successful, set a new user.
     * @param token The user's token.
     * @returns `true` if the login was succesful, `false` otherwise.
     */
    nature40JwtTokenLogin(token: string): Observable<boolean> {
        const parameters = new MappingRequestParameters({
            service: 'nature40',
            sessionToken: undefined,
            request: 'login',
            parameters: {token},
        });

        return this.loginRequestToUserDetails(parameters);
    }

    protected loginRequestToUserDetails(parameters: MappingRequestParameters) {
        const subject = new Subject<boolean>();

        this.request<{ result: string | boolean, session: string }>(parameters).pipe(
            mergeMap(response => {
                const success = (typeof response.result === 'boolean') && response.result;

                if (success) {
                    return this.getUserDetails({user: undefined, sessionToken: response.session})
                        .pipe(
                            tap(user => {
                                this.session$.next({
                                    user: user.name,
                                    sessionToken: response.session,
                                    staySignedIn: false,
                                    isExternallyConnected: true,
                                });
                            }),
                            map(_ => true)
                        );
                } else {
                    return observableOf(false);
                }
            }))
            .subscribe(
                success => subject.next(success),
                () => subject.next(false),
                () => subject.complete()
            );
        return subject;
    }

    /**
     * Retrieve the signed JWT client token.
     */
    getNature40JwtClientToken(): Observable<{ clientToken: string }> {
        const parameters = new MappingRequestParameters({
            service: 'nature40',
            sessionToken: undefined,
            request: 'clientToken',
            parameters: {},
        });

        return this.request<{ result: string | boolean, clientToken: string }>(parameters);
    }

    getNature40Catalog(): Observable<Map<string, Array<Nature40CatalogEntry>>> {
        const parameters = new MappingRequestParameters({
            service: 'nature40',
            sessionToken: this.getSession().sessionToken,
            request: 'sourcelist',
            parameters: {},
        });

        const subject = new ReplaySubject<Map<string, Array<Nature40CatalogEntry>>>(1);

        this.request<{ result: boolean | string, sourcelist?: Array<Nature40CatalogEntry> }>(parameters).subscribe(
            ({result, sourcelist}) => {
                if (typeof result === 'string') { // unsuccessful
                    subject.error(new Error(result));
                    return;
                }

                const groupedValues = new Map<string, Array<Nature40CatalogEntry>>();
                for (const entry of sourcelist) {
                    const group = entry.provider.type;
                    if (groupedValues.has(group)) {
                        groupedValues.get(group).push(entry);
                    } else {
                        groupedValues.set(group, [entry]);
                    }
                }

                subject.next(groupedValues);
            },
            () => subject.error(new Error('Unable to retrieve Nature 4.0 catalog data')),
            () => subject.complete(),
        );

        return subject;
    }

    /**
     * Login using user credentials. If it was successful, set a new user.
     * @param session.user The user name.
     * @param session.password The user's password.
     * @returns `true` if the login was succesful, `false` otherwise.
     */
    isSessionValid(session: Session): Observable<boolean> {
        // use >>user info request<< for this
        const parameters = new UserServiceRequestParameters({
            request: 'info',
            sessionToken: session.sessionToken,
        });
        return this.request<{ result: string | boolean }>(parameters).pipe(
            map(result => {
                return typeof result.result === 'boolean' && result.result;
            }));
    }

    /**
     * Retrieve the user details.
     * @param session.user The user name.
     * @param session.password The user's password.
     * @returns the user details.
     */
    getUserDetails(session: Session): Observable<User> {
        if (session.user === this.config.USER.GUEST.NAME) {
            return observableOf(new Guest(this.config));
        }

        const parameters = new UserServiceRequestParameters({
            request: 'info',
            sessionToken: session.sessionToken,
        });
        return this.request<{ result: string | boolean }>(parameters).pipe(
            map(result => {
                const valid = typeof result.result === 'boolean' && result.result;

                if (valid) {
                    const userResult = result as {
                        result: string | boolean,
                        username: string,
                        realname: string,
                        email: string,
                        externalid?: string;
                    };
                    return new User({
                        name: userResult.username,
                        realName: userResult.realname,
                        email: userResult.email,
                        externalid: userResult.externalid,
                    });
                } else {
                    return undefined;
                }
            }));
    }

    /**
     * Change the details of the current user.
     * @param details.firstName The first name
     * @param details.lastName  The last name
     * @param details.email     The E-Mail address
     */
    changeDetails(details: { realName: string, email: string }) {
        const user = this.getUser();
        user.realName = details.realName;
        user.email = details.email;

        this.user$.next(user);
    }

    /**
     * Get as stream of raster sources depending on the logged in user.
     */
    getRasterSourcesStream(): Observable<Array<MappingSource>> {
        return this.rasterSources$;
    }

    /**
     * Reload the raster sources
     */
    reloadRasterSources() {
        this.reloadRasterSources$.next(undefined);
    }

    getRasterSourcesErrorStream(): Observable<boolean> {
        return this.rasterSourceError$;
    }

    getFeatureDBList(): Observable<Array<{ name: string, operator: Operator }>> {
        if (this.isGuestUser()) {
            return observableOf([]);
        }

        return this.request<FeatureDBList>(new FeatureDBServiceListParameters({sessionToken: this.session$.getValue().sessionToken})).pipe(
            map(list => list.data_sets.map(featureDBListEntryToOperator)));
    }

    addFeatureToDB(name: string, operator: Operator): Observable<{ name: string, operator: Operator }> {
        if (this.isGuestUser()) {
            return EMPTY;
        }

        const subject = new Subject<{ name: string, operator: Operator }>();

        this
            .request<FeatureDBListEntry>(
                new FeatureDBServiceUploadParameters({
                    sessionToken: this.session$.getValue().sessionToken,
                    name,
                    crs: operator.projection,
                    query: operator.toQueryJSON(),
                    type: operator.resultType.getCode() as 'points' | 'lines' | 'polygons',
                }),
                true,
            ).pipe(
            map(featureDBListEntryToOperator))
            .subscribe(
                data => {
                    subject.next(data);
                    subject.complete();
                },
                error => subject.error(error)
            );

        return subject;
    }

    /**
     * Get the session data.
     * @returns the session data
     */
    protected loadSessionData(): Session {
        // look first into the localStorage, then sessionStorage and if there is no data
        // return an empty guest session

        const sessionData = JSON.parse(localStorage.getItem(PATH_PREFIX + 'session')) as Session;
        if (sessionData === null) { // tslint:disable-line:no-null-keyword
            const sessionData2 = JSON.parse(sessionStorage.getItem(PATH_PREFIX + 'session')) as Session;
            if (sessionData2 === null) { // tslint:disable-line:no-null-keyword
                return {
                    user: this.config.USER.GUEST.NAME,
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
            localStorage.setItem(PATH_PREFIX + 'session', JSON.stringify(sessionData));
            sessionStorage.removeItem(PATH_PREFIX + 'session');
        } else {
            sessionStorage.setItem(PATH_PREFIX + 'session', JSON.stringify(sessionData));
            localStorage.removeItem(PATH_PREFIX + 'session');
        }
    }

    protected request<ResponseType>(requestParameters: MappingRequestParameters, encode = false): Observable<ResponseType> {
        return this.http.post<ResponseType>(
            this.config.MAPPING_URL,
            requestParameters.toMessageBody(encode),
            {headers: requestParameters.getHeaders()}
        );
    }

    protected createRasterSourcesStream(session$: Observable<Session>, reload$: Observable<void>): Observable<Array<MappingSource>> {
        return combineLatest(session$, reload$).pipe(
            map(([session, _]) => session),
            switchMap(session => {
                const parameters = new UserServiceRequestParameters({
                    request: 'sourcelist',
                    sessionToken: session.sessionToken,
                });
                return this.request<MappingSourceResponse>(parameters).pipe(
                    map(json => {
                        const sources: Array<MappingSource> = [];

                        for (const sourceId in json.sourcelist) {
                            if (json.sourcelist.hasOwnProperty(sourceId)) {
                                const source: MappingSourceDict = json.sourcelist[sourceId];
                                const sourceProvenance: ProvenanceInfo = UserService.parseSourceProvenance(source);

                                const sourceChannels = (!source.channels) ? [] : source.channels.map(
                                    (channel, index) => {
                                        return UserService.parseRasterChannel(channel, source, sourceProvenance, index);
                                    }
                                );

                                // vector data
                                const sourceVectorLayer = (!source.layer) ? [] : source.layer.map(
                                    (layer, index) => {
                                        return UserService.parseVectorLayer(layer, source, sourceProvenance, index);
                                    }
                                );

                                sources.push({
                                    operator: (source.operator) ? source.operator : 'rasterdb_source', // FIXME: remove rasterdb_source?
                                    source: sourceId,
                                    name: (source.name) ? source.name : sourceId,
                                    rasterLayer: sourceChannels,
                                    vectorLayer: sourceVectorLayer,
                                    provenance: sourceProvenance,
                                    descriptionText: source.descriptionText,
                                    imgUrl: source.imgUrl,
                                    tags: source.tags,
                                });
                            }
                        }
                        return sources;
                    }),
                    catchError(error => {
                        this.notificationService.error(`Error loading raster sources: »${error}«`);
                        this.rasterSourceError$.next(true);
                        return [];
                    }),
                );
            }));
    }

    protected static parseSourceProvenance(source: MappingSourceDict) {
        return {
            uri: (source.provenance) ? source.provenance.uri : '',
            citation: source.provenance ? source.provenance.citation : '',
            license: source.provenance ? source.provenance.license : '',
        };
    }

    protected static parseVectorLayer(
        layer: MappingSourceVectorLayerDict, source: MappingSourceDict, sourceProvenance: ProvenanceInfo, index: number
    ): SourceVectorLayerDescription {
        // TODO: can we  safely assume EPSG: 4326 here?
        const coords = layer.coords || source.coords || {crs: 'EPSG:4326'};

        const provenance: ProvenanceInfo = (layer.provenance) ? {
            uri: (source.provenance) ? source.provenance.uri : '',
            citation: source.provenance ? source.provenance.citation : '',
            license: source.provenance ? source.provenance.license : '',
        } : sourceProvenance;

        return {
            id: layer.id || layer.name,
            name: layer.title || layer.name || 'Layer #' + index,
            title: layer.title || layer.name || 'Layer #' + index,
            geometryType: layer.geometry_type || 'POINTS',
            textual: layer.textual || [],
            numeric: layer.numeric || [],
            coords,
            provenance,
        };
    }

    protected static parseRasterChannel(
        channel: MappingSourceRasterLayerDict, source: MappingSourceDict, sourceProvenance: ProvenanceInfo, index: number
    ): SourceRasterLayerDescription {
        const channelUnit = channel.unit ? Unit.fromMappingDict(channel.unit) : Unit.defaultUnit;
        const sourceColorizer =
            source.colorizer ? ColorizerData.fromMappingColorizerData(source.colorizer) : undefined;
        const channelColorizer =
            channel.colorizer ? ColorizerData.fromMappingColorizerData(channel.colorizer) : sourceColorizer;
        const coords = channel.coords || source.coords; // fixme: throw?

        const channelProvenance: ProvenanceInfo = (!channel.provenance) ? sourceProvenance : {
            uri: (source.provenance) ? source.provenance.uri : '',
            citation: source.provenance ? source.provenance.citation : '',
            license: source.provenance ? source.provenance.license : '',
        };

        return {
            id: index,
            name: channel.name || 'Channel #' + index,
            datatype: channel.datatype,
            nodata: channel.nodata,
            unit: channelUnit,
            methodology: channel.methodology,
            colorizer: channelColorizer,
            hasTransform: !!channel.transform,
            isSwitchable: !!channel.transform && !!channel.transform.unit && !!channel.unit,
            transform: !channel.transform ? undefined : {
                unit: channel.transform.unit ? Unit.fromMappingDict(channel.transform.unit) : Unit.defaultUnit,
                datatype: channel.transform.datatype,
                offset: channel.transform.offset,
                scale: channel.transform.scale,
            } as MappingTransform,
            coords: coords as { crs: string, origin: number[], scale: number[], size: number[] },
            provenance: channelProvenance,
        };
    }

}

export interface Nature40CatalogEntry {
    global_id: string;
    title: string;
    description: string;
    user_url: string;
    provider: {
        type: string,
        id: string,
        url: string,
    };
    dataset: {
        type: string,
        id: string,
        url: string,
    };
}
