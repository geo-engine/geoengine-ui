import {Injectable} from "angular2/core";
import {BehaviorSubject, Observable} from "rxjs/Rx";

import {LayerService} from "./layer.service";
import {ProjectService} from "./project.service";

import {Layer} from "../models/layer.model";
import {Project} from "../models/project.model";
import {Operator, ResultType} from "../models/operator.model";

interface LayerSerialization {
  operator: string;
  expanded: boolean;
}

@Injectable()
export class StorageService {
  constructor(private layerService: LayerService, private projectService: ProjectService) {
    this.loadProject();
    this.loadLayers();
    this.storeProjectSetup();
    this.storeLayersSetup();
  }

  private loadLayers() {
    let layersJSON = localStorage.getItem("layers");
    if (layersJSON === null) {
      // default
      this.layerService.setLayers([
          new Layer(new Operator(
              "source",
              ResultType.RASTER,
              new Map<string, string | number>().set("channel", 0)
                                                .set("sourcename", "srtm"),
              "EPSG:4326",
              "SRTM"
          )),
          new Layer(new Operator(
              "gfbiopointsource",
              ResultType.POINTS,
              new Map<string, string | number>()
                  .set("datasource", "GBIF")
                  .set("query", `{"globalAttributes":{"speciesName":"Puma concolor"},"localAttributes":{}}`),
              "EPSG:4326",
              "Puma Concolor"
          ))
      ]);

    } else {
      // load
      let layers: Array<Layer> = [];
      let layerDicts: Array<LayerSerialization> = JSON.parse(layersJSON);

      for (let layerDict of layerDicts) {
        let layer = new Layer(Operator.fromJSON(layerDict.operator));
        layer.expanded = layerDict.expanded;

        layers.push(layer);
      }

      // console.log(layers);

      this.layerService.setLayers(layers);
    }
  }

  private storeLayersSetup() {
    this.layerService.getLayers().subscribe((layers: Array<Layer>) => {
      let layerStrings: Array<LayerSerialization> = [];

      for (let layer of layers) {
        layerStrings.push({
          operator: layer.operator.toJSON(),
          expanded: layer.expanded
        });
      }

      // console.log("store", "layers", layerStrings);
      localStorage.setItem("layers", JSON.stringify(layerStrings));
    });
  }

  private loadProject() {
      let projectJSON = localStorage.getItem("project");
      if (projectJSON === null) {
          // use default project
      } else {
          let project = Project.fromJSON(projectJSON);
          this.projectService.setProject(project);
      }
  }

  private storeProjectSetup() {
    this.projectService.getProject().subscribe((project: Project) => {
        localStorage.setItem("project", project.toJSON());
    });
  }

  addLayerListVisibleObservable(layerListVisible$: Observable<boolean>) {
    layerListVisible$.subscribe(visible => {
      localStorage.setItem("layerListVisible", JSON.stringify(visible));
      // console.log("store", "layerListVisible$", visible);
    });
  }

  getLayerListVisible(): boolean {
    let layerListVisible = localStorage.getItem("layerListVisible");
    // console.log("load", "layerListVisible$", layerListVisible);
    if (layerListVisible === null) {
      // default
      return true;
    } else {
      // load and parse
      return JSON.parse(layerListVisible);
    }
  }

  addDataTableVisibleObservable(dataTableVisible$: Observable<boolean>) {
    dataTableVisible$.subscribe(visible => {
      localStorage.setItem("dataTableVisible", JSON.stringify(visible));
    });
  }

  getDataTableVisible(): boolean {
    let dataTableVisible = localStorage.getItem("dataTableVisible");
    if (dataTableVisible === null) {
      // default
      return true;
    } else {
      // load and parse
      return JSON.parse(dataTableVisible);
    }
  }

  addTabIndexObservable(tabIndex$: Observable<number>) {
    tabIndex$.subscribe(index => {
        // console.log("tindex", index);
        localStorage.setItem("tabIndex", JSON.stringify(index));
    });
  }

  getTabIndex(): number {
    let tabIndex = localStorage.getItem("tabIndex");
    // console.log("tindex", tabIndex);
    if (tabIndex === null) {
      // default
      return 0;
    } else {
      // load and parse
      return JSON.parse(tabIndex);
    }
  }
}
