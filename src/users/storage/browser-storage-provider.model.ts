import {StorageProvider} from './storage-provider.model';

import {LayoutDict} from '../../app/layout.service';
import {Layer, LayerDict} from '../../models/layer.model';
import {Project} from '../../models/project.model';
import {Plot, PlotDict} from '../../plots/plot.model';

import {ProjectService} from '../../services/project.service';
import {MappingQueryService} from '../../services/mapping-query.service';

/**
 * StorageProvider implementation that uses the brower's localStorage
 */
export class BrowserStorageProvider implements StorageProvider {
    loadProject(): Project {
        const projectJSON = localStorage.getItem('project');
        if (projectJSON === null) { // tslint:disable-line:no-null-keyword
            return undefined;
        } else {
            const project = Project.fromJSON(projectJSON);
            return project;
        }
    }

    saveProject(project: Project) {
        localStorage.setItem('project', project.toJSON());
    }

    loadLayers(mappingQueryService: MappingQueryService,
              projectService: ProjectService): Array<Layer<any>> {
        const layersJSON = localStorage.getItem('layers');
        if (layersJSON === null) { // tslint:disable-line:no-null-keyword
            return undefined;
        } else {
            const layers: Array<Layer<any>> = [];
            const layerDicts: Array<LayerDict> = JSON.parse(layersJSON);

            for (const layerDict of layerDicts) {
                layers.push(
                    Layer.fromDict(
                        layerDict,
                        operator => mappingQueryService.getWFSDataStreamAsGeoJsonFeatureCollection(
                            operator,
                            projectService.getTimeStream(),
                            projectService.getMapProjectionStream()
                        )
                    )
                );
            }

            return layers;
        }
    }

    saveLayers(layers: Array<Layer<any>>) {
        const layerDicts: Array<LayerDict> = [];

        for (const layer of layers) {
            layerDicts.push(layer.toDict());
        }

        localStorage.setItem('layers', JSON.stringify(layerDicts));
    }

    loadPlots(mappingQueryService: MappingQueryService,
              projectService: ProjectService): Array<Plot> {
        const plotsJSON = localStorage.getItem('plots');
        if (plotsJSON === null) { // tslint:disable-line:no-null-keyword
            return undefined;
        } else {
            const plots: Array<Plot> = [];
            const plotDicts: Array<PlotDict> = JSON.parse(plotsJSON);

            for (const plotDict of plotDicts) {
                plots.push(
                    Plot.fromDict(
                        plotDict,
                        operator => mappingQueryService.getPlotDataStream(
                            operator, projectService.getTimeStream()
                        )
                    )
                );
            }

            return plots;
        }
    }

    savePlots(plots: Array<Plot>) {
        const plotDicts: Array<PlotDict> = [];

        for (const plot of plots) {
            plotDicts.push(plot.toDict());
        }

        localStorage.setItem('plots', JSON.stringify(plotDicts));
    }

    loadLayoutSettings(): LayoutDict {
        const layoutSettings = localStorage.getItem('layoutSettings');
        if (layoutSettings === null) { // tslint:disable-line:no-null-keyword
            return undefined;
        } else {
            return JSON.parse(layoutSettings);
        }
    };

    saveLayoutSettings(dict: LayoutDict): void {
        localStorage.setItem('layoutSettings', JSON.stringify(dict));
    };

}
