import {Observable} from 'rxjs/Rx';

import {Operator, OperatorDict} from '../operators/operator.model';
import Config from '../app/config.model';
import {Symbology, SymbologyDict, AbstractVectorSymbology, RasterSymbology, MappingColorizer}
    from '../symbology/symbology.model';
import {GeoJsonFeatureCollection} from '../models/geojson.model';
import {Provenance} from '../provenance/provenance.model';

export interface VectorLayerDataStream {
    data$: Observable<GeoJsonFeatureCollection>;
    loading$: Observable<boolean>;
}

interface LayerConfig<S extends Symbology> {
    name: string;
    operator: Operator;
    symbology: S;
    prov$: Observable<Iterable<Provenance>>;
}

interface VectorLayerConfig<S extends AbstractVectorSymbology> extends LayerConfig<S> {
    data: VectorLayerDataStream;
    clustered?: boolean;
}

interface RasterLayerConfig<S extends RasterSymbology> extends LayerConfig<S> {

}

type LayerType = 'raster' | 'vector';

interface LayerTypeOptionsDict {}

interface VectorLayerTypeOptionsDict extends LayerTypeOptionsDict {
    clustered: boolean;
}

/**
 * Dictionary for serialization.
 */
export interface LayerDict {
    name: string;
    operator: OperatorDict;
    expanded: boolean;
    symbology: SymbologyDict;
    type: LayerType;
    typeOptions?: LayerTypeOptionsDict;
}

export abstract class Layer<S extends Symbology> {
    name: string;
    expanded: boolean = false;
    symbology: S;
    private _operator: Operator;
    private _prov$: Observable<Iterable<Provenance>>;

    constructor(config: LayerConfig<S>) {
        this.name = config.name;
        this._operator = config.operator;
        this.symbology = config.symbology;
        this._prov$ = config.prov$;

        // this._prov$.subscribe(x => console.log("_prov$", x));
    }

    get url() {
        return Config.MAPPING_URL;
    }

    get operator() {
      return this._operator;
    }

    get provenanceStream(): Observable<Iterable<Provenance>> {
        return this._prov$;
    }

    protected abstract get layerType(): LayerType;

    toDict(): LayerDict {
        return {
            name: this.name,
            operator: this._operator.toDict(),
            expanded: this.expanded,
            symbology: this.symbology.toDict(),
            type: this.layerType,
            typeOptions: this.typeOptions,
        };
    }

    protected get typeOptions(): LayerTypeOptionsDict {
        return {};
    };
}

export class VectorLayer<S extends AbstractVectorSymbology> extends Layer<S> {
    clustered = false;

    private _data: VectorLayerDataStream;

    constructor(config: VectorLayerConfig<S>) {
        super(config);
        this._data = config.data;
        this.clustered = !!config.clustered;
    }

    static fromDict(
        dict: LayerDict,
        dataCallback: (operator: Operator, clustered: boolean) => VectorLayerDataStream,
        provenanceCallback: (operator: Operator) => Observable<Iterable<Provenance>>
    ): Layer<AbstractVectorSymbology> {
        const operator = Operator.fromDict(dict.operator);
        const typeOptions = dict.typeOptions as VectorLayerTypeOptionsDict;

        const clustered = (typeOptions && typeOptions.clustered) ? typeOptions.clustered : false;

        const layer = new VectorLayer({
            name: dict.name,
            operator: operator,
            symbology: Symbology.fromDict(dict.symbology) as AbstractVectorSymbology,
            data: dataCallback(operator, clustered),
            prov$: provenanceCallback(operator),
            clustered: clustered,
        });

        layer.expanded = dict.expanded;

        return layer;
    }

    /**
     * @returns the data observable.
     */
    get data(): VectorLayerDataStream {
        return this._data;
    }

    get layerType(): LayerType {
        return 'vector';
    }

    protected get typeOptions(): VectorLayerTypeOptionsDict {
        console.log('called');
        return {
            clustered: this.clustered,
        };
    }

}

export class RasterLayer<S extends RasterSymbology> extends Layer<S> {
    constructor(config: RasterLayerConfig<S>) {
        super(config);
        if (!config.symbology.unit) {
            config.symbology.unit = config.operator.units.get('value');
        }
    }

    static fromDict(
        dict: LayerDict,
        symbologyCallback: (operator: Operator) => Observable<MappingColorizer>,
        provenanceCallback: (operator: Operator) => Observable<Iterable<Provenance>>
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
