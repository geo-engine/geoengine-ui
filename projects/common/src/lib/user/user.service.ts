import {Injectable, inject} from '@angular/core';
import {
    ComputationQuota,
    AuthCodeRequestURL,
    Configuration,
    DefaultConfig,
    OperatorQuota,
    GeneralApi,
    RoleDescription,
    ServerInfo,
    SessionApi,
    UserApi,
    UserSession,
} from '@geoengine/openapi-client';
import {
    BehaviorSubject,
    Observable,
    ReplaySubject,
    catchError,
    combineLatest,
    filter,
    first,
    firstValueFrom,
    from,
    map,
    mergeMap,
    of,
    tap,
} from 'rxjs';
import {UUID} from '../datasets/dataset.model';
import {isDefined} from '../util/conversions';
import {ActivatedRoute, Router} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import {Session} from './session.model';
import {BackendStatus, Quota, User} from './user.model';
import {utc} from 'moment';
import {CommonConfig} from '../config.service';
import {NotificationService} from '../notification.service';

const PATH_PREFIX = window.location.pathname.replace(/\//g, '_').replace(/-/g, '_');

/**
 * A service that is responsible for retrieving user information and modifying the current user.
 */
@Injectable({
    providedIn: 'root',
})
export class UserService {
    protected readonly config = inject(CommonConfig);
    protected readonly notificationService = inject(NotificationService);
    protected readonly router = inject(Router);
    protected readonly activatedRoute = inject(ActivatedRoute);

    protected readonly session$ = new ReplaySubject<Session | undefined>(1);
    protected readonly backendStatus$ = new BehaviorSubject<BackendStatus>({available: false, initial: true});
    protected readonly backendInfo$ = new BehaviorSubject<ServerInfo | undefined>(undefined);
    protected readonly sessionQuota$ = new BehaviorSubject<Quota | undefined>(undefined);
    protected readonly refreshSessionQuota$ = new BehaviorSubject<void>(undefined);

    userApi = new ReplaySubject<UserApi>(1);
    sessionApi = new ReplaySubject<SessionApi>(1);
    backendApi = new GeneralApi();

    protected logoutCallback?: () => void;
    protected sessionInitialized = false;

    constructor() {
        // get oidc paramters from url before routing is enabled
        const oidcParams = this.getOidcParametersFromUrl();

        this.session$.subscribe((session) => {
            // storage of the session
            this.saveSessionInBrowser(session);
        });

        this.getBackendStatus().subscribe((status) => {
            this.tryLogin(status, oidcParams);
        });

        // update backend info when backend is available
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.getBackendStatus().subscribe(async (status) => {
            if (status.available) {
                const info = await this.backendApi.serverInfoHandler();
                this.backendInfo$.next(info);
            }
        });

        this.getSessionStream().subscribe({
            next: (session) => {
                this.userApi.next(new UserApi(apiConfigurationWithAccessKey(session.sessionToken)));
                this.sessionApi.next(new SessionApi(apiConfigurationWithAccessKey(session.sessionToken)));
            },
        });

        // update quota when session changes or update is triggered
        this.createSessionQuotaStream();

        this.triggerBackendStatusUpdate();
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    async tryLogin(
        status: BackendStatus,
        oidcParams:
            | {
                  sessionState: string;
                  code: string;
                  state: string;
              }
            | undefined,
    ): Promise<void> {
        // if the backend is not ready, we cannot do anything
        if (status.initial) {
            return;
        }

        if (!status.available) {
            if (this.sessionInitialized) {
                this.notificationService.error('Session close caused by backend shutdown');
            } else {
                this.notificationService.error('Backend is not available');
            }

            this.sessionInitialized = false;
            this.session$.next(undefined);
            return;
        }

        this.sessionInitialized = true;

        if (oidcParams && sessionStorage.getItem('redirectUri')) {
            this.oidcLogin(oidcParams)
                .pipe(first())
                .subscribe(() => {
                    this.router.navigate([], {
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        queryParams: {session_state: undefined, state: undefined, code: undefined},
                        queryParamsHandling: 'merge',
                    });
                });
        } else {
            // restore old session if possible
            this.sessionFromBrowser(this.config.USER.AUTO_GUEST_LOGIN).subscribe({
                next: (session) => {
                    this.session$.next(session);
                },
                error: (error) => {
                    // only show error if we did not expect it
                    if (error?.error?.error !== 'Unauthorized') {
                        this.notificationService.error(error?.error?.message);
                    }
                    this.session$.next(undefined);
                },
            });
        }
    }

    async triggerBackendStatusUpdate(): Promise<void> {
        try {
            const _available = await this.backendApi.availableHandler();

            this.backendStatus$.next({available: true});
        } catch (error) {
            this.backendStatus$.next({available: false, httpError: error as HttpErrorResponse});
        }
    }

    getBackendStatus(): Observable<BackendStatus> {
        return this.backendStatus$;
    }

    sessionFromBrowser(fallbackToGuest: boolean): Observable<Session | undefined> {
        return this.restoreSessionFromBrowser().pipe(
            catchError((_error) => {
                if (fallbackToGuest) {
                    return this.createGuestUser();
                } else {
                    return of(undefined);
                }
            }),
        );
    }

    createGuestUser(): Observable<Session> {
        return from(new SessionApi().anonymousHandler().then((response) => this.sessionFromDict(response)));
    }

    /**
     * @returns Retrieve a stream that notifies about the current session.
     */
    getSessionStream(): Observable<Session> {
        return this.session$.pipe(filter(isDefined));
    }

    /**
     * @returns Retrieve a stream that notifies about the current session.
     *          May be undefined if there is no current session.
     */
    getSessionOrUndefinedStream(): Observable<Session | undefined> {
        return this.session$;
    }

    getSessionTokenStream(): Observable<UUID> {
        return this.getSessionStream().pipe(map((session) => session.sessionToken));
    }

    getSessionTokenForRequest(): Observable<UUID> {
        return this.getSessionTokenStream().pipe(first());
    }

    /**
     * Returns a stream that notifies about the current session quota.
     * May be undefined if there is no current session or the backend does not use quotas.
     *
     * @returns Observable<Quota | undefined>
     **/
    getSessionQuotaStream(): Observable<Quota | undefined> {
        this.refreshSessionQuota();
        return this.sessionQuota$;
    }

    /**
     * triggers a refresh of the session quota
     *
     * @returns void
     **/
    refreshSessionQuota(): void {
        this.refreshSessionQuota$.next();
    }

    getBackendInfoStream(): Observable<ServerInfo | undefined> {
        return this.backendInfo$;
    }

    isGuestUserStream(): Observable<boolean> {
        return this.getSessionStream().pipe(map((s) => !s.user?.email || !s.user.realName));
    }

    /**
     * Login using user credentials. If it was successful, set a new user.
     *
     * @param credentials.user The user name.
     * @param credentials.password The user's password.
     * @returns `true` if the login was successful, `false` otherwise.
     */
    login(userCredentials: {email: string; password: string}): Observable<Session> {
        const result = new ReplaySubject<Session>();

        new SessionApi()
            .loginHandler({
                userCredentials,
            })
            .then((response) => this.sessionFromDict(response))
            .then((session) => {
                this.session$.next(session);
                result.next(session);
                result.complete();
            })
            .catch((error) => result.error(error));

        return result.asObservable();
    }

    guestLogin(): Observable<Session> {
        const result = new ReplaySubject<Session>();
        this.session$.pipe(first()).subscribe((oldSession) => {
            if (oldSession) {
                new SessionApi(oldSession.apiConfiguration).logoutHandler();
            }

            this.createGuestUser().subscribe({
                next: (session) => {
                    this.session$.next(session);
                    result.next(session);
                },
                error: (error) => {
                    // failing on a guest login means we cannot do it,
                    // so we are logged out
                    this.session$.next(undefined);
                    result.error(error);
                },
                complete: () => result.complete(),
            });
        });
        return result.asObservable();
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

    createSessionWithToken(sessionToken: UUID): Observable<Session> {
        return from(
            new SessionApi(apiConfigurationWithAccessKey(sessionToken)).sessionHandler().then((response) => this.sessionFromDict(response)),
        ).pipe(tap((session) => this.session$.next(session)));
    }

    getSessionOnce(): Observable<Session> {
        return this.getSessionStream().pipe(first());
    }

    /**
     * Login using user credentials. If it was successful, set a new user.
     *
     * @param session.user The user name.
     * @param session.password The user's password.
     * @returns `true` if the session is valid, `false` otherwise.
     */
    isSessionValid(session: Session): Observable<boolean> {
        return from(
            new SessionApi(session.apiConfiguration)
                .sessionHandler()
                .then((_response) => true)
                .catch((_error) => false),
        );
    }

    isLoggedIn(): Observable<boolean> {
        return this.session$.pipe(first(), map(isDefined));
    }

    /**
     * This callback is called when the user is logged out.
     * This can be used to re-route to login pages.
     */
    setLogoutCallback(callback: () => void): void {
        this.logoutCallback = callback;
    }

    oidcInit(redirectUri: string): Observable<AuthCodeRequestURL> {
        sessionStorage.setItem('redirectUri', redirectUri);

        return from(
            new SessionApi().oidcInit({
                redirectUri: redirectUri,
            }),
        );
    }

    oidcLogin(request: {sessionState: string; code: string; state: string}): Observable<Session> {
        const result = new ReplaySubject<Session>();

        new SessionApi()
            .oidcLogin({
                authCodeResponse: request,
                redirectUri: sessionStorage.getItem('redirectUri')!,
            })
            .then((response) => {
                const session = this.sessionFromDict(response);
                this.session$.next(session);
                result.next(session);
                result.complete();
                sessionStorage.removeItem('redirectUri');
            })
            .catch((error) => result.error(error));

        return result.asObservable();
    }

    saveSettingInLocalStorage(keyValue: string, setting: string): void {
        localStorage.setItem(PATH_PREFIX + keyValue, setting);
    }

    getSettingFromLocalStorage(keyValue: string): string | null {
        return localStorage.getItem(PATH_PREFIX + keyValue);
    }

    /**
     * Returns a stream that notifies about the current roles of the user.
     * May be undefined if there is no current session.
     *
     * @returns Observable<Array<RoleDescription> | undefined>
     **/
    getRoleDescriptions(): Observable<Array<RoleDescription> | undefined> {
        return combineLatest([this.userApi, this.getSessionOrUndefinedStream()]).pipe(
            mergeMap(([userApi, session]) => {
                if (!session) return of(undefined);
                return from(userApi.getRoleDescriptions());
            }),
            catchError(() => of(undefined)),
        );
    }

    protected saveSessionInBrowser(session: Session | undefined): void {
        if (session) {
            localStorage.setItem(PATH_PREFIX + 'session', session.sessionToken);
        } else {
            localStorage.removeItem(PATH_PREFIX + 'session');
        }
    }

    protected restoreSessionFromBrowser(): Observable<Session> {
        const sessionToken = localStorage.getItem(PATH_PREFIX + 'session') ?? '';

        return this.createSessionWithToken(sessionToken);
    }

    async getRoleByName(roleName: string): Promise<UUID> {
        const userApi = await firstValueFrom(this.userApi);
        return userApi
            .getRoleByNameHandler({
                name: roleName,
            })
            .then((role) => role.id);
    }

    async registerUser(userRegistration: {email: string; password: string; realName: string}): Promise<string> {
        const sessionApi = await firstValueFrom(this.sessionApi);
        return sessionApi.registerUserHandler({userRegistration});
    }

    protected sessionFromDict(sessionDict: UserSession): Session {
        let user: User | undefined;
        if (sessionDict.user) {
            user = new User({
                id: sessionDict.user.id,
                email: sessionDict.user.email ?? undefined,
                realName: sessionDict.user.realName ?? undefined,
            });
        }

        const session: Session = {
            sessionToken: sessionDict.id,
            user,
            validUntil: utc(sessionDict.validUntil),
            lastProjectId: sessionDict.project ?? undefined,
            lastView: sessionDict.view ?? undefined,
            apiConfiguration: apiConfigurationWithAccessKey(sessionDict.id),
        };

        return session;
    }

    private createSessionQuotaStream(): void {
        combineLatest([this.userApi, this.getSessionOrUndefinedStream(), this.refreshSessionQuota$])
            .pipe(
                mergeMap(([userApi, session, _update]) => {
                    if (!session) return of(undefined);
                    return from(userApi.quotaHandler());
                }),
                catchError(() => of(undefined)),
                map((quota) => (quota ? Quota.fromDict(quota) : undefined)),
            )
            .subscribe((quota) => {
                this.sessionQuota$.next(quota);
            });
    }

    private getOidcParametersFromUrl(): {sessionState: string; code: string; state: string} | undefined {
        const params = new URLSearchParams(window.location.search);
        const sessionState = params.get('session_state');
        const code = params.get('code');
        const state = params.get('state');

        if (sessionState && code && state) {
            return {sessionState, code, state};
        }

        return undefined;
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
