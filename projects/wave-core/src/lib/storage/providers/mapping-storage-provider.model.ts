
import {Observable, ReplaySubject, Subject, EMPTY, of as observableOf} from 'rxjs';

import {tap, map, first, mergeMap} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';

import {RScript, RScriptDict, StorageProvider, Workspace, WorkspaceDict} from '../storage-provider.model';
import {MappingRequestParameters, ParametersType} from '../../queries/request-parameters.model';
import {Operator} from '../../operators/operator.model';
import {ResultTypes} from '../../operators/result-type.model';

import {LayoutDict} from '../../layout.service';
import {Project} from '../../project/project.model';
import {Session} from '../../users/user.service';
import {Config} from '../../config.service';
import {ProjectService} from '../../project/project.service';
import {NotificationService} from '../../notification.service';

const TYPES = {
    PROJECTS: '__wave_projects',
    WAVE_SETTINGS: '__wave_settings',
    R_SCRIPTS: '__wave_r_scripts',
};

const KEYS = {
    CURRENT_PROJECT_NAME: 'project_name',
    LAYOUT_SETTINGS: 'layoutSettings',
};

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

interface MappingResponse {
    result: boolean | string;
    artifacts?: Array<ArtifactDefinition>;
    value?: string;
}

/**
 * StorageProvider implementation that uses the mapping's artifact service.
 */
export class MappingStorageProvider extends StorageProvider {

    private http: HttpClient;
    private session: Session;
    private createDefaultProject: () => Project;

    private projectName$: ReplaySubject<string> = new ReplaySubject<string>(1);

    private static mappingHasResult(response: { result: boolean | string }): boolean {
        return response.result && typeof response.result === 'boolean';
    }

    constructor(config: {
        config: Config,
        projectService: ProjectService,
        notificationService: NotificationService,
        http: HttpClient,
        session: Session,
        createDefaultProject: () => Project,
        projectName?: string,
    }) {
        super(config.config, config.projectService, config.notificationService);
        this.http = config.http;

        this.session = config.session;
        this.createDefaultProject = config.createDefaultProject;

        if (config.projectName) {
            this.setCurrentProjectName(config.projectName);
        } else {
            this.getCurrentProjectName()
                .subscribe(this.projectName$);
        }
    }

    loadWorkspace(): Observable<Workspace> {
        return this.projectName$.pipe(first(), mergeMap(projectName => {
            if (!projectName) {
                return observableOf({
                    project: this.createDefaultProject(),
                    layers: [],
                });
            } else {
                const request = new ArtifactServiceRequestParameters({
                    request: 'get',
                    sessionToken: this.session.sessionToken,
                    parameters: {
                        username: this.session.user,
                        type: TYPES.PROJECTS,
                        name: projectName,
                    },
                });
                return this.http
                    .get<MappingResponse>(
                        this.config.MAPPING_URL + '?' + request.toMessageBody(true),
                        {headers: request.getHeaders()}
                    ).pipe(
                    map(response => {
                        if (MappingStorageProvider.mappingHasResult(response)) {
                            const workspace: WorkspaceDict = JSON.parse(response.value);

                            const operatorMap = new Map<number, Operator>();

                            return {
                                project: Project.fromDict({
                                    dict: workspace.project,
                                    config: this.config,
                                    notificationService: this.notificationService,
                                    operatorMap: operatorMap,
                                })
                            }
                        } else {
                            // the workspace does not exist
                            return {
                                project: this.createDefaultProject(),
                            };
                        }
                    }));
            }
        }), );
    }

    saveWorkspace(workspace: Workspace): Observable<{}> {
        const subject = new Subject();

        this.projectName$.pipe(
            first(),
            mergeMap(projectName => {

                let currentNameRequest: Observable<{}>;
                if (projectName === workspace.project.name) {
                    currentNameRequest = observableOf({});
                } else {
                    currentNameRequest = this.setCurrentProjectName(workspace.project.name);
                }

                return currentNameRequest.pipe(
                    mergeMap(() => this.saveWorkspaceHelper(workspace)));
            }),
            mergeMap(updateSuccessful => {
                if (updateSuccessful) {
                    return observableOf({});
                } else {
                    return this.saveWorkspaceHelper(workspace, 'create');
                }
            }), )
            .subscribe(
                () => subject.next(),
                () => {
                },
                () => subject.complete(),
            );

        return subject;
    }

    // SAVE AND LOAD LAYOUT LOCALLY
    loadLayoutSettings(): Observable<LayoutDict> {
        const layoutSettings = localStorage.getItem(KEYS.LAYOUT_SETTINGS);
        if (layoutSettings === null) { // tslint:disable-line:no-null-keyword
            return observableOf(undefined);
        } else {
            return observableOf(JSON.parse(layoutSettings));
        }
    };

    saveLayoutSettings(dict: LayoutDict): Observable<{}> {
        localStorage.setItem(KEYS.LAYOUT_SETTINGS, JSON.stringify(dict));
        return observableOf({});
    };

    projectExists(name: string): Observable<boolean> {
        const request = new ArtifactServiceRequestParameters({
            request: 'get',
            sessionToken: this.session.sessionToken,
            parameters: {
                username: this.session.user,
                type: TYPES.PROJECTS,
                name: name,
            },
        });
        return this.http
            .get<MappingResponse>(
                this.config.MAPPING_URL + '?' + request.toMessageBody(true),
                {headers: request.getHeaders()}
            ).pipe(
            map(MappingStorageProvider.mappingHasResult));
    }

    getProjects(): Observable<Array<string>> {
        const request = new ArtifactServiceRequestParameters({
            request: 'list',
            sessionToken: this.session.sessionToken,
            parameters: {
                type: TYPES.PROJECTS,
            },
        });
        return this.http
            .get<MappingResponse>(
                this.config.MAPPING_URL + '?' + request.toMessageBody(true),
                {headers: request.getHeaders()}
            ).pipe(
            map(response => {
                if (MappingStorageProvider.mappingHasResult(response)) {
                    const artifacts: Array<ArtifactDefinition> = response.artifacts;
                    return artifacts.filter(
                        artifact => artifact.user === this.session.user // TODO: refactor for sharing
                    ).map(
                        artifact => artifact.name
                    );
                } else {
                    // TODO: handle error
                    return [];
                }
            }));
    };

    saveRScript(name: string, script: RScript): Observable<void> {
        const scriptDict: RScriptDict = {
            resultType: script.resultType.getCode(),
            code: script.code,
        };

        const updateRequest = new ArtifactServiceRequestParameters({
            request: 'update',
            sessionToken: this.session.sessionToken,
            parameters: {
                type: TYPES.R_SCRIPTS,
                name: name,
                value: JSON.stringify(scriptDict),
            },
        });

        return this.http
            .post<MappingResponse>(
                this.config.MAPPING_URL,
                updateRequest.toMessageBody(true),
                {headers: updateRequest.getHeaders()}
            ).pipe(
            mergeMap(response => {
                if (MappingStorageProvider.mappingHasResult(response)) {
                    return observableOf(undefined);
                } else {
                    // TODO: refactor inner request
                    // `create` on error
                    const createRequest = new ArtifactServiceRequestParameters({
                        request: 'create',
                        sessionToken: this.session.sessionToken,
                        parameters: {
                            type: TYPES.R_SCRIPTS,
                            name: name,
                            value: JSON.stringify(scriptDict),
                        },
                    });

                    return this.http
                        .post<MappingResponse>(
                            this.config.MAPPING_URL,
                            createRequest.toMessageBody(),
                            {headers: createRequest.getHeaders()}
                        ).pipe(
                        map(response2 => {
                            if (MappingStorageProvider.mappingHasResult(response2)) {
                                return observableOf(undefined);
                            } else {
                                // TODO: error handling
                            }
                        }));
                }
            }));
    }

    loadRScript(name: string): Observable<RScript> {
        const request = new ArtifactServiceRequestParameters({
            request: 'get',
            sessionToken: this.session.sessionToken,
            parameters: {
                username: this.session.user,
                type: TYPES.R_SCRIPTS,
                name: name,
            },
        });
        return this.http.get<MappingResponse>(
            this.config.MAPPING_URL + '?' + request.toMessageBody(true),
            {headers: request.getHeaders()}
        ).pipe(map(response => {
            const rScriptDict: RScriptDict = JSON.parse(response.value);

            return {
                resultType: ResultTypes.fromCode(rScriptDict.resultType),
                code: rScriptDict.code,
            };
        }));
    };

    getRScripts(): Observable<Array<string>> {
        const request = new ArtifactServiceRequestParameters({
            request: 'list',
            sessionToken: this.session.sessionToken,
            parameters: {
                type: TYPES.R_SCRIPTS,
            },
        });
        return this.http.get<MappingResponse>(
            this.config.MAPPING_URL + '?' + request.toMessageBody(true),
            {headers: request.getHeaders()}
        ).pipe(map(response => {
            if (MappingStorageProvider.mappingHasResult(response)) {
                const artifacts: Array<ArtifactDefinition> = response.artifacts;
                return artifacts.filter(
                    artifact => artifact.user === this.session.user // TODO: refactor for sharing
                ).map(
                    artifact => artifact.name
                );
            } else {
                // TODO: handle error
                return [];
            }
        }));
    };

    private saveWorkspaceHelper(workspace: Workspace, request: ('update' | 'create') = 'update'): Observable<boolean> {
        const projectName = workspace.project.name;

        const updateRequest = new ArtifactServiceRequestParameters({
            request: request,
            sessionToken: this.session.sessionToken,
            parameters: {
                type: TYPES.PROJECTS,
                name: projectName,
                value: JSON.stringify({
                    project: workspace.project.toDict(),
                }),
            },
        });

        return this.http
            .post<MappingResponse>(
                this.config.MAPPING_URL,
                updateRequest.toMessageBody(true),
                {headers: updateRequest.getHeaders()}
            ).pipe(
            map(MappingStorageProvider.mappingHasResult));
    }

    private setCurrentProjectName(name: string, request: ('update' | 'create') = 'update'): Observable<{}> {
        const subject = new Subject();

        const updateRequest = new ArtifactServiceRequestParameters({
            request: request,
            sessionToken: this.session.sessionToken,
            parameters: {
                type: TYPES.WAVE_SETTINGS,
                name: KEYS.CURRENT_PROJECT_NAME,
                value: name,
            },
        });

        this.http
            .post<MappingResponse>(
                this.config.MAPPING_URL,
                updateRequest.toMessageBody(),
                {headers: updateRequest.getHeaders()}
            ).pipe(
            mergeMap(response => {
                if (typeof response.result !== 'boolean') {
                    // `create` on error
                    if (request === 'update') {
                        return this.setCurrentProjectName(name, 'create');
                    } else {
                        // TODO: handle error if mapping is erroneous or internet is down
                        return EMPTY;
                    }
                } else {
                    return observableOf({}).pipe(
                        tap(() => this.projectName$.next(name)));
                }
            }))
            .subscribe(
                () => subject.next(),
                () => {
                },
                () => subject.complete(),
            );

        return subject;
    }

    private getCurrentProjectName(): Observable<string> {
        const request = new ArtifactServiceRequestParameters({
            request: 'get',
            sessionToken: this.session.sessionToken,
            parameters: {
                username: this.session.user,
                type: TYPES.WAVE_SETTINGS,
                name: KEYS.CURRENT_PROJECT_NAME,
            },
        });
        return this.http
            .get<MappingResponse>(
                this.config.MAPPING_URL + '?' + request.toMessageBody(true),
                {headers: request.getHeaders()}
            ).pipe(
            map(response => {
                if (MappingStorageProvider.mappingHasResult(response)) {
                    return response.value;
                } else {
                    return undefined;
                }
            }));
    }

}
