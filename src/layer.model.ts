import {Operator, ResultType} from "./models/operator.model";
import Config from "./config.model";

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

    get params(): Parameters {
        let time = "2010-06-06T18:00:00.000Z";

        switch (this.operator.resultType) {
           case ResultType.RASTER: {
                let operator = this.operator.getProjectedOperator("EPSG:3857");

                return {
                    "SERVICE": "WMS",
                    "VERSION": "1.3.0",
                    "REQUEST": "GetMap",
                    "FORMAT": "image/png",
                    "TRANSPARENT": true,
                    "LAYERS": operator.toQueryJSON(),
                    "COLORS": "gray",
                    "DEBUG": 1,
                    "TIME": time
                };
            }

            case ResultType.POINTS: {
                let operator = this.operator.getProjectedOperator("EPSG:3857");

                return {
                    "pointquery": operator.toQueryJSON(),
                    "COLORS": "hsv",
                    "CRS": "EPSG:3857",
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
