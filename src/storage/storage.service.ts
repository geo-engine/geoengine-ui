import {Injectable} from '@angular/core';

import Config from '../app/config.model';

import {StorageProvider} from './storage-provider.model';
import {BrowserStorageProvider} from './providers/browser-storage-provider.model';

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
        private userService: UserService
    ) {
        // setup storage
        this.projectService.getProjectStream().subscribe(project => {
            if (this.storageProvider) {
                this.storageProvider.saveProject(project);
            }
        });
        this.layerService.getLayersStream().subscribe(layers => {
            if (this.storageProvider) {
                this.storageProvider.saveLayers(layers);
            }
        });
        this.plotService.getPlotsStream().subscribe(plots => {
            if (this.storageProvider) {
                this.storageProvider.savePlots(plots);
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

    /**
     * Remove the old provider, create a new one and load saved data.
     */
    private resetStorageProvider(session: Session) {
        this.storageProvider = undefined;

        let storageProvider: StorageProvider;
        if (session.user === Config.USER.GUEST.NAME) {
            storageProvider = new BrowserStorageProvider(this.layerService, this.plotService);
        } else {
            throw 'Not yet implemented'; // TODO: implement
        }

        storageProvider.loadProject().then(project => {
            if (project) {
                this.projectService.setProject(project);
            }
        });

        storageProvider.loadLayers().then(layers => {
            if (layers) {
                this.layerService.setLayers(layers);
            }
        });

        storageProvider.loadPlots().then(plots => {
            if (plots) {
                this.plotService.setPlots(plots);
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
