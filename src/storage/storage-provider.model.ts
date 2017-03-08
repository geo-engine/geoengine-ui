import {LayoutDict} from '../app/layout.service';
import {Layer, LayerDict} from '../layers/layer.model';
import {Project, ProjectDict} from '../app/project/project.model';
import {Symbology} from '../symbology/symbology.model';
import {ResultType} from '../app/operators/result-type.model';

import {LayerService} from '../layers/layer.service';
import {Config} from '../app/config.service';
import {ProjectService} from '../app/project/project.service';

/**
 * A WAVE workspace consisting of a project, layers and plots.
 */
export interface Workspace {
    project: Project;
    layers: Array<Layer<Symbology>>;
}

/**
 * A WAVE workspace consisting of a project, layers and plots.
 */
export interface WorkspaceDict {
    project: ProjectDict;
    layers: Array<LayerDict>;
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
        protected layerService: LayerService,
        protected projectService: ProjectService
    ) {}

    /**
     * Load the current Workspace
     * @returns a promise of a workspace.
     */
    abstract loadWorkspace(): Promise<Workspace>;

    /**
     * Save the current Workspace
     * @param workspace a workspace consisting of the project, layers and plots.
     */
    abstract saveWorkspace(workspace: Workspace): Promise<void>;

    /**
     * Load layout settings.
     */
    abstract loadLayoutSettings(): Promise<LayoutDict>;

    /**
     * Save layout settings.
     * @param dict a serializable layout dictionary.
     */
    abstract saveLayoutSettings(dict: LayoutDict): Promise<void>;

    /**
     * Does the project exist?
     * @param name the name of the project
     */
    abstract projectExists(name: string): Promise<boolean>;

    /**
     * Retrieve all projects.
     */
    abstract getProjects(): Promise<Array<string>>;

    /**
     * Save an R script.
     * @param name the name of the script
     * @paran scrpipt the script itself
     */
    abstract saveRScript(name: string, script: RScript): Promise<void>;

    /**
     * Load an R script.
     * @param name the name of the script
     */
    abstract loadRScript(name: string): Promise<RScript>;

    /**
     * Retrieve all R scripts.
     */
    abstract getRScripts(): Promise<Array<string>>;

}
