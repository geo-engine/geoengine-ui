import {Observable} from 'rxjs/Rx';

import {Operator, OperatorDict} from '../operators/operator.model';
import Config from './config.model';
import {Symbology, SymbologyDict, AbstractVectorSymbology, RasterSymbology, MappingColorizer}
    from '../symbology/symbology.model';
import {GeoJsonFeatureCollection} from './geojson.model';

interface Parameters {
    [key: string]: any;
}

interface LayerConfig<S extends Symbology> {
    name: string;
    operator: Operator;
    symbology: S;
}

interface VectorLayerConfig<S extends AbstractVectorSymbology> extends LayerConfig<S> {
    data$: Observable<GeoJsonFeatureCollection>;
}

interface RasterLayerConfig<S extends RasterSymbology> extends LayerConfig<S> {

}

type LayerType = 'raster' | 'vector';

/**
 * Dictionary for serialization.
 */
export interface LayerDict {
    name: string;
    operator: OperatorDict;
    expanded: boolean;
    symbology: SymbologyDict;
    type: LayerType;
}

export abstract class Layer<S extends Symbology> {
    name: string;
    expanded: boolean = false;
    symbology: S;
    private _operator: Operator;

    constructor(config: LayerConfig<S>) {
        this.name = config.name;
        this._operator = config.operator;
        this.symbology = config.symbology;
    }

    static fromDict(dict: LayerDict, dataCallback:
        (operator: Operator) => Observable<GeoJsonFeatureCollection>,
        symbologyCallback: (operator: Operator) => Observable<MappingColorizer>): Layer<Symbology> {

        const operator = Operator.fromDict(dict.operator);
        let layer: Layer<Symbology>;
        switch (dict.type) {
            case('raster'):
                layer = new RasterLayer({
                    name: dict.name,
                    operator: operator,
                    symbology: Symbology.fromDict(dict.symbology, symbologyCallback(operator)) as RasterSymbology,
                });
                break;
            case ('vector'):
                layer = new VectorLayer({
                    name: dict.name,
                    operator: operator,
                    symbology: Symbology.fromDict(dict.symbology) as AbstractVectorSymbology,
                    data$: dataCallback(operator),
                });
                break;
            default :
                throw new TypeError('Layer.fromDict: Unknown LayerType -> ' + dict.type);
        }

        layer.expanded = dict.expanded;
        return layer;
    }

    get url() {
        return Config.MAPPING_URL;
    }

    get operator() {
      return this._operator;
    }

    protected abstract get layerType(): LayerType;

    toDict(): LayerDict {
        return {
            name: this.name,
            operator: this._operator.toDict(),
            expanded: this.expanded,
            symbology: this.symbology.toDict(),
            type: this.layerType,
        };
    }
}

export class VectorLayer<S extends AbstractVectorSymbology> extends Layer<S> {
    private _data$: Observable<GeoJsonFeatureCollection>;

    constructor(config: VectorLayerConfig<S>) {
        super(config);
        this._data$ = config.data$;
    }

    /**
     * @returns the data observable.
     */
    get data$(): Observable<GeoJsonFeatureCollection> {
        return this._data$;
    }

    public getDataStream(): Observable<GeoJsonFeatureCollection> {
        return this.data$;
    }

    get layerType(): LayerType {
        return 'vector';
    }
}

export class RasterLayer<S extends RasterSymbology> extends Layer<S> {
    constructor(config: RasterLayerConfig<S>) {
        super(config);
    }

    get layerType(): LayerType {
        return 'raster';
    }
}
