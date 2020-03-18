
import {map} from 'rxjs/operators';
import {BehaviorSubject, Observable} from 'rxjs';

import {Injectable} from '@angular/core';

import {Set as ImmutableSet} from 'immutable';


import {Layer} from './layer.model';
import {FeatureID} from '../queries/geojson.model';
import {AbstractSymbology} from './symbology/symbology.model';

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
    private selectedLayer$: BehaviorSubject<Layer<AbstractSymbology>> = new BehaviorSubject(undefined);
    private selectedFeatures$: BehaviorSubject<SelectedFeatures> = new BehaviorSubject({
        selected: ImmutableSet<FeatureID>(),
    });
    private isAnyLayerSelected$: Observable<boolean>;

    constructor() {
        this.isAnyLayerSelected$ = this.getSelectedLayerStream().pipe(map(layer => layer !== undefined));
    }


    /**
     * Set a new selected layer.
     * Does nothing if the layer is not within the list.
     * @param layer The layer to select.
     */
    setSelectedLayer(layer: Layer<AbstractSymbology>) {
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
    getSelectedLayerStream(): Observable<Layer<AbstractSymbology>> {
        return this.selectedLayer$.asObservable();
    }

    /**
     * @returns The currently selected layer.
     */
    getSelectedLayer(): Layer<AbstractSymbology> {
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
    /*
    createLayerFromDict(
        dict: LayerDict,
        operatorMap = new Map<number, Operator>()
    ): Layer<AbstractSymbology> {
        switch (dict.type) {
            case 'raster':
                return RasterLayer.fromDict(
                    dict,
                    //operator => this.mappingQueryService.getColorizerStream(operator),
                    //operator => this.mappingQueryService.getProvenanceStream(operator),
                    operatorMap
                );
            case 'vector':
                return VectorLayer.fromDict(
                    dict,
                    // (operator, clustered) =>
                    //     this.mappingQueryService.getWFSDataStreamAsGeoJsonFeatureCollection({
                    //         operator, clustered,
                    //     }),
                    // operator => this.mappingQueryService.getProvenanceStream(operator),
                    operatorMap
                );
            default:
                throw 'LayerService.createLayerFromDict: Unknown LayerType ->' + dict;
        }
    }
    */

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
        const actualSelected = currentSelected.subtract(actualRemove);
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

            // console.log('featureIds next', next);
            this.selectedFeatures$.next(next);
        }
    }

    setSelectedFeatures(selection: Array<FeatureID>): void {
        const currentSelected = this.selectedFeatures$.value.selected;
        const newSelected = ImmutableSet(selection);
        if (newSelected.size > 0) {
            let next: SelectedFeatures = {
                selected: newSelected,
                add: newSelected,
                remove: currentSelected,
            };
            if (newSelected.size > 0) {
                next.focus = selection[selection.length - 1];
            }
            this.selectedFeatures$.next(next);
        }
    }

}
