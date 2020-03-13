import {LayoutDict} from '../layout.service';
import {Project, ProjectDict} from '../project/project.model';
import {ResultType} from '../operators/result-type.model';

import {Config} from '../config.service';
import {ProjectService} from '../project/project.service';
import {Observable} from 'rxjs';
import {NotificationService} from '../notification.service';

/**
 * A WAVE workspace consisting of a project, layers and plots.
 */
export interface Workspace {
    project: Project;
}

/**
 * A WAVE workspace consisting of a project, layers and plots.
 */
export interface WorkspaceDict {
    project: ProjectDict;
}

/**
 * An R-Script
 */
export interface RScript {
    code: string;
    resultType: ResultType;
}

/**
 * An R-Script dictionary
 */
export interface RScriptDict {
    code: string;
    resultType: string;
}

/**
 * Storage Provider that allows saving and retrieval of WAVE settings and items.
 */
export abstract class StorageProvider {
    constructor(
        protected config: Config,
        protected projectService: ProjectService,
        protected notificationService: NotificationService
    ) {}

    /**
     * Load the current Workspace
     * @returns a Observable of a workspace.
     */
    abstract loadWorkspace(): Observable<Workspace>;

    /**
     * Save the current Workspace
     * @param workspace a workspace consisting of the project, layers and plots.
     */
    abstract saveWorkspace(workspace: Workspace): Observable<{}>;

    /**
     * Load layout settings.
     */
    abstract loadLayoutSettings(): Observable<LayoutDict>;

    /**
     * Save layout settings.
     * @param dict a serializable layout dictionary.
     */
    abstract saveLayoutSettings(dict: LayoutDict): Observable<{}>;

    /**
     * Does the project exist?
     * @param name the name of the project
     */
    abstract projectExists(name: string): Observable<boolean>;

    /**
     * Retrieve all projects.
     */
    abstract getProjects(): Observable<Array<string>>;

    /**
     * Save an R script.
     * @param name the name of the script
     * @param script the script itself
     */
    abstract saveRScript(name: string, script: RScript): Observable<void>;

    /**
     * Load an R script.
     * @param name the name of the script
     */
    abstract loadRScript(name: string): Observable<RScript>;

    /**
     * Retrieve all R scripts.
     */
    abstract getRScripts(): Observable<Array<string>>;

}
