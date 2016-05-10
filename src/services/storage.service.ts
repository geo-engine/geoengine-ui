import {Injectable} from "angular2/core";
import {BehaviorSubject, Observable} from "rxjs/Rx";

import {LayerService} from "./layer.service";
import {ProjectService} from "./project.service";
import {PlotService} from "./plot.service";
import {MappingQueryService} from "./mapping-query.service";

import Config from "../models/config.model";
import {Layer, LayerDict} from "../models/layer.model";
import {Project} from "../models/project.model";
import {Plot, PlotDict} from "../models/plot.model";
import {Operator} from "../models/operator.model";
import {ResultTypes} from "../models/result-type.model";
import {DataType, DataTypes} from "../models/datatype.model";
import {Projections} from "../models/projection.model";
import {Unit, Interpolation} from "../models/unit.model";
import {Symbology, SimplePointSymbology, SimpleVectorSymbology, RasterSymbology, ISymbology}
    from "../models/symbology.model";
import {RasterSourceType, GFBioPointSourceType, GFBioGeometrySourceType}
    from "../models/operator-type.model";

/**
 * This service allows persisting the current execution context.
 */
@Injectable()
export class StorageService {
    private storageProvider: StorageProvider;
    private defaults: StorageDefaults;

    constructor(private layerService: LayerService,
                private projectService: ProjectService,
                private plotService: PlotService,
                private mappingQueryService: MappingQueryService) {
        this.storageProvider = new BrowserStorageProvider();

        if (Config.DEBUG_MODE) {
            this.defaults = new DeveloperDefaults();
        } else {
            this.defaults = new StorageDefaults();
        }

        this.loadProject();
        this.loadLayers();
        this.loadPlots();
        this.storeProjectSetup();
        this.storeLayersSetup();
        this.storePlotsSetup();
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

    private loadPlots() {
        // plots
        let plots = this.storageProvider.loadPlots(this.mappingQueryService, this.projectService);

        if (plots === undefined) {
            // load default
            plots = this.defaults.getPlots();
        }

        this.plotService.setPlots(plots);

        // plot list visibility
        let plotListVisibility = this.storageProvider.loadPlotListVisibility();

        if (plotListVisibility === undefined) {
            // load default
            plotListVisibility = this.defaults.getPlotListVisibility();
        }

        this.plotService.setPlotListVisibility(plotListVisibility);
    }

    private storePlotsSetup() {
        // plots
        this.plotService.getPlotsStream().subscribe(this.storageProvider.savePlots);

        // plot list visibility
        this.plotService.getPlotListVisibleStream().subscribe(
            this.storageProvider.savePlotListVisibility
        );
    }

    private loadProject() {
        const project = this.storageProvider.loadProject();
        if (project === undefined) {
            // use default project
        } else {
            this.projectService.setProject(project);
        }
    }

    private storeProjectSetup() {
        this.projectService.getProjectStream().subscribe(this.storageProvider.saveProject);
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
     * @param layers An array of layers.
     */
    saveLayers(layers: Array<Layer>): void;

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
     * Load the current plot list visibility.
     * @returns The visibility.
     */
    loadPlotListVisibility(): boolean;

    /**
     * Save the current plot list visiblity.
     * @param visible The visibility.
     */
    savePlotListVisibility(visible: boolean): void;

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
        const projectJSON = localStorage.getItem("project");
        if (projectJSON === null) {
            return undefined;
        } else {
            const project = Project.fromJSON(projectJSON);
            return project;
        }
    }

    saveProject(project: Project) {
        localStorage.setItem("project", project.toJSON());
    }

    loadLayers(): Array<Layer> {
        const layersJSON = localStorage.getItem("layers");
        if (layersJSON === null) {
            return undefined;
        } else {
            const layers: Array<Layer> = [];
            const layerDicts: Array<LayerDict> = JSON.parse(layersJSON);

            for (const layerDict of layerDicts) {
                layers.push(Layer.fromDict(layerDict));
            }

            return layers;
        }
    }

    saveLayers(layers: Array<Layer>) {
        const layerDicts: Array<LayerDict> = [];

        for (const layer of layers) {
            layerDicts.push(layer.toDict());
        }

        localStorage.setItem("layers", JSON.stringify(layerDicts));
    }

    loadPlots(mappingQueryService: MappingQueryService,
              projectService: ProjectService): Array<Plot> {
        const plotsJSON = localStorage.getItem("plots");
        if (plotsJSON === null) {
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

        localStorage.setItem("plots", JSON.stringify(plotDicts));
    }

    loadLayerListVisible(): boolean {
        const layerListVisible = localStorage.getItem("layerListVisible");
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
        const dataTableVisible = localStorage.getItem("dataTableVisible");
        if (dataTableVisible === null) {
            return undefined;
        } else {
            return JSON.parse(dataTableVisible);
        }
    }

    saveDataTableVisible(visible: boolean) {
        localStorage.setItem("dataTableVisible", JSON.stringify(visible));
    }

    loadPlotListVisibility(): boolean {
        const plotListVisible = localStorage.getItem("plotListVisibility");
        if (plotListVisible === null) {
            return undefined;
        } else {
            return JSON.parse(plotListVisible);
        }
    }

    savePlotListVisibility(visible: boolean) {
        localStorage.setItem("plotListVisibility", JSON.stringify(visible));
    }

    loadTabIndex(): number {
        const tabIndex = localStorage.getItem("tabIndex");
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
    getPlots(): Array<Plot> {
        return [];
    }
    getLayerListVisible(): boolean {
        return true;
    }
    getDataTableVisible(): boolean {
        return true;
    }
    getPlotListVisibility(): boolean {
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
                name: "IUCN Puma Concolor",
                symbology: new SimpleVectorSymbology({}),
                operator: new Operator({
                    operatorType: new GFBioGeometrySourceType({
                        datasource: "IUCN",
                        query: `{"globalAttributes":{"speciesName":"Puma concolor"},"localAttributes":{}}`,
                    }),
                    resultType: ResultTypes.POLYGONS,
                    projection: Projections.WGS_84,
                    attributes: [],
                    dataTypes: new Map<string, DataType>(),
                    units: new Map<string, Unit>()
                })
            }),
            new Layer({
                name: "Puma Concolor",
                symbology: new SimplePointSymbology({}),
                operator: new Operator({
                    operatorType: new GFBioPointSourceType({
                        datasource: "GBIF",
                        query: `{"globalAttributes":{"speciesName":"Puma concolor"},"localAttributes":{}}`,
                    }),
                    resultType: ResultTypes.POINTS,
                    projection: Projections.WGS_84,
                    attributes: [],
                    dataTypes: new Map<string, DataType>(),
                    units: new Map<string, Unit>()
                })
            }),
            new Layer({
                name: "SRTM",
                symbology: new RasterSymbology({}),
                operator: new Operator({
                    operatorType: new RasterSourceType({
                        channel: 0,
                        sourcename: "srtm",
                        transform: true,
                    }),
                    resultType: ResultTypes.RASTER,
                    projection: Projections.WGS_84,
                    attributes: ["value"],
                    dataTypes: new Map<string, DataType>().set("value", DataTypes.Int16),
                    units: new Map<string, Unit>().set("value", new Unit({
                        measurement: "elevation",
                        unit: "m",
                        interpolation: Interpolation.Continuous
                    }))
                })
            }),
        ];
    }
}
