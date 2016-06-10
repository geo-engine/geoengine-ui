import {LayoutDict} from '../app/layout.service';
import {Layer} from '../layers/layer.model';
import {Project} from '../project/project.model';
import {Plot} from '../plots/plot.model';
import {Symbology} from '../symbology/symbology.model';

import {LayerService} from '../layers/layer.service';
import {PlotService} from '../plots/plot.service';

/**
 * Storage Provider that allows saving and retrieval of WAVE settings and items.
 */
export abstract class StorageProvider {
    constructor(
        protected layerService: LayerService,
        protected plotService: PlotService
    ) {}

    /**
     * Load the current project.
     * @returns A project instance.
     */
    abstract loadProject(): Promise<Project>;

    /**
     * Save the current project.
     * @param project A project instance.
     */
    abstract saveProject(project: Project): Promise<void>;

    /**
     * Load the current layers.
     * @returns An array of layers.
     */
    abstract loadLayers(): Promise<Array<Layer<Symbology>>>;

    /**
     * Save the current layers.
     * @param layers An array of layers.
     */
    abstract saveLayers(layers: Array<Layer<Symbology>>): Promise<void>;

    /**
     * Load the current plots.
     * @param mappingQueryService Service to load the plot data.
     * @returns An array of plots.
     */
    abstract loadPlots(): Promise<Array<Plot>>;

    /**
     * Save the current plots.
     * @param plots An array of plots.
     */
    abstract savePlots(plots: Array<Plot>): Promise<void>;

    /**
     * Load layout settings.
     */
    abstract loadLayoutSettings(): Promise<LayoutDict>;

    /**
     * Save layout settings.
     * @param dict a serializable layout dictionary.
     */
    abstract saveLayoutSettings(dict: LayoutDict): Promise<void>;

}
