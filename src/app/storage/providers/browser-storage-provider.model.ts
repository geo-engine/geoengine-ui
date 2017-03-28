import {StorageProvider, Workspace, RScript, RScriptDict} from '../storage-provider.model';

import {LayoutDict} from '../../layout.service';
import {Layer, LayerDict} from '../../layers/layer.model';
import {Project} from '../../project/project.model';
import {Symbology} from '../../layers/symbology/symbology.model';
import {Operator} from '../../operators/operator.model';
import {ResultTypes} from '../../operators/result-type.model';
import {Observable} from 'rxjs/Rx';

/**
 * StorageProvider implementation that uses the brower's localStorage
 */
export class BrowserStorageProvider extends StorageProvider {

    loadWorkspace(): Observable<Workspace> {
        const operatorMap = new Map<number, Operator>();

        return Observable.forkJoin(
            this.loadProject(operatorMap),
            this.loadLayers(operatorMap),
            (project, layers) => {
                return {
                    project: project,
                    layers: layers,
                };
            },
        );
    };

    saveWorkspace(workspace: Workspace): Observable<{}> {
        return Observable
            .concat(
                this.saveProject(workspace.project),
                this.saveLayers(workspace.layers),
            )
            .mapTo({});
    }

    loadProject(operatorMap: Map<number, Operator>): Observable<Project> {
        const projectJSON = localStorage.getItem('project');
        if (projectJSON === null) { // tslint:disable-line:no-null-keyword
            return Observable.of(undefined);
        } else {
            const project = Project.fromJSON(projectJSON, operatorMap);
            return Observable.of(project);
        }
    }

    saveProject(project: Project): Observable<void> {
        localStorage.setItem('project', project.toJSON());
        return Observable.of(undefined);
    }

    loadLayers(operatorMap: Map<number, Operator>): Observable<Array<Layer<Symbology>>> {
        const layersJSON = localStorage.getItem('layers');
        if (layersJSON === null) { // tslint:disable-line:no-null-keyword
            return Observable.of(undefined);
        } else {
            const layers: Array<Layer<Symbology>> = [];
            const layerDicts: Array<LayerDict> = JSON.parse(layersJSON);

            for (const layerDict of layerDicts) {
                try {
                    layers.push(
                        this.layerService.createLayerFromDict(layerDict, operatorMap)
                    );
                } catch (error) {
                    // TODO: show reason to user
                    console.error(`Cannot load layer because of ${error}`);
                }
            }

            return Observable.of(layers);
        }
    }

    saveLayers(layers: Array<Layer<Symbology>>): Observable<void> {
        const layerDicts: Array<LayerDict> = [];

        for (const layer of layers) {
            layerDicts.push(layer.toDict());
        }

        localStorage.setItem('layers', JSON.stringify(layerDicts));
        return Observable.of(undefined);
    }

    loadLayoutSettings(): Observable<LayoutDict> {
        const layoutSettings = localStorage.getItem('layoutSettings');
        if (layoutSettings === null) { // tslint:disable-line:no-null-keyword
            return Observable.of(undefined);
        } else {
            return Observable.of(JSON.parse(layoutSettings));
        }
    };

    saveLayoutSettings(dict: LayoutDict): Observable<{}> {
        localStorage.setItem('layoutSettings', JSON.stringify(dict));
        return Observable.of({});
    };

    projectExists(name: string): Observable<boolean> {
        return Observable.of(false);
    }

    getProjects(): Observable<Array<string>> {
        return Observable.of([]);
    }

    saveRScript(name: string, script: RScript): Observable<void> {
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

        return Observable.of(undefined);
    }

    loadRScript(name: string): Observable<RScript> {
        const scripts: {
            [index: string]: RScriptDict
        } = JSON.parse(localStorage.getItem('r_scripts'));
        return Observable.of({
            code: scripts[name].code,
            resultType: ResultTypes.fromCode(scripts[name].resultType),
        });
    };

    getRScripts(): Observable<Array<string>> {
        const scripts: {
            [index: string]: RScriptDict
        } = JSON.parse(localStorage.getItem('r_scripts'));
        return Observable.of(Object.keys(scripts));
    };

}
