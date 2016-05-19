import {Observable} from 'rxjs/Rx';
import {Operator, OperatorDict} from './operator.model';
import Config from './config.model';
import {Symbology, SymbologyDict} from './symbology.model';
import {GeoJsonFeatureCollection} from './geojson.model';

interface Parameters {
    [key: string]: any;
}


interface LayerConfig<D> {
    name: string;
    operator: Operator;
    symbology: Symbology;
    data$?: Observable<D>;
}

/**
 * Dictionary for serialization.
 */
export interface LayerDict {
    name: string;
    operator: OperatorDict;
    expanded: boolean;
    symbology: SymbologyDict;
}

export class Layer<D> {
    name: string;
    expanded: boolean = false;
    symbology: Symbology;
    private _operator: Operator;

    /**
     * A data observable that emits new data on time and projection changes.
     */
    private _data$: Observable<D>;

    constructor(config: LayerConfig<D>) {
        this.name = config.name;
        this._operator = config.operator;
        this.symbology = config.symbology;
        this._data$ = (config.data$) ? config.data$ : Observable.of({} as D);
    }

    static fromDict<T>(dict: LayerDict,
        dataCallback: (operator: Operator) => Observable<T>): Layer<T> {

        const operator = Operator.fromDict(dict.operator);
        let layer = new Layer({
            name: dict.name,
            operator: operator,
            symbology: Symbology.fromDict(dict.symbology),
            data$: dataCallback(operator),
        });
        layer.expanded = dict.expanded;
        return layer;
    }

    get url() {
        return Config.MAPPING_URL;
    }

    get operator() {
      return this._operator;
    }

    /**
     * @returns the data observable.
     */
    get data$(): Observable<D> {
        return this._data$;
    }

    public getDataStream(): Observable<D> {
        return this.data$;
    }

    toDict(): LayerDict {
        return {
            name: this.name,
            operator: this._operator.toDict(),
            expanded: this.expanded,
            symbology: this.symbology.toDict(),
        };
    }
}

export class VectorLayer extends Layer<GeoJsonFeatureCollection> {
    constructor(config: LayerConfig<GeoJsonFeatureCollection>) {
        super(config);
    }
}

export class RasterLayer extends Layer<any> {
    constructor(config: LayerConfig<any>) {
        super(config);
    }
}
