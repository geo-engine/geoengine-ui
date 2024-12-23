import {Injectable} from '@angular/core';
import {ComputationQuota, Configuration, DefaultConfig, OperatorQuota, SessionApi, UserApi, UserSession} from '@geoengine/openapi-client';
import {Observable, ReplaySubject, filter, first, firstValueFrom, map} from 'rxjs';
import {UUID} from '../datasets/dataset.model';
import {isDefined} from '../util/conversions';

const PATH_PREFIX = window.location.pathname.replace(/\//g, '_').replace(/-/g, '_');

@Injectable({
    providedIn: 'root',
})
export class UserService {
    protected readonly session$ = new ReplaySubject<UserSession | undefined>(1);

    userApi = new ReplaySubject<UserApi>(1);

    protected sessionInitialized = false;

    constructor() {
        this.session$.subscribe((session) => {
            // storage of the session
            this.saveSessionInBrowser(session);
        });

        this.restoreSessionFromBrowser()
            .then((session) => {
                this.session$.next(session);
            })
            .catch(() => {
                this.session$.next(undefined);
            });

        this.getSessionStream().subscribe({
            next: (session) => this.userApi.next(new UserApi(apiConfigurationWithAccessKey(session.id))),
        });
    }

    getSessionTokenStream(): Observable<string> {
        return this.getSessionStream().pipe(map((session) => session.id));
    }

    getSessionTokenForRequest(): Observable<string> {
        return this.getSessionTokenStream().pipe(first());
    }

    /**
     * @returns Retrieve a stream that notifies about the current session.
     */
    getSessionStream(): Observable<UserSession> {
        return this.session$.pipe(filter(isDefined));
    }

    /**
     * @returns Retrieve a stream that notifies about the current session.
     *          May be undefined if there is no current session.
     */
    getSessionOrUndefinedStream(): Observable<UserSession | undefined> {
        return this.session$;
    }

    isLoggedIn(): Observable<boolean> {
        return this.session$.pipe(first(), map(isDefined));
    }

    async getRoleByName(roleName: string): Promise<UUID> {
        const userApi = await firstValueFrom(this.userApi);

        return userApi
            .getRoleByNameHandler({
                name: roleName,
            })
            .then((role) => role.id);
    }

    /**
     * Login using user credentials. If it was successful, set a new user.
     *
     * @param credentials.user The user name.
     * @param credentials.password The user's password.
     * @returns `true` if the login was successful, `false` otherwise.
     */
    async login(userCredentials: {email: string; password: string}): Promise<UserSession> {
        return new SessionApi()
            .loginHandler({
                userCredentials,
            })
            .then((session) => {
                this.session$.next(session);
                return session;
            });
    }

    logout(): void {
        this.session$.next(undefined);
    }

    async computationsQuota(offset: number, limit: number): Promise<ComputationQuota[]> {
        const userApi = await firstValueFrom(this.userApi);

        return userApi.computationsQuotaHandler({
            offset,
            limit,
        });
    }

    async computationQuota(computation: UUID): Promise<OperatorQuota[]> {
        const userApi = await firstValueFrom(this.userApi);

        return userApi.computationQuotaHandler({
            computation,
        });
    }

    async createSessionWithToken(sessionToken: string): Promise<UserSession> {
        return new SessionApi(apiConfigurationWithAccessKey(sessionToken)).sessionHandler().then((session) => {
            this.session$.next(session);
            return session;
        });
    }

    protected saveSessionInBrowser(session: UserSession | undefined): void {
        if (session) {
            localStorage.setItem(PATH_PREFIX + 'session', session.id);
        } else {
            localStorage.removeItem(PATH_PREFIX + 'session');
        }
    }

    protected async restoreSessionFromBrowser(): Promise<UserSession> {
        const sessionToken = localStorage.getItem(PATH_PREFIX + 'session') ?? '';

        return this.createSessionWithToken(sessionToken);
    }
}

export const apiConfigurationWithAccessKey = (accessToken: string): Configuration =>
    new Configuration({
        basePath: DefaultConfig.basePath,
        fetchApi: DefaultConfig.fetchApi,
        middleware: DefaultConfig.middleware,
        queryParamsStringify: DefaultConfig.queryParamsStringify,
        username: DefaultConfig.username,
        password: DefaultConfig.password,
        apiKey: DefaultConfig.apiKey,
        accessToken: accessToken,
        headers: DefaultConfig.headers,
        credentials: DefaultConfig.credentials,
    });
