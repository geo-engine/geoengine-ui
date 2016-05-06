import {Operator, OperatorDict} from "./operator.model";
import {ResultTypes} from "./result-type.model";
import Config from "./config.model";
import {Projection, Projections} from "./projection.model";
import {Symbology, SimplePointSymbology, RasterSymbology, SymbologyDict} from "./symbology.model";
import * as moment from "moment";

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
    private _operator: Operator;
    name: string;
    expanded: boolean = false;
    symbology: Symbology;

    constructor(config: LayerConfig) {
        this.name = config.name;
        this._operator = config.operator;
        this.symbology = (config.symbology) ? config.symbology : new SimplePointSymbology({}); // TODO: relax symbology to optional and add creation by type
    }

    get url() {
        return Config.MAPPING_URL;
    }

    get operator() {
      return this._operator;
    }

    // TODO: move?
    getParams(projection: Projection, time: moment.Moment): Parameters {
        let isoTime = time.toISOString(); // "2010-06-06T18:00:00.000Z"; // TODO: make a parameter moment.toIsoString();
        console.log("isoTime", isoTime);

        switch (this.operator.resultType) {
           case ResultTypes.RASTER: {
                let operator = this.operator.getProjectedOperator(projection);

                return {
                    "SERVICE": "WMS",
                    "VERSION": Config.WMS.VERSION,
                    "REQUEST": "GetMap",
                    "FORMAT": Config.WMS.FORMAT,
                    "TRANSPARENT": true,
                    "LAYERS": operator.toQueryJSON(),
                    "COLORS": "gray",
                    "DEBUG": (Config.DEBUG_MODE ? 1 : 0),
                    "TIME": isoTime,
                };
            }

            case ResultTypes.POINTS: {
                let operator = this.operator.getProjectedOperator(projection);

                return {
                    service: "WFS",
                    version: Config.WFS.VERSION,
                    request: "GetFeature",
                    typeNames: `points:${operator.toQueryJSON()}`,
                    srsname: projection.getCode(),
                    time: isoTime,
                };
            }
        }
    }

    toDict(): LayerDict {
        return {
            name: this.name,
            operator: this._operator.toDict(),
            expanded: this.expanded,
            symbology: this.symbology.toDict(),
        };
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

}
