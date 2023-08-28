import {Observable, ReplaySubject, of, BehaviorSubject, combineLatest} from 'rxjs';
import {catchError, filter, first, map, mergeMap, tap} from 'rxjs/operators';

import {Injectable} from '@angular/core';

import {utc} from 'moment';

import {BackendStatus, User} from './user.model';
import {Config} from '../config.service';
import {NotificationService} from '../notification.service';
import {BackendService} from '../backend/backend.service';
import {AuthCodeRequestURL, BackendInfoDict, RoleDescription, SessionDict, UUID} from '../backend/backend.model';
import {Session} from './session.model';
import {ActivatedRoute, Router} from '@angular/router';
import {Quota} from './quota/quota.model';

const PATH_PREFIX = window.location.pathname.replace(/\//g, '_').replace(/-/g, '_');

/**
 * A service that is responsible for retrieving user information and modifying the current user.
 */
@Injectable()
export class UserService {
    protected readonly session$ = new ReplaySubject<Session | undefined>(1);
    protected readonly backendStatus$ = new BehaviorSubject<BackendStatus>({available: false, initial: true});
    protected readonly backendInfo$ = new BehaviorSubject<BackendInfoDict | undefined>(undefined);
    protected readonly sessionQuota$ = new BehaviorSubject<Quota | undefined>(undefined);
    protected readonly refreshSessionQuota$ = new BehaviorSubject<void>(undefined);

    protected logoutCallback?: () => void;
    protected sessionInitialized = false;

    constructor(
        protected readonly config: Config,
        protected readonly backend: BackendService,
        protected readonly notificationService: NotificationService,
        protected readonly router: Router,
        protected readonly activatedRoute: ActivatedRoute,
    ) {
        // get oidc paramters from url before routing is enabled
        const oidcParams = this.getOidcParametersFromUrl();

        this.session$.subscribe((session) => {
            // storage of the session
            this.saveSessionInBrowser(session);
        });

        this.getBackendStatus().subscribe((status) => {
            // if the backend is not ready, we cannot do anything
            if (status.initial) {
                return;
            }

            if (status.available && !this.sessionInitialized) {
                this.sessionInitialized = true;

                if (oidcParams) {
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
                    this.sessionFromBrowserOrCreateGuest().subscribe({
                        next: (session) => {
                            this.session$.next(session);
                        },
                        error: (error) => {
                            // only show error if we did not expect it
                            if (error.error.error !== 'Unauthorized') {
                                this.notificationService.error(error.error.message);
                            }
                            this.session$.next(undefined);
                        },
                    });
                }
            }
            if (!status.available && this.sessionInitialized) {
                this.sessionInitialized = false;
                this.session$.next(undefined);
                this.notificationService.error('Session close caused by backend shutdown');
            }
        });

        // update backend info when backend is available
        this.getBackendStatus().subscribe((status) => {
            if (status.available) {
                this.backend.getBackendInfo().subscribe((info) => {
                    this.backendInfo$.next(info);
                });
            }
        });

        // update quota when session changes or update is triggered
        this.createSessionQuotaStream();

        this.triggerBackendStatusUpdate();
    }

    triggerBackendStatusUpdate(): void {
        this.backend.getBackendAvailable().subscribe({
            next: () => {
                this.backendStatus$.next({available: true});
            },
            error: (err) => {
                this.backendStatus$.next({available: false, httpError: err});
            },
        });
    }

    getBackendStatus(): Observable<BackendStatus> {
        return this.backendStatus$;
    }

    sessionFromBrowserOrCreateGuest(): Observable<Session> {
        return this.restoreSessionFromBrowser().pipe(
            catchError((error) => {
                console.error(error);
                return this.createGuestUser();
            }),
        );
    }

    createGuestUser(): Observable<Session> {
        return this.backend.createAnonymousUserSession().pipe(mergeMap((response) => this.createSession(response)));
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

    getBackendInfoStream(): Observable<BackendInfoDict | undefined> {
        return this.backendInfo$;
    }

    isGuestUserStream(): Observable<boolean> {
        return this.getSessionStream().pipe(map((s) => !s.user || s.user.isGuest));
    }

    /**
     * Login using user credentials. If it was successful, set a new user.
     *
     * @param credentials.user The user name.
     * @param credentials.password The user's password.
     * @returns `true` if the login was successful, `false` otherwise.
     */
    login(credentials: {email: string; password: string}): Observable<Session> {
        const result = new ReplaySubject<Session>();
        this.backend
            .loginUser(credentials)
            .pipe(mergeMap((response) => this.createSession(response)))
            .subscribe(
                (session) => {
                    this.session$.next(session);
                    result.next(session);
                },
                (error) => result.error(error),
                () => result.complete(),
            );
        return result.asObservable();
    }

    guestLogin(): Observable<Session> {
        const result = new ReplaySubject<Session>();
        this.session$.pipe(first()).subscribe((oldSession) => {
            if (oldSession) {
                this.backend.logoutUser(oldSession.sessionToken).subscribe();
            }

            this.createGuestUser().subscribe(
                (session) => {
                    this.session$.next(session);
                    result.next(session);
                },
                (error) => {
                    // failing on a guest login means we cannot do it,
                    // so we are logged out
                    this.session$.next(undefined);
                    result.error(error);
                },
                () => result.complete(),
            );
        });
        return result.asObservable();
    }

    createSessionWithToken(sessionToken: UUID): Observable<Session> {
        return this.backend.getSession(sessionToken).pipe(
            mergeMap((response) => this.createSession(response)),
            tap((session) => this.session$.next(session)),
        );
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
        return this.backend.getSession(session.sessionToken).pipe(
            map((_) => true),
            catchError((_) => of(false)),
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

    oidcInit(): Observable<AuthCodeRequestURL> {
        return this.backend.oidcInit();
    }

    oidcLogin(request: {sessionState: string; code: string; state: string}): Observable<Session> {
        const result = new ReplaySubject<Session>();
        this.backend
            .oidcLogin(request)
            .pipe(mergeMap((response) => this.createSession(response)))
            .subscribe(
                (session) => {
                    this.session$.next(session);
                    result.next(session);
                },
                (error) => result.error(error),
                () => result.complete(),
            );
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
        return this.getSessionOrUndefinedStream().pipe(
            mergeMap((session) => {
                if (!session) return of(undefined);
                return this.backend.getRoleDescriptions(session.sessionToken);
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

        return this.backend.getSession(sessionToken).pipe(mergeMap((response) => this.createSession(response)));
    }

    protected createSession(sessionDict: SessionDict): Observable<Session> {
        let user: User | undefined;
        if (sessionDict.user) {
            user = new User({
                id: sessionDict.user.id,
                email: sessionDict.user.email,
                realName: sessionDict.user.realName,
            });
        }

        const session: Session = {
            sessionToken: sessionDict.id,
            user,
            validUntil: utc(sessionDict.validUntil),
            lastProjectId: sessionDict.project,
            lastView: sessionDict.view,
        };

        return of(session);
    }

    private createSessionQuotaStream(): void {
        combineLatest([this.getSessionOrUndefinedStream(), this.refreshSessionQuota$])
            .pipe(
                mergeMap(([session, _update]) => {
                    if (!session) return of(undefined);
                    return this.backend.getQuota(session.sessionToken);
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

/**
 * Used as filter argument for T | undefined
 */
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
function isDefined<T>(arg: T | null | undefined): arg is T {
    return arg !== null && arg !== undefined;
}
