import {Observable, Observer} from 'rxjs/Rx';

import {Operator, OperatorDict} from '../operators/operator.model';
import {
    Symbology, SymbologyDict, AbstractVectorSymbology, RasterSymbology, ClusteredPointSymbology
} from './symbology/symbology.model';
import {Provenance} from '../provenance/provenance.model';
import {LoadingState} from '../project/loading-state.model';
import * as ol from 'openlayers';
import {Time} from '../time/time.model';
import {Projection} from '../operators/projection.model';

export abstract class LayerData<D> {
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

    static olParse(time: Time,
                   projection: Projection,
                   extent: [number, number, number, number],
                   source: (Document | Node | GlobalObject | string),
                   opt_options?: olx.format.ReadOptions): VectorData {
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

    constructor(time: Time,
                projection: Projection,
                data: string) {
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
    expanded?: boolean;
    visible?: boolean;
    editSymbology?: boolean;
}

interface VectorLayerConfig<S extends AbstractVectorSymbology> extends LayerConfig<S> {
    clustered?: boolean;
}

interface RasterLayerConfig<S extends RasterSymbology> extends LayerConfig<S> { // tslint:disable-line:no-empty-interface
}

type LayerType = 'raster' | 'vector';

interface LayerTypeOptionsDict { // tslint:disable-line:no-empty-interface
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
    symbology: SymbologyDict;
    expanded: boolean;
    visible: boolean;
    editSymbology: boolean;
    type: LayerType;
    typeOptions?: LayerTypeOptionsDict;
}

export abstract class Layer<S extends Symbology> {
    protected _name: string;
    protected _expanded = false;
    protected _visible = true;
    protected _editSymbology = false;
    protected _symbology: S;
    protected _operator: Operator;

    /**
     * Create the suitable layer type and initialize the callbacks.
     */
    static fromDict(dict: LayerDict,
                    operatorMap = new Map<number, Operator>()): Layer<Symbology> {
        // console.log('Layer.fromDict()', dict);
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
        this._name = config.name;
        this._operator = config.operator;
        this._symbology = config.symbology;
        if (config.expanded) {
            this._expanded = config.expanded;
        }
        if (config.visible) {
            this._visible = config.visible;
        }
        if (config.editSymbology) {
            this._editSymbology = config.editSymbology;
        }
    }

    /**
     * Changes the underlying data
     * Do not use this method publically!!!
     * @param data
     * @private
     */
    _changeUnderlyingData(data: {
        name?: string,
        symbology?: S,
        visible?: boolean,
        expanded?: boolean,
        editSymbology?: boolean,
    }) {
        if (data.name) {
            this._name = data.name;
        }

        if (data.symbology) {
            this._symbology = data.symbology;
        }

        if (data.visible !== undefined) {
            this._visible = data.visible;
        }

        if (data.expanded !== undefined) {
            this._expanded = data.expanded;
        }

        if (data.editSymbology !== undefined) {
            this._editSymbology = data.editSymbology;
        }
    }

    get operator(): Operator {
        return this._operator;
    }

    get name(): string {
        return this._name;
    }

    get symbology(): S {
        return this._symbology;
    }

    get expanded(): boolean {
        return this._expanded;
    }

    get visible(): boolean {
        return this._visible;
    }

    get editSymbology(): boolean {
        return this._editSymbology;
    }

    abstract getLayerType(): LayerType;

    toDict(): LayerDict {
        return {
            name: this.name,
            operator: this._operator.toDict(),
            symbology: this.symbology.toDict(),
            expanded: this.expanded,
            visible: this.visible,
            editSymbology: this.editSymbology,
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

        return new VectorLayer({
            name: dict.name,
            operator: operator,
            symbology: Symbology.fromDict(dict.symbology) as AbstractVectorSymbology,
            visible: dict.visible,
            expanded: dict.expanded,
            editSymbology: dict.editSymbology,
            clustered: clustered,
        });
    }

    constructor(config: VectorLayerConfig<S>) {
        super(config);
        this.clustered = !!config.clustered;
    }

    getLayerType(): LayerType {
        return 'vector';
    }

    protected get typeOptions(): VectorLayerTypeOptionsDict {
        return {
            clustered: this.clustered,
        };
    }

}

export class RasterLayer<S extends RasterSymbology> extends Layer<S> {

    static fromDict(dict: LayerDict, operatorMap = new Map<number, Operator>()): Layer<RasterSymbology> {
        const operator = Operator.fromDict(dict.operator, operatorMap);

        return new RasterLayer({
            name: dict.name,
            operator: operator,
            symbology: Symbology.fromDict(dict.symbology) as RasterSymbology,
            visible: dict.visible,
            expanded: dict.expanded,
            editSymbology: dict.editSymbology,
        });
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
