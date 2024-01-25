import {Injectable} from '@angular/core';
import {Configuration, DefaultConfig, SessionApi, UserSession} from '@geoengine/openapi-client';
import {Observable, ReplaySubject, filter, first, from, map, tap} from 'rxjs';

const PATH_PREFIX = window.location.pathname.replace(/\//g, '_').replace(/-/g, '_');

@Injectable({
    providedIn: 'root',
})
export class SessionService {
    protected readonly session$ = new ReplaySubject<UserSession | undefined>(1);

    protected sessionInitialized = false;

    constructor() {
        this.session$.subscribe((session) => {
            // storage of the session
            this.saveSessionInBrowser(session);
        });

        this.restoreSessionFromBrowser().subscribe({
            next: (session) => {
                this.session$.next(session);
            },
            error: () => {
                this.session$.next(undefined);
            },
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

    isLoggedIn(): Observable<boolean> {
        return this.session$.pipe(first(), map(isDefined));
    }

    /**
     * Login using user credentials. If it was successful, set a new user.
     *
     * @param credentials.user The user name.
     * @param credentials.password The user's password.
     * @returns `true` if the login was successful, `false` otherwise.
     */
    login(userCredentials: {email: string; password: string}): Observable<UserSession> {
        const result = new ReplaySubject<UserSession>();

        new SessionApi()
            .loginHandler({
                userCredentials,
            })
            .then((session) => {
                this.session$.next(session);
                result.next(session);
                result.complete();
            })
            .catch((error) => result.error(error));

        return result.asObservable();
    }

    logout(): void {
        this.session$.next(undefined);
    }

    createSessionWithToken(sessionToken: string): Observable<UserSession> {
        return from(new SessionApi(apiConfigurationWithAccessKey(sessionToken)).sessionHandler()).pipe(
            tap((session) => this.session$.next(session)),
        );
    }

    protected saveSessionInBrowser(session: UserSession | undefined): void {
        if (session) {
            localStorage.setItem(PATH_PREFIX + 'session', session.id);
        } else {
            localStorage.removeItem(PATH_PREFIX + 'session');
        }
    }

    protected restoreSessionFromBrowser(): Observable<UserSession> {
        const sessionToken = localStorage.getItem(PATH_PREFIX + 'session') ?? '';

        return this.createSessionWithToken(sessionToken);
    }
}

/**
 * Used as filter argument for T | undefined
 */
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
function isDefined<T>(arg: T | null | undefined): arg is T {
    return arg !== null && arg !== undefined;
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
