import {Operator, ResultType, OperatorDict} from "./operator.model";
import Config from "../config.model";
import {Projection, Projections} from "./projection.model";
import {Symbology} from "./symbology.model";

interface Parameters {
    [key: string]: any;
}

interface LayerConfig {
    name: string;
    operator: Operator;
}

/**
 * Dictionary for serialization.
 */
export interface LayerDict {
    name: string;
    operator: OperatorDict;
    expanded: boolean;
}

export class Layer {
    private _operator: Operator;
    name: string;
    expanded: boolean = false;
    symbology: Symbology;

    constructor(config: LayerConfig) {
        this.name = config.name;
        this._operator = config.operator;
        this.symbology = Symbology.randomSimplePointSymbology(); // TODO: random by type
    }

    get url() {
        return Config.MAPPING_URL;
    }

    get operator() {
      return this._operator;
    }

    getParams(projection: Projection): Parameters {
        let time = "2010-06-06T18:00:00.000Z"; // TODO: make a parameter

        switch (this.operator.resultType) {
           case ResultType.RASTER: {
                let operator = this.operator.getProjectedOperator(projection);

                return {
                    "SERVICE": "WMS",
                    "VERSION": Config.WMS_VERSION,
                    "REQUEST": "GetMap",
                    "FORMAT": Config.WMS_FORMAT,
                    "TRANSPARENT": true,
                    "LAYERS": operator.toQueryJSON(),
                    "COLORS": "gray",
                    "DEBUG": (Config.DEBUG_MODE ? 1 : 0),
                    "TIME": time
                };
            }

            case ResultType.POINTS: {
                let operator = this.operator.getProjectedOperator(projection);

                return {
                    "pointquery": operator.toQueryJSON(),
                    "COLORS": "hsv",
                    "CRS": projection.getCode(),
                    "TIME": time
                };
            }
        }
    }

    get resultType(): ResultType {
        return this.operator.resultType;
    }


    get olStyle(): ol.style.Style {
        /*
        switch (this.operator.resultType) {
           case ResultType.RASTER:
                return {
                    opacity: 0.5
                };

            case ResultType.POINTS:
                return {
                    color: "#FF0000"
                };
        }
        */
        return this.symbology.olStyle;
    }


    toDict(): LayerDict {
        return {
            name: this.name,
            operator: this._operator.toDict(),
            expanded: this.expanded,
        };
    }

    static fromDict(dict: LayerDict): Layer {
        let layer = new Layer({
            name: dict.name,
            operator: Operator.fromDict(dict.operator),
        });
        layer.expanded = dict.expanded;

        return layer;
    }

}
