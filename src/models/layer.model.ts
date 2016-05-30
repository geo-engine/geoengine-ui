import {Observable} from 'rxjs/Rx';

import {Operator, OperatorDict} from '../operators/operator.model';
import Config from './config.model';
import {Symbology, SymbologyDict, AbstractVectorSymbology, RasterSymbology, MappingColorizer}
    from '../symbology/symbology.model';
import {GeoJsonFeatureCollection} from './geojson.model';
import {Provenance} from '../provenance/provenance.model';

interface Parameters {
    [key: string]: any;
}

interface LayerConfig<S extends Symbology> {
    name: string;
    operator: Operator;
    symbology: S;
    prov$: Observable<Provenance>;
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
    private _prov$: Observable<Provenance>;

    constructor(config: LayerConfig<S>) {
        this.name = config.name;
        this._operator = config.operator;
        this.symbology = config.symbology;
        this._prov$ = config.prov$;

        this._prov$.subscribe(x => console.log("_prov$", x));
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

    static fromDict(
        dict: LayerDict,
        dataCallback: (operator: Operator) => Observable<GeoJsonFeatureCollection>,
        provenanceCallback: (operator: Operator) => Observable<Provenance>
    ): Layer<AbstractVectorSymbology> {
        const operator = Operator.fromDict(dict.operator);

        const layer = new VectorLayer({
            name: dict.name,
            operator: operator,
            symbology: Symbology.fromDict(dict.symbology) as AbstractVectorSymbology,
            data$: dataCallback(operator),
            prov$: provenanceCallback(operator),
        });

        layer.expanded = dict.expanded;

        return layer;
    }

    /**
     * @returns the data observable.
     */
    get data$(): Observable<GeoJsonFeatureCollection> {
        return this._data$;
    }

    get layerType(): LayerType {
        return 'vector';
    }

    public getDataStream(): Observable<GeoJsonFeatureCollection> {
        return this.data$;
    }
}

export class RasterLayer<S extends RasterSymbology> extends Layer<S> {
    constructor(config: RasterLayerConfig<S>) {
        super(config);
    }

    static fromDict(
        dict: LayerDict,
        symbologyCallback: (operator: Operator) => Observable<MappingColorizer>,
        provenanceCallback: (operator: Operator) => Observable<Provenance>
    ): Layer<RasterSymbology> {
        const operator = Operator.fromDict(dict.operator);

        const layer = new RasterLayer({
            name: dict.name,
            operator: operator,
            symbology: Symbology.fromDict(
                dict.symbology, symbologyCallback(operator)
            ) as RasterSymbology,
            prov$: provenanceCallback(operator),
        });

        layer.expanded = dict.expanded;

        return layer;
    }

    get layerType(): LayerType {
        return 'raster';
    }
}
