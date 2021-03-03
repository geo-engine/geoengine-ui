import {Operator, OperatorDict} from '../operators/operator.model';

/**
 * Schema for plot data.
 */
export interface PlotData {
    type: string;
    data: Array<number> | string;
    lines?: Array<{name: string; pos: number}>;
    metadata?: {
        numberOfBuckets?: number;
        min?: number;
        max?: number;
        nodata?: number;
    };
}

/**
 * Dictionary for instantiating plot.
 */
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
    private _name: string;
    private _operator: Operator;

    /**
     * De-Serialization
     */
    static fromDict(dict: PlotDict, operatorMap = new Map<number, Operator>()): Plot {
        const operator = Operator.fromDict(dict.operator, operatorMap);
        return new Plot({
            name: dict.name,
            operator: operator,
        });
    }

    constructor(config: PlotConfig) {
        this._name = config.name;
        this._operator = config.operator;
    }

    /**
     * @return the operator.
     */
    get operator(): Operator {
        return this._operator;
    }

    /**
     * @returns the data observable.
     */
    get name(): string {
        return this._name;
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
}
