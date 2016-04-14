import {Injectable} from "angular2/core";
import {BehaviorSubject} from "rxjs/Rx";

import {Layer} from "../models/layer.model";

import {Operator, ResultType} from "../models/operator.model";

@Injectable()
export class LayerService {
    private layers$: BehaviorSubject<Array<Layer>> = new BehaviorSubject([]);
    private selectedLayer$: BehaviorSubject<Layer> = new BehaviorSubject(undefined);

    constructor() {}

    getLayers() {
        return this.layers$;
    }

    getLayersOnce() {
        return this.layers$.getValue();
    }

    setLayers(layers: Array<Layer>) {
        if (layers.indexOf(this.selectedLayer$.getValue()) === -1) {
            this.setSelectedLayer(undefined);
        }

        this.layers$.next(layers);
    }

    addLayer(layer: Layer) {
       let layers = this.layers$.getValue();
       this.setLayers([layer, ...layers]);
    }

    removeLayer(layer: Layer) {
        let layers = this.layers$.getValue();
        let index = layers.indexOf(layer);

        if (index >= 0) {
            layers.splice(index, 1);
            this.setLayers(layers);
        }
    }

    changeLayerName(layer: Layer, newName: string) {
      layer.operator.name = newName;
      this.layers$.next(this.getLayersOnce());
    }

    setSelectedLayer(layer: Layer) {
        if (layer !== this.selectedLayer$.value) {
            this.selectedLayer$.next(layer);
        }
    }

    getSelectedLayer() {
        return this.selectedLayer$.asObservable();
    }

    getSelectedLayerOnce() {
        return this.selectedLayer$.getValue();
    }
}
