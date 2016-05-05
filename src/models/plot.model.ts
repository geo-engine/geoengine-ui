import {Operator, OperatorDict} from "./operator.model";

/**
 * Schema for plot data.
 */
export interface PlotData {
   type: string;
   data: Array<number>;
   lines?: Array<{name: string, pos: number}>;
   metadata: {
       numberOfBuckets: number,
       min: number,
       max: number,
       nodata: number,
   };
}

interface PlotConfig {
    name: string;
    operator: Operator;
}

/**
 * Dictionary for serialization.
 */
export interface PlotDict {
    name: string;
    operator: OperatorDict;
}

/**
 * A model for plots and text outputs
 */
export class Plot {
    name: string;
    private _operator: Operator;
    data: Promise<PlotData>;

    constructor(config: PlotConfig) {
        this.name = config.name;
        this._operator = config.operator;
    }

    /**
     * @return the operator.
     */
    get operator(): Operator {
        return this._operator;
    }

    /**
     * Serialization
     */
    toDict(): PlotDict {
        return {
            name: this.name,
            operator: this.operator.toDict(),
        };
    }

    /**
     * De-Serialization
     */
    static fromDict(dict: PlotDict): Plot {
        return new Plot({
            name: dict.name,
            operator: Operator.fromDict(dict.operator),
        });
    }
}
