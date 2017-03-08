import {Http} from '@angular/http';

import {
    StorageProvider, Workspace, WorkspaceDict, RScript, RScriptDict,
} from '../storage-provider.model';
import {MappingRequestParameters, ParametersType} from '../../queries/request-parameters.model';
import {Operator} from '../../app/operators/operator.model';
import {ResultTypes} from '../../app/operators/result-type.model';

import {LayoutDict} from '../../app/layout.service';
import {Project} from '../../app/project/project.model';
import {Session} from '../../app/users/user.service';

import {LayerService} from '../../layers/layer.service';
import {Config} from '../../app/config.service';
import {ProjectService} from '../../app/project/project.service';

class ArtifactServiceRequestParameters extends MappingRequestParameters {
    constructor(config: {
        request: string,
        sessionToken: string,
        parameters?: ParametersType
    }) {
        super({
            service: 'artifact',
            request: config.request,
            sessionToken: config.sessionToken,
            parameters: config.parameters,
        });
    }
}

interface ArtifactDefinition {
    name: string;
    type: string;
    user: string;
}

/**
 * StorageProvider implementation that uses the mapping's artifact service.
 */
export class MappingStorageProvider extends StorageProvider {

    // constants
    private ARTIFACT_TYPE = 'project';
    private LAYOUT_SETTINGS_STORAGE_NAME = 'layoutSettings';
    private R_SCRIPT_ARTIFACT_TYPE = 'r_script';

    private http: Http;
    private session: Session;
    private createDefaultProject: () => Project;

    private artifactName: string;

    constructor(config: {
        config: Config,
        layerService: LayerService,
        projectService: ProjectService,
        http: Http,
        session: Session,
        createDefaultProject: () => Project,
        artifactName?: string,
    }) {
        super(config.config, config.layerService, config.projectService);
        this.http = config.http;

        this.session = config.session;
        this.createDefaultProject = config.createDefaultProject;

        if (config.artifactName) {
            this.artifactName = config.artifactName;
            this.setCurrentArtifactName(this.artifactName);
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
                this.config.MAPPING_URL + '?' + request.toMessageBody(true),
                {headers: request.getHeaders()}
            ).toPromise().then(response => {
                const mappingResponse = response.json();
                const workspace: WorkspaceDict = JSON.parse(mappingResponse.value);

                const operatorMap = new Map<number, Operator>();

                return {
                    project: Project.fromDict(workspace.project, operatorMap),
                    layers: workspace.layers.map(
                        layer => this.layerService.createLayerFromDict(layer, operatorMap)
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
                }),
            },
        });

        return this.http.post(
            this.config.MAPPING_URL,
            updateRequest.toMessageBody(true),
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
            this.config.MAPPING_URL + '?' + request.toMessageBody(true),
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
            this.config.MAPPING_URL + '?' + request.toMessageBody(true),
            {headers: request.getHeaders()}
        ).toPromise().then(response => {
            const mappingResponse = response.json();
            if (this.mappingResultToBoolean(mappingResponse.result)) {
                const artifacts: Array<ArtifactDefinition> = mappingResponse.artifacts;
                return artifacts.filter(
                    artifact => artifact.user === this.session.user // TODO: refactor for sharing
                ).map(
                    artifact => artifact.name
                );
            } else {
                // TODO: handle error
                return [];
            }
        });
    };

    saveRScript(name: string, script: RScript): Promise<void> {
        const scriptDict: RScriptDict = {
            resultType: script.resultType.getCode(),
            code: script.code,
        };

        const updateRequest = new ArtifactServiceRequestParameters({
            request: 'update',
            sessionToken: this.session.sessionToken,
            parameters: {
                type: this.R_SCRIPT_ARTIFACT_TYPE,
                name: name,
                value: JSON.stringify(scriptDict),
            },
        });

        return this.http.post(
            this.config.MAPPING_URL,
            updateRequest.toMessageBody(),
            {headers: updateRequest.getHeaders()}
        ).toPromise().then(responseString => {
            const response = responseString.json();
            if (typeof response.result !== 'boolean') {
                // `create` on error
                const createRequest = new ArtifactServiceRequestParameters({
                    request: 'create',
                    sessionToken: this.session.sessionToken,
                    parameters: {
                        type: this.R_SCRIPT_ARTIFACT_TYPE,
                        name: name,
                        value: JSON.stringify(scriptDict),
                    },
                });

                return this.http.post(
                    this.config.MAPPING_URL,
                    createRequest.toMessageBody(),
                    {headers: createRequest.getHeaders()}
                ).toPromise().then(newResponseString => {
                    const newResponse = newResponseString.json();
                    if (typeof newResponse.result !== 'boolean') {
                        // TODO: error handling
                    }
                });
            }
        });
    }

    loadRScript(name: string): Promise<RScript> {
        const request = new ArtifactServiceRequestParameters({
            request: 'get',
            sessionToken: this.session.sessionToken,
            parameters: {
                username: this.session.user,
                type: this.R_SCRIPT_ARTIFACT_TYPE,
                name: name,
            },
        });
        return this.http.get(
            this.config.MAPPING_URL + '?' + request.toMessageBody(true),
            {headers: request.getHeaders()}
        ).toPromise().then(response => {
            const mappingResponse = response.json();
            const rScriptDict: RScriptDict = JSON.parse(mappingResponse.value);

            return {
                resultType: ResultTypes.fromCode(rScriptDict.resultType),
                code: rScriptDict.code,
            };
        });
    };

    getRScripts(): Promise<Array<string>> {
        const request = new ArtifactServiceRequestParameters({
            request: 'list',
            sessionToken: this.session.sessionToken,
            parameters: {
                type: this.R_SCRIPT_ARTIFACT_TYPE,
            },
        });
        return this.http.get(
            this.config.MAPPING_URL + '?' + request.toMessageBody(true),
            {headers: request.getHeaders()}
        ).toPromise().then(response => {
            const mappingResponse = response.json();
            if (this.mappingResultToBoolean(mappingResponse.result)) {
                const artifacts: Array<ArtifactDefinition> = mappingResponse.artifacts;
                return artifacts.filter(
                    artifact => artifact.user === this.session.user // TODO: refactor for sharing
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
