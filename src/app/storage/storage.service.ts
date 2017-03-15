import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {Observable, Subscription} from 'rxjs/Rx';

import {StorageProvider, RScript} from './storage-provider.model';
import {BrowserStorageProvider} from './providers/browser-storage-provider.model';
import {MappingStorageProvider} from './providers/mapping-storage-provider.model';

import {LayoutService} from '../layout.service';
import {LayerService} from '../../layers/layer.service';
import {ProjectService} from '../project/project.service';
import {UserService} from '../users/user.service';
import {Config} from '../config.service';

/**
 * A service that is responsible for saving the app state.
 */
@Injectable()
export class StorageService {
    private storageProvider: StorageProvider;

    private projectSubscription: Subscription;
    private layoutSubscription: Subscription;

    constructor(private config: Config,
                private layerService: LayerService,
                private projectService: ProjectService,
                private layoutService: LayoutService,
                private userService: UserService,
                private http: Http) {
        // load stored values on session change
        this.userService.getSessionStream()
            .subscribe(session => {
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

    /**
     * Remove the old provider, create a new one and load saved data.
     */
    private resetStorageProvider(projectName: string = undefined) {
        // clean up old provider stuff
        this.storageProvider = undefined;
        if (this.projectSubscription) {
            this.projectSubscription.unsubscribe();
        }
        if (this.layoutSubscription) {
            this.layoutSubscription.unsubscribe();
        }

        // create suitable provider
        if (this.userService.isGuestUser()) {
            this.storageProvider = new BrowserStorageProvider(this.config, this.layerService, this.projectService);
        } else {
            this.storageProvider = new MappingStorageProvider({
                config: this.config,
                layerService: this.layerService,
                projectService: this.projectService,
                http: this.http,
                session: this.userService.getSession(),
                createDefaultProject: this.projectService.createDefaultProject,
                projectName: projectName,
            });
        }

        // load workspace
        this.storageProvider.loadWorkspace().subscribe(workspace => {
            if (workspace.project) {
                this.projectService.setProject(workspace.project);
            }
            if (workspace.layers) {
                this.layerService.setLayers(workspace.layers);
            }

            // setup storage
            this.projectSubscription = Observable
                .combineLatest(
                    this.projectService.getProjectStream(),
                    this.layerService.getLayersStream(),
                )
                .skip(1) // don't save the loaded stuff directly again
                .debounceTime(this.config.DELAYS.STORAGE_DEBOUNCE)
                .subscribe(([project, layers]) => {
                    if (this.storageProvider) {
                        this.storageProvider.saveWorkspace({
                            project: project,
                            layers: layers,
                        });
                    }
                });
        });

        // load layout
        this.storageProvider.loadLayoutSettings().subscribe(layoutSettings => {
            if (layoutSettings) {
                this.layoutService.setLayoutDict(layoutSettings);
            }

            // setup storage
            this.layoutSubscription = this.layoutService.getLayoutDictStream()
                .skip(1) // don't save the loaded stuff directly again
                .subscribe(layout => {
                    if (this.storageProvider) {
                        this.storageProvider.saveLayoutSettings(layout).subscribe();
                    }
                });
        });
    }

}
