import {Injectable} from "angular2/core";
import {BehaviorSubject, Observable} from "rxjs/Rx";

import {Layer} from "../models/layer.model";

import {Operator} from "../models/operator.model";

import {Symbology} from "../models/symbology.model";

/**
 * A service that is responsible for managing the active layer array.
 */
@Injectable()
export class LayerService {
    private layers$: BehaviorSubject<Array<Layer<any>>> = new BehaviorSubject([]);
    private selectedLayer$: BehaviorSubject<Layer<any>> = new BehaviorSubject(undefined);

    constructor() {}

    /**
     * @returns The layer list.
     */
    getLayers(): Array<Layer<any>> {
        return this.layers$.getValue();
    }

    /**
     * @returns The stream of the layer list.
     */
    getLayersStream(): Observable<Array<Layer<any>>> {
        return this.layers$;
    }

    /**
     * Insert a new array of layers. Resets the selected layer.
     * @param layers The layer list.
     */
    setLayers(layers: Array<Layer<any>>) {
        if (layers.indexOf(this.selectedLayer$.getValue()) === -1) {
            this.setSelectedLayer(undefined);
        }

        this.layers$.next(layers);
    }

    /**
     * Adds a layer on top of the layer list.
     * @param layer The new layer.
     */
    addLayer(layer: Layer<any>) {
       let layers = this.layers$.getValue();
       this.setLayers([layer, ...layers]);
    }

    /**
     * Removes a layer from the list.
     * @param layer The layer to remove.
     */
    removeLayer(layer: Layer<any>) {
        let layers = this.layers$.getValue();
        let index = layers.indexOf(layer);

        if (index >= 0) {
            layers.splice(index, 1);
            this.setLayers(layers);
        }
    }

    /**
     * Changes the display name of a layer.
     * @param layer The layer to modify
     * @param newName The new layer name
     */
    changeLayerName(layer: Layer<any>, newName: string) {
      layer.name = newName;
      this.layers$.next(this.getLayers());
    }


    /**
    * Changes the symbology of a layer.
    * @param layer The layer to modify
    * @param symbology The new symbology
    */
    changeLayerSymbology(layer: Layer<any>, symbology: Symbology) {
        // console.log("changeLayerSymbology", layer, symbology);
        layer.symbology = symbology;
        this.layers$.next(this.getLayers());
    }

    /**
     * Set a new selected layer.
     * Does nothing if the layer is not within the list.
     * @param layer The layer to select.
     */
    setSelectedLayer(layer: Layer<any>) {
        if (layer !== this.selectedLayer$.value) {
            this.selectedLayer$.next(layer);
        }
    }

    /**
     * @returns The currently selected layer as stream.
     */
    getSelectedLayerStream() {
        return this.selectedLayer$.asObservable();
    }

    /**
     * @returns The currently selected layer.
     */
    getSelectedLayer() {
        return this.selectedLayer$.getValue();
    }
}
