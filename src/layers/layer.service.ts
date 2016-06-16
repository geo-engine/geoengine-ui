import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs/Rx';

import {MappingQueryService} from '../queries/mapping-query.service';

import {Layer, LayerDict, RasterLayer, VectorLayer} from './layer.model';
import {FeatureID} from '../models/geojson.model';
import {Symbology} from '../symbology/symbology.model';

/**
 * A service that is responsible for managing the active layer array.
 */
@Injectable()
export class LayerService {
    private layers$: BehaviorSubject<Array<Layer<Symbology>>> = new BehaviorSubject([]);
    private selectedLayer$: BehaviorSubject<Layer<Symbology>> = new BehaviorSubject(undefined);
    private selectedFeatures$: BehaviorSubject<Array<FeatureID>> = new BehaviorSubject([]);

    constructor(
        private mappingQueryService: MappingQueryService
    ) {}

    /**
     * @returns The layer list.
     */
    getLayers(): Array<Layer<Symbology>> {
        return this.layers$.getValue();
    }

    /**
     * @returns The stream of the layer list.
     */
    getLayersStream(): Observable<Array<Layer<Symbology>>> {
        return this.layers$;
    }

    /**
     * Insert a new array of layers. Resets the selected layer.
     * @param layers The layer list.
     */
    setLayers(layers: Array<Layer<Symbology>>) {
        if (layers.indexOf(this.selectedLayer$.getValue()) === -1) {
            this.setSelectedLayer(undefined);
        }

        this.layers$.next(layers);
    }

    /**
     * Adds a layer on top of the layer list.
     * @param layer The new layer.
     */
    addLayer(layer: Layer<Symbology>) {
       let layers = this.layers$.getValue();
       this.setLayers([layer, ...layers]);
    }

    /**
     * Removes a layer from the list.
     * @param layer The layer to remove.
     */
    removeLayer(layer: Layer<Symbology>) {
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
    changeLayerName(layer: Layer<Symbology>, newName: string) {
      layer.name = newName;
      this.layers$.next(this.getLayers());
    }

    /**
     * Changes the symbology of a layer.
     * @param layer The layer to modify
     * @param symbology The new symbology
     */
    changeLayerSymbology(layer: Layer<Symbology>, symbology: Symbology) {
        // console.log('changeLayerSymbology', layer, symbology);
        layer.symbology = symbology;
        this.layers$.next(this.getLayers());
    }

    /**
     * Set a new selected layer.
     * Does nothing if the layer is not within the list.
     * @param layer The layer to select.
     */
    setSelectedLayer(layer: Layer<Symbology>) {
        if (layer !== this.selectedLayer$.value) {
            this.selectedLayer$.next(layer);
            this.selectedFeatures$.next([]);
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

    /**
     * Create the suitable layer type and initialize the callbacks.
     */
    createLayerFromDict(dict: LayerDict): Layer<Symbology> {
        switch (dict.type) {
            case 'raster':
                return RasterLayer.fromDict(
                    dict,
                    operator => this.mappingQueryService.getColorizerStream(operator),
                    operator => this.mappingQueryService.getProvenanceStream(operator)
                );
            case 'vector':
                return VectorLayer.fromDict(
                    dict,
                    (operator, clustered) =>
                        this.mappingQueryService.getWFSDataStreamAsGeoJsonFeatureCollection({
                            operator, clustered,
                        }),
                    operator => this.mappingQueryService.getProvenanceStream(operator)
                );
            default:
                throw `LayerService.createLayerFromDict: Unknown LayerType -> ${dict.type}.`;
        }
    }

    addFeaturesToSelection(featureIds: Array<FeatureID>): void {
        console.log('add featureIds', featureIds);
        const selected = this.selectedFeatures$.value.slice(0);
        let concat = selected.concat(featureIds); // TODO: dedublicate?
        this.selectedFeatures$.next(concat);
    }

    removeFeaturesFromSelection(featureIds: Array<FeatureID>): void {
        console.log('remove featureIds', featureIds);
        this.selectedFeatures$.next([]);
    }
}
