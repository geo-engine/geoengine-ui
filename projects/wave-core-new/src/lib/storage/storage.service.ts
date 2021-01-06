import {
    BehaviorSubject,
    combineLatest,
    fromEvent,
    Observable,
    Subject,
    Subscription
} from 'rxjs';
import {debounceTime, filter, first, map, skip, tap} from 'rxjs/operators';

import {Injectable} from '@angular/core';

import {RScript} from './storage.model';

import {LayoutDict, LayoutService} from '../layout.service';
import {ProjectService} from '../project/project.service';
import {UserService} from '../users/user.service';
import {Config} from '../config.service';
import {Project} from '../project/project.model';
import {NotificationService} from '../notification.service';
import {BackendService} from '../backend/backend.service';
import {UUID} from '../backend/backend.model';

export enum StorageStatus {
    PENDING,
    OK,
}

/**
 * A service that is responsible for saving the app state.
 */
@Injectable()
export class StorageService {
    private projectSubscription: Subscription;
    private layoutSubscription: Subscription;

    private pendingProject?: Project;
    private pendingProjectSubscription: Subscription;

    private storageStatus$ = new BehaviorSubject(StorageStatus.PENDING);

    private sessionId: UUID;

    constructor(private config: Config,
                private projectService: ProjectService,
                private layoutService: LayoutService,
                private userService: UserService,
                private notificationService: NotificationService,
                private backend: BackendService) {
        // load stored values on session change
        this.userService.getSessionStream().subscribe(session => {
            // TODO: is this necessary?
            this.storageStatus$.next(StorageStatus.PENDING);

            this.sessionId = session.sessionToken;
            this.resetStorageProvider(session.lastProjectId);
        });
    }

    /**
     * Checks if a project exists with this name.
     */
    projectExists(name: string): Observable<boolean> {
        return null; // TODO: implement
    }

    /**
     * Retrieve all projects for a user.
     */
    getProjects(): Observable<Array<string>> {
        // TODO: parametrize
        return this.backend.listProjects({
            filter: 'None',
            limit: 10,
            offset: 0,
            order: 'NameAsc',
            permissions: ['Owner'],
        }, this.sessionId).pipe(
            map(projects => projects.map(project => project.name))
        );
    }

    loadProjectByName(name: string) {
        return null; // TODO: implement
    }

    saveRScript(name: string, script: RScript): Observable<void> {
        return null; // TODO: implement
    }

    loadRScriptByName(name: string): Observable<RScript> {
        return null; // TODO: implement
    }

    getRScripts(): Observable<Array<string>> {
        return null; // TODO: implement
    }

    getStatus(): Observable<StorageStatus> {
        return this.storageStatus$;
    }

    protected saveProject(project: Project): Observable<{}> {
        return null; // TODO: implement
    }

    protected loadProject(projectId?: UUID): Observable<Project> {
        return null; // TODO: implement
    }

    protected loadLayoutSettings(): Observable<LayoutDict> {
        return null; // TODO: implement
    }

    protected saveLayoutSettings(layout: LayoutDict): Observable<{}> {
        return null; // TODO: implement
    }

    /**
     * Remove the old provider, create a new one and load saved data.
     */
    protected resetStorageProvider(projectId?: UUID) {
        // clean up old subscriptions
        if (this.projectSubscription) {
            this.projectSubscription.unsubscribe();
        }
        if (this.layoutSubscription) {
            this.layoutSubscription.unsubscribe();
        }
        if (this.pendingProjectSubscription) {
            this.pendingProjectSubscription.unsubscribe();
        }
        if (this.pendingProject) {
            this.saveProject(this.pendingProject);

            this.pendingProject = undefined;
        }

        const projectLoading$ = new Subject<void>();
        const layoutLoading$ = new Subject<void>();

        combineLatest([projectLoading$, layoutLoading$]).pipe(
            first()
        ).subscribe(() => this.storageStatus$.next(StorageStatus.OK));

        // load workspace
        this.loadProject().subscribe(initialProject => {
            const newProject = initialProject ? initialProject : this.projectService.createDefaultProject();

            this.projectService.setProject(newProject);

            // setup storage
            this.projectSubscription = this.projectService.getProjectStream().pipe(
                filter(project => project !== newProject), // skip saving the previously loaded project
                tap(project => {
                    // save pending change
                    this.pendingProject = project;
                }),
                debounceTime(this.config.DELAYS.STORAGE_DEBOUNCE),
                tap(() => {
                    // store pending change
                    this.pendingProject = undefined;
                }))
                .subscribe(project => {
                    this.saveProject(project);
                });

            // store pending project when browser (tab) is closed
            this.pendingProjectSubscription = fromEvent(window, 'beforeunload')
                .subscribe(() => {
                    if (this.pendingProject) {
                        this.saveProject(this.pendingProject)
                            .subscribe(() => this.pendingProject = undefined);

                        // this is basically sleep via busy waiting
                        const start = new Date().getTime();
                        for (let i = 0; i < 1e7; i++) {
                            if (!this.pendingProject) {
                                break;
                            }
                            if ((new Date().getTime() - start) > this.config.DELAYS.STORAGE_DEBOUNCE) {
                                break;
                            }
                        }
                    }
                });

            projectLoading$.next();
            projectLoading$.complete();
        });

        // load layout
        this.loadLayoutSettings().subscribe(layoutSettings => {
            if (layoutSettings) {
                this.layoutService.setLayoutDict(layoutSettings);
            }

            // setup storage
            this.layoutSubscription = this.layoutService.getLayoutDictStream().pipe(
                skip(1)) // don't save the loaded stuff directly again
                .subscribe(layout => {
                    this.saveLayoutSettings(layout).subscribe();
                });

            layoutLoading$.next();
            layoutLoading$.complete();
        });
    }

}
