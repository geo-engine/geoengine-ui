import {Observable, ReplaySubject, of, Subject} from 'rxjs';
import {catchError, first, map, mergeMap} from 'rxjs/operators';

import {Injectable} from '@angular/core';

import {utc} from 'moment';

import {User} from './user.model';
import {Config} from '../config.service';
import {NotificationService} from '../notification.service';
import {BackendService} from '../backend/backend.service';
import {SessionDict, UUID} from '../backend/backend.model';
import {Session} from './session.model';
import {MatDialog} from '@angular/material/dialog';
import {ModalLoginComponent, UserLogin} from './modal-login/modal-login.component';

const PATH_PREFIX = window.location.pathname.replace(/\//g, '_').replace(/-/g, '_');

/**
 * A service that is responsible for retrieving user information and modifying the current user.
 */
@Injectable()
export class UserService {
    protected readonly session$ = new ReplaySubject<Session>(1);

    constructor(
        protected readonly config: Config,
        protected readonly backend: BackendService,
        protected readonly notificationService: NotificationService,
        protected readonly dialog: MatDialog,
    ) {
        // storage of the session
        this.session$.subscribe((session) => this.saveSessionInBrowser(session));

        // restore old session if possible
        this.restoreSessionFromBrowser().subscribe(
            (session) => this.session$.next(session),
            (_error) =>
                this.createGuestUser().subscribe(
                    (session) => this.session$.next(session),
                    // TODO: use error translation
                    (error) => {
                        if (error.error.error === 'AnonymousAccessDisabled') {
                            const dialogRef = this.dialog.open(ModalLoginComponent, {
                                disableClose: true,
                                autoFocus: true,
                            });
                            dialogRef.componentInstance.loginCallback = (credentials: UserLogin): Observable<Session> =>
                                this.login(credentials);
                        } else {
                            this.notificationService.error(error.error.message);
                        }
                    },
                ),
        );
    }

    createGuestUser(): Observable<Session> {
        return this.backend.createAnonymousUserSession().pipe(mergeMap((response) => this.createSession(response)));
    }

    /**
     * @returns Retrieve a stream that notifies about the current session.
     */
    getSessionStream(): Observable<Session> {
        return this.session$;
    }

    getSessionTokenStream(): Observable<UUID> {
        return this.session$.pipe(map((session) => session.sessionToken));
    }

    getSessionTokenForRequest(): Observable<UUID> {
        return this.getSessionTokenStream().pipe(first());
    }

    isGuestUserStream(): Observable<boolean> {
        return this.session$.pipe(map((s) => !s.user || s.user.isGuest));
    }

    /**
     * Login using user credentials. If it was successful, set a new user.
     *
     * @param credentials.user The user name.
     * @param credentials.password The user's password.
     * @returns `true` if the login was successful, `false` otherwise.
     */
    login(credentials: {email: string; password: string}): Observable<Session> {
        const result = new Subject<Session>();
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
        const result = new Subject<Session>();
        this.session$.pipe(first()).subscribe((oldSession) => {
            this.backend.logoutUser(oldSession.sessionToken).subscribe();
            this.createGuestUser().subscribe(
                (session) => {
                    this.session$.next(session);
                    result.next(session);
                },
                (error) => {
                    if (error.error.error === 'AnonymousAccessDisabled') {
                        result.complete();
                        const dialogRef = this.dialog.open(ModalLoginComponent, {
                            disableClose: true,
                            autoFocus: true,
                        });
                        dialogRef.componentInstance.loginCallback = (credentials: UserLogin): Observable<Session> =>
                            this.login(credentials);
                    } else {
                        result.error(error);
                    }
                },
                () => result.complete(),
            );
        });
        return result.asObservable();
    }

    getSessionOnce(): Observable<Session> {
        return this.session$.pipe(first());
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

    protected saveSessionInBrowser(session: Session): void {
        localStorage.setItem(PATH_PREFIX + 'session', session.sessionToken);
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
}
