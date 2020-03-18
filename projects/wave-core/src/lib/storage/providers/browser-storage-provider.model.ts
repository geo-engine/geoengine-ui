
import {Observable, of as observableOf, concat as observableConcat} from 'rxjs';

import {mapTo, map} from 'rxjs/operators';
import {StorageProvider, Workspace, RScript, RScriptDict} from '../storage-provider.model';

import {LayoutDict} from '../../layout.service';
import {Project} from '../../project/project.model';
import {Operator} from '../../operators/operator.model';
import {ResultTypes} from '../../operators/result-type.model';

const PATH_PREFIX = window.location.pathname.replace(/\//g, '_').replace(/-/g, '_');

/**
 * StorageProvider implementation that uses the brower's localStorage
 */
export class BrowserStorageProvider extends StorageProvider {

    loadWorkspace(): Observable<Workspace> {
        const operatorMap = new Map<number, Operator>();

        return this.loadProject(operatorMap).pipe(map(project => {
                return {
                    project: project,
                };
            },
        ));
    };

    saveWorkspace(workspace: Workspace): Observable<{}> {
        return observableConcat(
                this.saveProject(workspace.project),
            ).pipe(
            mapTo({}));
    }

    loadProject(operatorMap: Map<number, Operator>): Observable<Project> {
        const projectJSON = localStorage.getItem(PATH_PREFIX + 'project');
        if (projectJSON === null) { // tslint:disable-line:no-null-keyword
            return observableOf(undefined);
        } else {
            const project = Project.fromJSON({
                json: projectJSON,
                config: this.config,
                notificationService: this.notificationService,
                operatorMap: operatorMap
            });
            return observableOf(project);
        }
    }

    saveProject(project: Project): Observable<void> {
        localStorage.setItem(PATH_PREFIX + 'project', project.toJSON());
        return observableOf(undefined);
    }

    loadLayoutSettings(): Observable<LayoutDict> {
        const layoutSettings = localStorage.getItem(PATH_PREFIX + 'layoutSettings');
        if (layoutSettings === null) { // tslint:disable-line:no-null-keyword
            return observableOf(undefined);
        } else {
            return observableOf(JSON.parse(layoutSettings));
        }
    };

    saveLayoutSettings(dict: LayoutDict): Observable<{}> {
        localStorage.setItem(PATH_PREFIX + 'layoutSettings', JSON.stringify(dict));
        return observableOf({});
    };

    projectExists(name: string): Observable<boolean> {
        return observableOf(false);
    }

    getProjects(): Observable<Array<string>> {
        return observableOf([]);
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

        return observableOf(undefined);
    }

    loadRScript(name: string): Observable<RScript> {
        const scripts: {
            [index: string]: RScriptDict
        } = JSON.parse(localStorage.getItem(PATH_PREFIX + 'r_scripts'));
        return observableOf({
            code: scripts[name].code,
            resultType: ResultTypes.fromCode(scripts[name].resultType),
        });
    };

    getRScripts(): Observable<Array<string>> {
        const scripts: {
            [index: string]: RScriptDict
        } = JSON.parse(localStorage.getItem(PATH_PREFIX + 'r_scripts'));
        return observableOf(Object.keys(scripts));
    };

}
