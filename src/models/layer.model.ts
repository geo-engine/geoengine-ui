import {Observable} from 'rxjs/Rx';
import {Operator, OperatorDict} from './operator.model';
import Config from './config.model';
import {Symbology, SymbologyDict} from './symbology.model';

interface Parameters {
    [key: string]: any;
}

export type LayerData = JSON;

interface LayerConfig {
    name: string;
    operator: Operator;
    symbology: Symbology;
    data$: Observable<LayerData>;
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

export class Layer {
    name: string;
    expanded: boolean = false;
    symbology: Symbology;
    private _operator: Operator;

    /**
     * A data observable that emits new data on time and projection changes.
     */
    private _data$: Observable<LayerData>;

    constructor(config: LayerConfig) {
        this.name = config.name;
        this._operator = config.operator;
        this.symbology = config.symbology;
        this._data$ = config.data$;
    }

    static fromDict(dict: LayerDict,
        dataCallback: (operator: Operator) => Observable<LayerData>): Layer {

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
    get data$(): Observable<LayerData> {
        return this._data$;
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
