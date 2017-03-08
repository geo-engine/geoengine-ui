import {
    StorageProvider, Workspace, RScript, RScriptDict,
} from '../storage-provider.model';

import {LayoutDict} from '../../app/layout.service';
import {Layer, LayerDict} from '../../layers/layer.model';
import {Project} from '../../app/project/project.model';
import {Symbology} from '../../symbology/symbology.model';
import {Operator} from '../../app/operators/operator.model';
import {ResultTypes} from '../../app/operators/result-type.model';

/**
 * StorageProvider implementation that uses the brower's localStorage
 */
export class BrowserStorageProvider extends StorageProvider {

    loadWorkspace(): Promise<Workspace> {
        const operatorMap = new Map<number, Operator>();

        const promises: [
            Promise<Project>,
            Promise<Array<Layer<Symbology>>>
        ] = [
            this.loadProject(operatorMap),
            this.loadLayers(operatorMap),
        ];
        return Promise.all(
            promises
        ).then(([project, layers]: [Project, Array<Layer<Symbology>>]) => {
            return {
                project: project,
                layers: layers,
            };
        });
    };

    saveWorkspace(workspace: Workspace): Promise<void> {
        return Promise.all([
            this.saveProject(workspace.project),
            this.saveLayers(workspace.layers),
        ]).then(
            _ => undefined
        );
    }

    loadProject(operatorMap: Map<number, Operator>): Promise<Project> {
        const projectJSON = localStorage.getItem('project');
        if (projectJSON === null) { // tslint:disable-line:no-null-keyword
            return Promise.resolve(undefined);
        } else {
            const project = Project.fromJSON(projectJSON, operatorMap);
            return Promise.resolve(project);
        }
    }

    saveProject(project: Project): Promise<void> {
        localStorage.setItem('project', project.toJSON());
        return Promise.resolve();
    }

    loadLayers(operatorMap: Map<number, Operator>): Promise<Array<Layer<Symbology>>> {
        const layersJSON = localStorage.getItem('layers');
        if (layersJSON === null) { // tslint:disable-line:no-null-keyword
            return Promise.resolve(undefined);
        } else {
            const layers: Array<Layer<Symbology>> = [];
            const layerDicts: Array<LayerDict> = JSON.parse(layersJSON);

            for (const layerDict of layerDicts) {
                layers.push(
                    this.layerService.createLayerFromDict(layerDict, operatorMap)
                );
            }

            return Promise.resolve(layers);
        }
    }

    saveLayers(layers: Array<Layer<Symbology>>): Promise<void> {
        const layerDicts: Array<LayerDict> = [];

        for (const layer of layers) {
            layerDicts.push(layer.toDict());
        }

        localStorage.setItem('layers', JSON.stringify(layerDicts));
        return Promise.resolve();
    }

    loadLayoutSettings(): Promise<LayoutDict> {
        const layoutSettings = localStorage.getItem('layoutSettings');
        if (layoutSettings === null) { // tslint:disable-line:no-null-keyword
            return Promise.resolve(undefined);
        } else {
            return Promise.resolve(JSON.parse(layoutSettings));
        }
    };

    saveLayoutSettings(dict: LayoutDict): Promise<void> {
        localStorage.setItem('layoutSettings', JSON.stringify(dict));
        return Promise.resolve();
    };

    projectExists(name: string): Promise<boolean> {
        return Promise.resolve(false);
    }

    getProjects(): Promise<Array<string>> {
        return Promise.resolve([]);
    }

    saveRScript(name: string, script: RScript): Promise<void> {
        const itemName = 'r_scripts';
        const scriptDict: RScriptDict = {
            code: script.code,
            resultType: script.resultType.getCode(),
        };
        const scriptString = localStorage.getItem(itemName);
        const scripts: {
            [index: string]: RScriptDict
        } = scriptString ? JSON.parse(scriptString) : {};
        scripts[name] = scriptDict;
        localStorage.setItem(itemName, JSON.stringify(scripts));

        return Promise.resolve();
    }

    loadRScript(name: string): Promise<RScript> {
        const scripts: {
            [index: string]: RScriptDict
        } = JSON.parse(localStorage.getItem('r_scripts'));
        return Promise.resolve({
            code: scripts[name].code,
            resultType: ResultTypes.fromCode(scripts[name].resultType),
        });
    };

    getRScripts(): Promise<Array<string>> {
        const scripts: {
            [index: string]: RScriptDict
        } = JSON.parse(localStorage.getItem('r_scripts'));
        return Promise.resolve(Object.keys(scripts));
    };

}
