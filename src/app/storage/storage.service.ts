
import {
    Observable, Subscription, fromEvent as observableFromEvent, combineLatest as observableCombineLatest, BehaviorSubject, Subject
} from 'rxjs';
import {skip, first, filter, tap, debounceTime} from 'rxjs/operators';

import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {RScript, StorageProvider} from './storage-provider.model';
import {BrowserStorageProvider} from './providers/browser-storage-provider.model';
import {MappingStorageProvider} from './providers/mapping-storage-provider.model';

import {LayoutService} from '../layout.service';
import {ProjectService} from '../project/project.service';
import {UserService} from '../users/user.service';
import {Config} from '../config.service';
import {Project} from '../project/project.model';
import {NotificationService} from '../notification.service';

export enum StorageStatus {
    PENDING,
    OK,
}

/**
 * A service that is responsible for saving the app state.
 */
@Injectable()
export class StorageService {
    private storageProvider: StorageProvider;

    private projectSubscription: Subscription;
    private layoutSubscription: Subscription;

    private pendingWorkspace: { project: Project };
    private pendingWorkspaceSubscription: Subscription;

    private storageStatus$ = new BehaviorSubject(StorageStatus.PENDING);

    constructor(private config: Config,
                private projectService: ProjectService,
                private layoutService: LayoutService,
                private userService: UserService,
                private notificationService: NotificationService,
                private http: HttpClient) {
        // load stored values on session change
        this.userService.getSessionStream()
            .subscribe(session => {
                this.storageStatus$.next(StorageStatus.PENDING);

                // check validity
                this.userService.isSessionValid(session).subscribe(valid => {
                    if (valid) {
                        this.resetStorageProvider();
                    } else {
                        // TODO: highlight or jump to login
                        this.userService.guestLogin();
                    }
                });
            });
    }

    /**
     * Checks if a project exists with this name.
     */
    projectExists(name: string): Observable<boolean> {
        return this.storageProvider.projectExists(name);
    }

    /**
     * Retrieve all projects for a user.
     */
    getProjects(): Observable<Array<string>> {
        return this.storageProvider.getProjects();
    }

    loadProjectByName(name: string) {
        return this.resetStorageProvider(name);
    }

    saveRScript(name: string, script: RScript): Observable<void> {
        return this.storageProvider.saveRScript(name, script);
    }

    loadRScriptByName(name: string): Observable<RScript> {
        return this.storageProvider.loadRScript(name);
    }

    getRScripts(): Observable<Array<string>> {
        return this.storageProvider.getRScripts();
    }

    getStatus(): Observable<StorageStatus> {
        return this.storageStatus$;
    }

    /**
     * Remove the old provider, create a new one and load saved data.
     */
    private resetStorageProvider(projectName: string = undefined) {
        // clean up old provider stuff
        if (this.projectSubscription) {
            this.projectSubscription.unsubscribe();
        }
        if (this.layoutSubscription) {
            this.layoutSubscription.unsubscribe();
        }
        if (this.pendingWorkspaceSubscription) {
            this.pendingWorkspaceSubscription.unsubscribe();
        }
        if (this.pendingWorkspace) {
            this.storageProvider.saveWorkspace(this.pendingWorkspace);

            this.pendingWorkspace = undefined;
        }
        this.storageProvider = undefined;

        // create suitable provider
        if (this.userService.isGuestUser()) {
            this.storageProvider = new BrowserStorageProvider(
                this.config,
                this.projectService,
                this.notificationService
            );
        } else {
            this.storageProvider = new MappingStorageProvider({
                config: this.config,
                projectService: this.projectService,
                notificationService: this.notificationService,
                http: this.http,
                session: this.userService.getSession(),
                createDefaultProject: this.projectService.createDefaultProject,
                projectName: projectName,
            });
        }

        const workspaceLoading$ = new Subject<void>();
        const layoutLoading$ = new Subject<void>();
        observableCombineLatest(workspaceLoading$, layoutLoading$).pipe(
            first())
            .subscribe(() => this.storageStatus$.next(StorageStatus.OK));

        // load workspace
        this.storageProvider.loadWorkspace().subscribe(workspace => {
            const newProject = workspace.project ? workspace.project : this.projectService.createDefaultProject();

            this.projectService.setProject(newProject);

            // setup storage
            this.projectSubscription = this.projectService.getProjectStream().pipe(
                filter(project => project !== newProject), // skip saving the previously loaded project
                tap(project => {
                    // save pending change
                    this.pendingWorkspace = {
                        project: project
                    };
                }),
                debounceTime(this.config.DELAYS.STORAGE_DEBOUNCE),
                tap(() => {
                    // store pending change
                    this.pendingWorkspace = undefined;
                }), )
                .subscribe(project => {
                    this.storageProvider.saveWorkspace({
                        project: project,
                    });
                });

            this.pendingWorkspaceSubscription = observableFromEvent(window, 'beforeunload')
                .subscribe(() => {
                    if (this.pendingWorkspace) {
                        this.storageProvider.saveWorkspace(this.pendingWorkspace)
                            .subscribe(() => this.pendingWorkspace = undefined);

                        // this is basically sleep via busy waiting
                        let start = new Date().getTime();
                        for (let i = 0; i < 1e7; i++) {
                            if (!this.pendingWorkspace) {
                                break;
                            }
                            if ((new Date().getTime() - start) > this.config.DELAYS.STORAGE_DEBOUNCE) {
                                break;
                            }
                        }
                    }
                });

            workspaceLoading$.next();
            workspaceLoading$.complete();
        });

        // load layout
        this.storageProvider.loadLayoutSettings().subscribe(layoutSettings => {
            if (layoutSettings) {
                this.layoutService.setLayoutDict(layoutSettings);
            }

            // setup storage
            this.layoutSubscription = this.layoutService.getLayoutDictStream().pipe(
                skip(1)) // don't save the loaded stuff directly again
                .subscribe(layout => {
                    this.storageProvider.saveLayoutSettings(layout).subscribe();
                });

            layoutLoading$.next();
            layoutLoading$.complete();
        });
    }

}
