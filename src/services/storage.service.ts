import {Injectable} from 'angular2/core';
import {BehaviorSubject, Observable} from 'rxjs/Rx';

import {LayerService} from './layer.service';

import {Layer} from '../layer.model';
import {Operator, ResultType} from '../operator.model';

interface LayerSerialization {
  operator: string,
  expanded: boolean
}

@Injectable()
export class StorageService {
  constructor(private layerService: LayerService) {
    this.loadLayers();
    this.storeLayersSetup();
  }

  private loadLayers() {
    let layersJSON = localStorage.getItem('layers');
    if(layersJSON === null) {
      // default
      this.layerService.setLayers([
          new Layer(new Operator(
              'source',
              ResultType.RASTER,
              new Map<string, string | number>().set('channel', 0)
                                                .set('sourcename', 'srtm'),
              'EPSG:4326',
              'SRTM'
          )),
          new Layer(new Operator(
              'gfbiopointsource',
              ResultType.POINTS,
              new Map<string, string | number>()
                  .set('datasource', 'GBIF')
                  .set('query', '{"globalAttributes":{"speciesName":"Puma concolor"},"localAttributes":{}}'),
              'EPSG:4326',
              'Puma Concolor'
          ))
      ]);

    } else {
      // load
      let layerStrings: Array<LayerSerialization> = JSON.parse(layersJSON);

      // TODO: implement
      console.log(layerStrings);
    }
  }

  private storeLayersSetup() {
    this.layerService.getLayers().subscribe((layers: Array<Layer>) => {
      let layerStrings: Array<LayerSerialization> = [];

      for(let layer of layers) {
        layerStrings.push({
          operator: layer.operator.toJSON(),
          expanded: layer.expanded
        });
      }

      localStorage.setItem('layers', JSON.stringify(layerStrings));
    });
  }

  addLayerListVisibleObservable(layerListVisible$: Observable<boolean>) {
    layerListVisible$.subscribe(visible => {
      localStorage.setItem('layerListVisible', JSON.stringify(visible));
      // console.log('store', 'layerListVisible$', visible);
    });
  }

  getLayerListVisible(): boolean {
    let layerListVisible = localStorage.getItem('layerListVisible');
    // console.log('load', 'layerListVisible$', layerListVisible);
    if(layerListVisible === null) {
      // default
      return true;
    } else {
      // load and parse
      return JSON.parse(layerListVisible);
    }
  }

  addDataTableVisibleObservable(dataTableVisible$: Observable<boolean>) {
    dataTableVisible$.subscribe(visible => {
      localStorage.setItem('dataTableVisible', JSON.stringify(visible));
    });
  }

  getDataTableVisible(): boolean {
    let dataTableVisible = localStorage.getItem('dataTableVisible');
    if(dataTableVisible === null) {
      // default
      return true;
    } else {
      // load and parse
      return JSON.parse(dataTableVisible);
    }
  }
}
