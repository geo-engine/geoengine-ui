import {Observable, Observer} from 'rxjs/Rx';

import {Operator, OperatorDict} from '../operators/operator.model';
import {
    Symbology, SymbologyDict, AbstractVectorSymbology, RasterSymbology, MappingColorizer, ClusteredPointSymbology
} from './symbology/symbology.model';
import {Provenance} from '../provenance/provenance.model';
import {LoadingState} from '../project/loading-state.model';
import * as ol from 'openlayers';
import {Time} from '../time/time.model';
import {Projection} from '../operators/projection.model';

export abstract class LayerData<D>{
    type: LayerType;
    _time: Time;
    _projection: Projection;

    constructor(type: LayerType, time: Time, projection: Projection) {
        this.type = type;
        this._projection = projection;
        this._time = time;
    }

    get time(): Time {
        return this._time;
    }

    get projection(): Projection {
        return this._projection;
    }

    abstract get data(): D;
}

export class VectorData extends LayerData<Array<ol.Feature>> {
    _data: Array<ol.Feature>;
    _extent: [number, number, number, number];

    static olParse(
        time: Time,
        projection: Projection,
        extent: [number, number, number, number],
        source: (Document | Node | GlobalObject | string),
        opt_options?: olx.format.ReadOptions): VectorData
    {
        return new VectorData(time, projection, new ol.format.GeoJSON().readFeatures(source, opt_options), extent);
    }

    constructor(time: Time, projection: Projection, data: Array<ol.Feature>, extent: [number, number, number, number]) {
        super('vector', time, projection);
        this._data = data;
        this._extent = extent;
        this.fakeIds(); // FIXME: use real IDs ...
    }

    get data(): Array<ol.Feature> {
        return this._data;
    }

    get extent(): [number, number, number, number] {
        return this._extent;
    }

    fakeIds() {
        for (let localRowId = 0; localRowId < this.data.length; localRowId++) {
            const feature = this.data[localRowId];
            if (feature.getId() === undefined) {
                feature.setId(localRowId);
            }
        }
    }
}

export class RasterData extends LayerData<string> {
    _data: string;

    constructor(
        time: Time,
        projection: Projection,
        data: string
    ){
        super('raster', time, projection);
        this._data = data;
    }


    get data(): string {
        return this._data;
    }

}

export interface VectorLayerData {
    data$: Observable<Array<ol.Feature>>;
    dataExtent$?: Observable<[number, number, number, number]>,
    state$: Observable<LoadingState>;
    reload$: Observer<void>;
}

export interface LayerProvenance {
    provenance$: Observable<Iterable<Provenance>>;
    state$: Observable<LoadingState>;
    reload$: Observer<void>;
}

interface LayerConfig<S extends Symbology> {
    name: string;
    operator: Operator;
    symbology: S;
    // provenance: LayerProvenance;
}

interface VectorLayerConfig<S extends AbstractVectorSymbology> extends LayerConfig<S> {
    // data: VectorLayerData;
    clustered?: boolean;
}

interface RasterLayerConfig<S extends RasterSymbology> extends LayerConfig<S> {
}

type LayerType = 'raster' | 'vector';

interface LayerTypeOptionsDict {
}

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
    visible: boolean;
    editSymbology: boolean;
    symbology: SymbologyDict;
    type: LayerType;
    typeOptions?: LayerTypeOptionsDict;
}

export abstract class Layer<S extends Symbology> {
    name: string;
    expanded = false;
    visible = true;
    editSymbology = false;
    symbology: S;
    protected _operator: Operator;
    //protected _provenance: LayerProvenance;
    // protected _state$: Observable<LoadingState>;

    /**
     * Create the suitable layer type and initialize the callbacks.
     */
    static fromDict(
        dict: LayerDict,
        operatorMap = new Map<number, Operator>()
    ): Layer<Symbology> {
        console.log('Layer.fromDict()', dict);
        switch (dict.type) {
            case 'raster':
                return RasterLayer.fromDict(
                    dict,
                    operatorMap
                );
            case 'vector':
                return VectorLayer.fromDict(
                    dict,
                    operatorMap
                );
            default:
                throw new Error('LayerService.createLayerFromDict: Unknown LayerType ->' + dict);
        }
    }

    constructor(config: LayerConfig<S>) {
        this.name = config.name;
        this._operator = config.operator;
        this.symbology = config.symbology;
        // this._provenance = config.provenance;

        // this._state$ = this._provenance.state$;
    }

    get operator() {
        return this._operator;
    }

    /*
    get provenanceStream(): Observable<Iterable<Provenance>> {
        return this._provenance.provenance$;
    }
    */

    abstract getLayerType(): LayerType;

    /**
     * Retrieve the loading state of the layer.
     */
    // get loadingState(): Observable<LoadingState> {
    //     return this._state$;
    // }

    /**
     * Reload the async data.
     */
    // reload() {
    //     this._provenance.reload$.next(undefined);
    // }

    toDict(): LayerDict {
        return {
            name: this.name,
            operator: this._operator.toDict(),
            expanded: this.expanded,
            visible: this.visible,
            editSymbology: this.editSymbology,
            symbology: this.symbology.toDict(),
            type: this.getLayerType(),
            typeOptions: this.typeOptions,
        };
    }

    protected get typeOptions(): LayerTypeOptionsDict {
        return {};
    };
}

export class VectorLayer<S extends AbstractVectorSymbology> extends Layer<S> {
    clustered = false;

    static fromDict(dict: LayerDict,
                    operatorMap = new Map<number, Operator>()): Layer<AbstractVectorSymbology> {
        const operator = Operator.fromDict(dict.operator, operatorMap);
        const typeOptions = dict.typeOptions as VectorLayerTypeOptionsDict;

        const clustered = (typeOptions && typeOptions.clustered)
            && typeOptions.clustered
            || dict.symbology instanceof ClusteredPointSymbology
            || false;
        // console.log('VectorLayer', 'fromDict', clustered, dict);

        const layer = new VectorLayer({
            name: dict.name,
            operator: operator,
            symbology: Symbology.fromDict(dict.symbology) as AbstractVectorSymbology,
            // data: dataCallback(operator, clustered),
            // provenance: provenanceCallback(operator),
            clustered: clustered,
        });

        layer.expanded = dict.expanded;
        layer.editSymbology = dict.editSymbology;

        return layer;
    }

    constructor(config: VectorLayerConfig<S>) {
        super(config);
        // this._data = config.data;
        this.clustered = !!config.clustered;
        /*
        this._state$ = Observable.combineLatest(
            this._provenance.state$,
            this._data.state$,
            (state1, state2) => {
                if (state1 === LoadingState.LOADING || state2 === LoadingState.LOADING) {
                    return LoadingState.LOADING;
                } else if (state1 === LoadingState.ERROR || state2 === LoadingState.ERROR) {
                    return LoadingState.ERROR;
                } else {
                    return LoadingState.OK;
                }
            }
        );
        */
    }


    /**
     * @returns the data observable.
     */
    // get data(): VectorLayerData {
    //     return this._data;
    // }

    getLayerType(): LayerType {
        return 'vector';
    }


    /*
    reload() {
        super.reload();
        this._data.reload$.next(undefined);
    }
    */

    protected get typeOptions(): VectorLayerTypeOptionsDict {
        return {
            clustered: this.clustered,
        };
    }

}

export class RasterLayer<S extends RasterSymbology> extends Layer<S> {

    static fromDict(dict: LayerDict,
                    // symbologyCallback: (operator: Operator) => Observable<MappingColorizer>,
                    // provenanceCallback: (operator: Operator) => LayerProvenance,
                    operatorMap = new Map<number, Operator>()): Layer<RasterSymbology> {
        const operator = Operator.fromDict(dict.operator, operatorMap);

        const layer = new RasterLayer({
            name: dict.name,
            operator: operator,
            symbology: Symbology.fromDict(
                dict.symbology
            ) as RasterSymbology,
            // provenance: provenanceCallback(operator),
        });

        layer.expanded = dict.expanded;

        return layer;
    }

    constructor(config: RasterLayerConfig<S>) {
        super(config);
        if (!config.symbology.unit) {
            config.symbology.unit = config.operator.units.get('value');
        }
    }

    getLayerType(): LayerType {
        return 'raster';
    }
}
