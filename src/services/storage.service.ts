import {Injectable} from "angular2/core";
import {BehaviorSubject, Observable} from "rxjs/Rx";

import {LayerService} from "./layer.service";
import {ProjectService} from "./project.service";

import Config from "../config.model";
import {Layer, LayerDict} from "../models/layer.model";
import {Project} from "../models/project.model";
import {Operator, ResultType} from "../models/operator.model";
import {DataType, DataTypes} from "../models/datatype.model";
import {Projections} from "../models/projection.model";
import {Unit, Interpolation} from "../models/unit.model";
import {Symbology, SimplePointSymbology, RasterSymbology, ISymbology} from "../models/symbology.model";

/**
 * This service allows persisting the current execution context.
 */
@Injectable()
export class StorageService {
    private storageProvider: StorageProvider;
    private defaults: StorageDefaults;

    constructor(private layerService: LayerService, private projectService: ProjectService) {
        this.storageProvider = new BrowserStorageProvider();

        if (Config.DEBUG_MODE) {
            this.defaults = new DeveloperDefaults();
        } else {
            this.defaults = new StorageDefaults();
        }

        this.loadProject();
        this.loadLayers();
        this.storeProjectSetup();
        this.storeLayersSetup();
    }

    private loadLayers() {
        let layers = this.storageProvider.loadLayers();

        if (layers === undefined) {
            // load default
            layers = this.defaults.getLayers();
        }

        this.layerService.setLayers(layers);
    }

    private storeLayersSetup() {
        this.layerService.getLayersStream().subscribe(this.storageProvider.saveLayers);
    }

    private loadProject() {
        let project = this.storageProvider.loadProject();
        if (project === undefined) {
            // use default project
        } else {
            this.projectService.setProject(project);
        }
    }

    private storeProjectSetup() {
        this.projectService.getProject().subscribe(this.storageProvider.saveProject);
    }

    addLayerListVisibleObservable(layerListVisible$: Observable<boolean>) {
        layerListVisible$.subscribe(this.storageProvider.saveLayerListVisible);
    }

    getLayerListVisible(): boolean {
        let layerListVisible = this.storageProvider.loadLayerListVisible();
        if (layerListVisible === undefined) {
            // default
            layerListVisible = this.defaults.getLayerListVisible();
        }

        return layerListVisible;
    }

    addDataTableVisibleObservable(dataTableVisible$: Observable<boolean>) {
        dataTableVisible$.subscribe(this.storageProvider.saveDataTableVisible);
    }

    getDataTableVisible(): boolean {
        let dataTableVisible = this.storageProvider.loadDataTableVisible();
        if (dataTableVisible === undefined) {
            // default
            dataTableVisible = this.defaults.getDataTableVisible();
        }

        return dataTableVisible;
    }

    addTabIndexObservable(tabIndex$: Observable<number>) {
        tabIndex$.subscribe(this.storageProvider.saveTabIndex);
    }

    getTabIndex(): number {
        let tabIndex = this.storageProvider.loadTabIndex();
        if (tabIndex === undefined) {
            // default
            tabIndex = this.defaults.getTabIndex();
        }

        return tabIndex;
    }
}

/**
 * Storage Provider that allows saving and retrieval of WAVE settings and items.
 */
interface StorageProvider {

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
    loadLayers(): Array<Layer>;

    /**
     * Save the current layers.
     * @param layers An array if layers.
     */
    saveLayers(layers: Array<Layer>): void;

    /**
     * Load the current layer list visibility.
     * @returns The visibility.
     */
    loadLayerListVisible(): boolean;

    /**
     * Save the current layer list visiblity.
     * @param visible The visibility.
     */
    saveLayerListVisible(visible: boolean): void;

    /**
     * Load the current data table visibility.
     * @returns The visibility.
     */
    loadDataTableVisible(): boolean;

    /**
     * Save the current data table visiblity.
     * @param visible The visibility.
     */
    saveDataTableVisible(visible: boolean): void;

    /**
     * Load the current tab index of the tob component.
     * @returns The tab index.
     */
    loadTabIndex(): number;

    /**
     * Save the current tab index of the tab component.
     * @param tabIndex The tab index.
     */
    saveTabIndex(tabIndex: number): void;
}

/**
 * StorageProvider implementation that uses the brower's localStorage
 */
class BrowserStorageProvider implements StorageProvider {
    loadProject(): Project {
        let projectJSON = localStorage.getItem("project");
        if (projectJSON === null) {
            return undefined;
        } else {
            let project = Project.fromJSON(projectJSON);
            return project;
        }
    }

    saveProject(project: Project) {
        localStorage.setItem("project", project.toJSON());
    }

    loadLayers(): Array<Layer> {
        let layersJSON = localStorage.getItem("layers");
        if (layersJSON === null) {
            return undefined;
        } else {
            let layers: Array<Layer> = [];
            let layerDicts: Array<LayerDict> = JSON.parse(layersJSON);

            for (let layerDict of layerDicts) {
                layers.push(Layer.fromDict(layerDict));
            }

            return layers;
        }
    }

    saveLayers(layers: Array<Layer>) {
        let layerDicts: Array<LayerDict> = [];

        for (let layer of layers) {
            layerDicts.push(layer.toDict());
        }

        localStorage.setItem("layers", JSON.stringify(layerDicts));
    }

    loadLayerListVisible(): boolean {
        let layerListVisible = localStorage.getItem("layerListVisible");
        if (layerListVisible === null) {
            return undefined;
        } else {
            return JSON.parse(layerListVisible);
        }
    }

    saveLayerListVisible(visible: boolean) {
        localStorage.setItem("layerListVisible", JSON.stringify(visible));
    }

    loadDataTableVisible(): boolean {
        let dataTableVisible = localStorage.getItem("dataTableVisible");
        if (dataTableVisible === null) {
            return undefined;
        } else {
            return JSON.parse(dataTableVisible);
        }
    }

    saveDataTableVisible(visible: boolean) {
        localStorage.setItem("dataTableVisible", JSON.stringify(visible));
    }

    loadTabIndex(): number {
        let tabIndex = localStorage.getItem("tabIndex");
        if (tabIndex === null) {
            return undefined;
        } else {
            return JSON.parse(tabIndex);
        }
    }

    saveTabIndex(tabIndex: number) {
        localStorage.setItem("tabIndex", JSON.stringify(tabIndex));
    }
}

/**
 * Default values when the storage is empty.
 */
class StorageDefaults {
    getLayers(): Array<Layer> {
        return [];
    }
    getLayerListVisible(): boolean {
        return true;
    }
    getDataTableVisible(): boolean {
        return true;
    }
    getTabIndex(): number {
        return 0;
    }
}

/**
 * Default values for debugging the application.
 */
class DeveloperDefaults extends StorageDefaults {
    getLayers(): Array<Layer> {
        return [
            new Layer({
                name: "SRTM",
                symbology: new RasterSymbology({}),
                operator: new Operator({
                    operatorType: "source",
                    resultType: ResultType.RASTER,
                    parameters: new Map<string, string | number>().set("channel", 0)
                                                                  .set("sourcename", "srtm"),
                    projection: Projections.fromEPSGCode("EPSG:4326"),
                    attributes: ["value"],
                    dataTypes: new Map<string, DataType>().set("value", DataTypes.Int16),
                    units: new Map<string, Unit>().set("value", new Unit({
                        measurement: "elevation",
                        unit: "m",
                        interpolation: Interpolation.Continuous
                    }))
                })
            }),
            new Layer({
                name: "Puma Concolor",
                symbology: new SimplePointSymbology({}),
                operator: new Operator({
                    operatorType: "gfbiopointsource",
                    resultType: ResultType.POINTS,
                    parameters: new Map<string, string | number>()
                                    .set("datasource", "GBIF")
                                    .set("query", `{"globalAttributes":{"speciesName":"Puma concolor"},"localAttributes":{}}`),
                    projection: Projections.fromEPSGCode("EPSG:4326"),
                    attributes: [],
                    dataTypes: new Map<string, DataType>(),
                    units: new Map<string, Unit>()
                })
            })
        ];
    }
    getLayerListVisible(): boolean {
        return true;
    }
    getDataTableVisible(): boolean {
        return true;
    }
    getTabIndex(): number {
        return 0;
    }
}
