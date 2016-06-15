import {Http, Headers} from '@angular/http';

import {StorageProvider, Workspace, WorkspaceDict} from '../storage-provider.model';
import Config from '../../app/config.model';

import {LayoutDict} from '../../app/layout.service';
import {Project} from '../../project/project.model';
import {Session} from '../../users/user.service';

import {LayerService} from '../../layers/layer.service';
import {PlotService} from '../../plots/plot.service';

class ArtifactServiceRequestParameters {
    private parameters: {[index: string]: string | boolean | number};

    constructor(config: {
        request: string,
        sessionToken: string,
        parameters?: {[index: string]: string | boolean | number}
    }) {
        this.parameters = {
            service: 'artifact',
            request: config.request,
            sessiontoken: config.sessionToken,
        };
        if (config.parameters) {
            Object.keys(config.parameters).forEach(
                key => this.parameters[key] = config.parameters[key]
            );
        }
    }

    toMessageBody(encode = false): string {
        return Object.keys(this.parameters).map(
            key => [
                key,
                encode ? encodeURIComponent(this.parameters[key].toString()) : this.parameters[key],
            ].join('=')
        ).join('&');
    }

    getHeaders(): Headers {
        return new Headers({
           'Content-Type': 'application/x-www-form-urlencoded',
        });
    }
}

type ArtifactDefinition = {name: string, type: string, user: string};

/**
 * StorageProvider implementation that uses the mapping's artifact service.
 */
export class MappingStorageProvider extends StorageProvider {

    // constants
    private ARTIFACT_TYPE = 'project';
    private LAYOUT_SETTINGS_STORAGE_NAME = 'layoutSettings';

    private http: Http;
    private session: Session;
    private createDefaultProject: () => Project;

    private artifactName: string;

    constructor(config: {
        layerService: LayerService,
        plotService: PlotService,
        http: Http,
        session: Session,
        createDefaultProject: () => Project,
        artifactName?: string,
    }) {
        super(config.layerService, config.plotService);
        this.http = config.http;

        this.session = config.session;
        this.createDefaultProject = config.createDefaultProject;

        if (config.artifactName) {
            this.artifactName = config.artifactName;
        } else {
            this.artifactName = this.getCurrentArtifactName();
        }
    }

    loadWorkspace(): Promise<Workspace> {
        if (this.artifactName === '') {
            return Promise.resolve({
                project: this.createDefaultProject(),
                layers: [],
                plots: [],
            });
        } else {
            const request = new ArtifactServiceRequestParameters({
                request: 'get',
                sessionToken: this.session.sessionToken,
                parameters: {
                    username: this.session.user,
                    type: this.ARTIFACT_TYPE,
                    name: this.artifactName,
                },
            });
            return this.http.get(
                Config.MAPPING_URL + '?' + request.toMessageBody(true),
                {headers: request.getHeaders()}
            ).toPromise().then(response => {
                const mappingResponse = response.json();
                const workspace: WorkspaceDict = JSON.parse(mappingResponse.value);
                return {
                    project: Project.fromDict(workspace.project),
                    layers: workspace.layers.map(
                        layer => this.layerService.createLayerFromDict(layer)
                    ),
                    plots: workspace.plots.map(
                        plot => this.plotService.createPlotFromDict(plot)
                    ),
                };
            });
        }
    }

    saveWorkspace(workspace: Workspace): Promise<void> {
        let request: string;
        if (this.artifactName === workspace.project.name) {
            request = 'update';
        } else {
            request = 'create';
            this.setCurrentArtifactName(workspace.project.name);
        }

        const updateRequest = new ArtifactServiceRequestParameters({
            request: request,
            sessionToken: this.session.sessionToken,
            parameters: {
                type: this.ARTIFACT_TYPE,
                name: this.artifactName,
                value: JSON.stringify({
                    project: workspace.project.toDict(),
                    layers: workspace.layers.map(layer => layer.toDict()),
                    plots: workspace.plots.map(plot => plot.toDict()),
                }),
            },
        });

        return this.http.post(
            Config.MAPPING_URL,
            updateRequest.toMessageBody(),
            {headers: updateRequest.getHeaders()}
        ).toPromise().then(responseString => {
            const response = responseString.json();
            if (typeof response.result !== 'boolean') {
                // TODO: error handling
            }
        });
    }

    // SAVE AND LOAD LAYOUT LOCALLY

    loadLayoutSettings(): Promise<LayoutDict> {
        const layoutSettings = localStorage.getItem(this.LAYOUT_SETTINGS_STORAGE_NAME);
        if (layoutSettings === null) { // tslint:disable-line:no-null-keyword
            return Promise.resolve(undefined);
        } else {
            return Promise.resolve(JSON.parse(layoutSettings));
        }
    };

    saveLayoutSettings(dict: LayoutDict): Promise<void> {
        localStorage.setItem(this.LAYOUT_SETTINGS_STORAGE_NAME, JSON.stringify(dict));
        return Promise.resolve();
    };

    projectExists(name: string): Promise<boolean> {
        const request = new ArtifactServiceRequestParameters({
            request: 'get',
            sessionToken: this.session.sessionToken,
            parameters: {
                username: this.session.user,
                type: this.ARTIFACT_TYPE,
                name: name,
            },
        });
        return this.http.get(
            Config.MAPPING_URL + '?' + request.toMessageBody(true),
            {headers: request.getHeaders()}
        ).toPromise().then(response => {
            return this.mappingResultToBoolean(response.json().result);
        });
    }

    getProjects(): Promise<Array<string>> {
        const request = new ArtifactServiceRequestParameters({
            request: 'list',
            sessionToken: this.session.sessionToken,
            parameters: {
                type: this.ARTIFACT_TYPE,
            },
        });
        return this.http.get(
            Config.MAPPING_URL + '?' + request.toMessageBody(true),
            {headers: request.getHeaders()}
        ).toPromise().then(response => {
            const mappingResponse = response.json();
            if (this.mappingResultToBoolean(mappingResponse.result)) {
                const artifacts: Array<ArtifactDefinition> = mappingResponse.artifacts;
                return artifacts.filter(
                    artifact => artifact.user === this.session.user // TODO: refactor for sharing
                ).filter(
                    artifact => artifact.name !== this.artifactName
                ).map(
                    artifact => artifact.name
                );
            } else {
                // TODO: handle error
                return [];
            }
        });
    };

    private setCurrentArtifactName(name: string) {
        this.artifactName = name;
        localStorage.setItem('artifactName', name);
    }

    private getCurrentArtifactName(): string {
        const artifactName = localStorage.getItem('artifactName');
        if (artifactName === null) {// tslint:disable-line:no-null-keyword
            return '';
        } else {
            return artifactName;
        }
    }

    private mappingResultToBoolean(mappingResult: boolean | string) {
        return typeof mappingResult === 'boolean' && mappingResult;
    }

}
