import {Operator, OperatorDict} from './operator.model';
import Config from './config.model';
import {Symbology, SymbologyDict} from './symbology.model';

interface Parameters {
    [key: string]: any;
}

interface LayerConfig {
    name: string;
    operator: Operator;
    symbology: Symbology;
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

    constructor(config: LayerConfig) {
        this.name = config.name;
        this._operator = config.operator;
        this.symbology = config.symbology;
    }

    static fromDict(dict: LayerDict): Layer {
        let layer = new Layer({
            name: dict.name,
            operator: Operator.fromDict(dict.operator),
            symbology: Symbology.fromDict(dict.symbology),
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

    toDict(): LayerDict {
        return {
            name: this.name,
            operator: this._operator.toDict(),
            expanded: this.expanded,
            symbology: this.symbology.toDict(),
        };
    }
}
