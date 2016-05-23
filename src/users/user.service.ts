import {Injectable} from 'angular2/core';
import {BehaviorSubject} from 'rxjs/Rx';

import {User, Guest} from './user.model';
import {StorageProvider} from './storage/storage-provider.model';
import {BrowserStorageProvider} from './storage/browser-storage-provider.model';

import {LayoutService} from '../app/layout.service';
import {LayerService} from '../services/layer.service';
import {ProjectService} from '../services/project.service';
import {PlotService} from '../plots/plot.service';
import {MappingQueryService} from '../services/mapping-query.service';

/**
 * A service that is responsible for retrieving user information and modifying the current user.
 */
@Injectable()
export class UserService {
    private user$: BehaviorSubject<User>;
    private storageProvider: StorageProvider;

    constructor(
        private layerService: LayerService,
        private projectService: ProjectService,
        private plotService: PlotService,
        private mappingQueryService: MappingQueryService,
        private layoutService: LayoutService
    ) {
        this.user$ = new BehaviorSubject(new Guest());

        this.storageSetup();
    }

    /**
     * @returns Retrieve the current user.
     */
    getUser() {
        return this.user$.getValue();
    }

    /**
     * @returns Retrieve a stream that notifies about the current user.
     */
    getUserStream() {
        return this.user$;
    }

    /**
     * Login using user credentials. If it was successful, set a new user.
     * @param credentials.user The user name.
     * @param credentials.password The user's password.
     * @returns `true` if the login was succesful, `false` otherwise.
     */
    login(credentials: {user: string, password: string}): boolean {
        // TODO: implement
        throw 'Login not yet implemented!';
    }

    /**
     * Change the details of the current user.
     * @param details.firstName The first name
     * @param details.lastName  The last name
     * @param details.email     The E-Mail address
     */
    changeDetails(details: {realName: string, email: string}) {
        let user = this.getUser();
        user.realName = details.realName;
        user.email = details.email;

        this.user$.next(user);
    }

    private storageSetup() {
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

        // load stored values on user change
        this.user$.subscribe(user => {
            this.storageProvider = undefined;

            let storageProvider: StorageProvider;
            if (user instanceof Guest) {
                storageProvider = new BrowserStorageProvider();
            } else {
                throw 'Not yet implemented'; // TODO: implement
            }

            const project = storageProvider.loadProject();
            if (project) {
                this.projectService.setProject(project);
            }

            const layers = storageProvider.loadLayers(this.layerService);
            if (layers) {
                this.layerService.setLayers(layers);
            }

            const plots = storageProvider.loadPlots(this.plotService);
            if (plots) {
                this.plotService.setPlots(plots);
            }

            const layoutSettings = storageProvider.loadLayoutSettings();
            if (layoutSettings) {
                this.layoutService.setLayoutDict(layoutSettings);
            }

            this.storageProvider = storageProvider;
        });

    }

}
