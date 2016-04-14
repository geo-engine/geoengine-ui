import {Operator, ResultType} from "./operator.model";
import Config from "../config.model";
import {Projection, Projections} from "./projection.model";

interface Parameters {
    [key: string]: any;
}

export class Layer {
    private _operator: Operator;
    expanded: boolean = false;

    constructor(operator: Operator) {
        this._operator = operator;
    }

    get name(): string {
        return this.operator.name;
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

    get style(): {} {
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
    }

}
