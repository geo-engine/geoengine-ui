import {LayoutDict} from '../../app/layout.service';
import {Layer} from '../../models/layer.model';
import {Project} from '../../models/project.model';
import {Plot} from '../../plots/plot.model';

import {ProjectService} from '../../services/project.service';
import {MappingQueryService} from '../../services/mapping-query.service';

/**
 * Storage Provider that allows saving and retrieval of WAVE settings and items.
 */
export interface StorageProvider {

    /**
     * Load the current project.
     * @returns A project instance.
     */
    loadProject(): Project;

    /**
     * Save the current project.
     * @param project A project instance.
     */
    saveProject(project: Project): void;

    /**
     * Load the current layers.
     * @returns An array of layers.
     */
    loadLayers(mappingQueryService: MappingQueryService,
              projectService: ProjectService): Array<Layer<any>>;

    /**
     * Save the current layers.
     * @param layers An array of layers.
     */
    saveLayers(layers: Array<Layer<any>>): void;

    /**
     * Load the current plots.
     * @param mappingQueryService Service to load the plot data.
     * @returns An array of plots.
     */
    loadPlots(mappingQueryService: MappingQueryService,
              projectService: ProjectService): Array<Plot>;

    /**
     * Save the current plots.
     * @param plots An array of plots.
     */
    savePlots(plots: Array<Plot>): void;

    /**
     * Load layout settings.
     */
    loadLayoutSettings(): LayoutDict;

    /**
     * Save layout settings.
     * @param dict a serializable layout dictionary.
     */
    saveLayoutSettings(dict: LayoutDict): void;

}
