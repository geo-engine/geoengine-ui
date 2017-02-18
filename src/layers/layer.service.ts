import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs/Rx';

import {Set as ImmutableSet} from 'immutable';

import {MappingQueryService} from '../queries/mapping-query.service';

import {Layer, LayerDict, RasterLayer, VectorLayer} from './layer.model';
import {Operator} from '../app/operators/operator.model';
import {FeatureID} from '../models/geojson.model';
import {Symbology} from '../symbology/symbology.model';
import {NotificationService} from '../app/notification.service';

export interface SelectedFeatures {
    selected: ImmutableSet<FeatureID>;
    add?: ImmutableSet<FeatureID>;
    remove?: ImmutableSet<FeatureID>;
    focus?: FeatureID;
}

/**
 * A service that is responsible for managing the active layer array.
 */
@Injectable()
export class LayerService {
    private layers$: BehaviorSubject<Array<Layer<Symbology>>> = new BehaviorSubject([]);
    private selectedLayer$: BehaviorSubject<Layer<Symbology>> = new BehaviorSubject(undefined);
    private selectedFeatures$: BehaviorSubject<SelectedFeatures> = new BehaviorSubject({
        selected: ImmutableSet<FeatureID>(),
    });
    private isAnyLayerSelected$: Observable<boolean>;

    constructor(
        private mappingQueryService: MappingQueryService,
        private notificationService: NotificationService
    ) {
        this.isAnyLayerSelected$ = this.getSelectedLayerStream().map(layer => layer !== undefined);
    }

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

       this.notificationService.info('Added New Layer ' + layer.name);
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

        this.notificationService.info('Removed Layer ' + layer.name);
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
     * Toggle the layer (extension).
     * @param layer The layer to modify
     */
    toggleLayer(layer: Layer<Symbology>) {
        layer.expanded = !layer.expanded;
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
            this.selectedFeatures$.next({
                selected: ImmutableSet<FeatureID>(),
            });
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
     * @returns a stream indicating if any layer is selected.
     */
    getIsAnyLayerSelectedStream(): Observable<boolean> {
        return this.isAnyLayerSelected$;
    }

    /**
     * Create the suitable layer type and initialize the callbacks.
     */
    createLayerFromDict(
        dict: LayerDict,
        operatorMap = new Map<number, Operator>()
    ): Layer<Symbology> {
        switch (dict.type) {
            case 'raster':
                return RasterLayer.fromDict(
                    dict,
                    operator => this.mappingQueryService.getColorizerStream(operator),
                    operator => this.mappingQueryService.getProvenanceStream(operator),
                    operatorMap
                );
            case 'vector':
                return VectorLayer.fromDict(
                    dict,
                    (operator, clustered) =>
                        this.mappingQueryService.getWFSDataStreamAsGeoJsonFeatureCollection({
                            operator, clustered,
                        }),
                    operator => this.mappingQueryService.getProvenanceStream(operator),
                    operatorMap
                );
            default:
                throw 'LayerService.createLayerFromDict: Unknown LayerType ->' + dict;
        }
    }

    /**
     * @returns The currently selected features as stream.
     */
    getSelectedFeaturesStream() {
        return this.selectedFeatures$.asObservable();
    }

    /**
     * @returns The currently selected features.
     */
    getSelectedFeatures(): SelectedFeatures {
        return this.selectedFeatures$.value;
    }

    updateSelectedFeatures(add: Array<FeatureID>, remove: Array<FeatureID>): void {
        const currentSelected = this.selectedFeatures$.value.selected;
        const actualRemove = ImmutableSet(remove).intersect(currentSelected);
        const actualSelected = currentSelected.subtract(remove);
        const actualAdd = ImmutableSet(add).subtract(actualSelected);
        if (actualAdd.size > 0 || actualRemove.size > 0) {
            let next: SelectedFeatures = {
                selected: actualSelected.union(actualAdd),
                add: actualAdd,
                remove: actualRemove,
            };
            if (actualAdd.size > 0) {
                next.focus = add[add.length - 1];
            }
            this.selectedFeatures$.next(next);
            //console.log('featureIds next', this.selectedFeatures$.value);
        }
    }

}
