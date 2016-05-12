import {Observable} from 'rxjs/Rx';

import {Operator, OperatorDict} from '../models/operator.model';

/**
 * Schema for plot data.
 */
export interface PlotData {
   type: string;
   data: Array<number> | string;
   lines?: Array<{name: string, pos: number}>;
   metadata?: {
       numberOfBuckets?: number,
       min?: number,
       max?: number,
       nodata?: number,
   };
}

interface PlotConfig {
    name: string;
    operator: Operator;
    data$: Observable<PlotData>;
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

    /**
     * A data observable that emits new data on time changes.
     */
    private _data$: Observable<PlotData>;

    constructor(config: PlotConfig) {
        this.name = config.name;
        this._operator = config.operator;
        this._data$ = config.data$;
    }

    /**
     * De-Serialization
     */
    static fromDict(dict: PlotDict,
                    dataCallback: (operator: Operator) => Observable<PlotData>): Plot {
        const operator = Operator.fromDict(dict.operator);
        return new Plot({
            name: dict.name,
            operator: Operator.fromDict(dict.operator),
            data$: dataCallback(operator),
        });
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
    get data$(): Observable<PlotData> {
        return this._data$;
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
