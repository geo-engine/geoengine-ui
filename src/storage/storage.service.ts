import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {Observable} from 'rxjs/Rx';

import Config from '../app/config.model';

import {StorageProvider} from './storage-provider.model';
import {BrowserStorageProvider} from './providers/browser-storage-provider.model';
import {MappingStorageProvider} from './providers/mapping-storage-provider.model';

import {LayoutService} from '../app/layout.service';
import {LayerService} from '../layers/layer.service';
import {ProjectService} from '../project/project.service';
import {PlotService} from '../plots/plot.service';
import {UserService, Session} from '../users/user.service';

/**
 * A service that is responsible for saving the app state.
 */
@Injectable()
export class StorageService {
    private storageProvider: StorageProvider;

    constructor(
        private layerService: LayerService,
        private projectService: ProjectService,
        private plotService: PlotService,
        private layoutService: LayoutService,
        private userService: UserService,
        private http: Http
    ) {
        // setup storage
        const debounceTime = 2000; // ms
        Observable.combineLatest(
            this.projectService.getProjectStream(),
            this.layerService.getLayersStream(),
            this.plotService.getPlotsStream()
        ).debounceTime(
            debounceTime
        ).subscribe(([project, layers, plots]) => {
            if (this.storageProvider) {
                this.storageProvider.saveWorkspace({
                    project: project,
                    layers: layers,
                    plots: plots,
                });
            }
        });
        this.layoutService.getLayoutDictStream().subscribe(layout => {
            if (this.storageProvider) {
                this.storageProvider.saveLayoutSettings(layout);
            }
        });

        // load stored values on session change
        this.userService.getSessionStream().subscribe(session => {
            // check validity
            this.userService.isSessionValid(session).then(valid => {
                // console.log('valid?', valid);
                if (valid) {
                    this.resetStorageProvider(session);
                } else {
                    this.userService.login({
                        user: Config.USER.GUEST.NAME,
                        password: Config.USER.GUEST.PASSWORD,
                    });
                }
            });
        });
    }

    projectExists(name: string) {
        return this.storageProvider.projectExists(name);
    }

    /**
     * Remove the old provider, create a new one and load saved data.
     */
    private resetStorageProvider(session: Session) {
        this.storageProvider = undefined;

        let storageProvider: StorageProvider;
        if (session.user === Config.USER.GUEST.NAME) {
            storageProvider = new BrowserStorageProvider(this.layerService, this.plotService);
        } else {
            storageProvider = new MappingStorageProvider(
                this.layerService,
                this.plotService,
                this.http,
                this.userService.getSession(),
                this.projectService.createDefaultProject
            );
        }

        storageProvider.loadWorkspace().then(workspace => {
            if (workspace.project) {
                this.projectService.setProject(workspace.project);
            }
            if (workspace.layers) {
                this.layerService.setLayers(workspace.layers);
            }
            if (workspace.plots) {
                this.plotService.setPlots(workspace.plots);
            }
        });

        storageProvider.loadLayoutSettings().then(layoutSettings => {
            if (layoutSettings) {
                this.layoutService.setLayoutDict(layoutSettings);
            }

            this.storageProvider = storageProvider;
        });
    }

}
