import {Observable, Observer} from 'rxjs/Rx';

import {Operator, OperatorDict} from '../app/operators/operator.model';
import {LoadingState} from '../shared/loading-state.model';

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

export interface PlotDataStream {
    data$: Observable<PlotData>;
    state$: Observable<LoadingState>;
    reload$: Observer<void>;
}

interface PlotConfig {
    name: string;
    operator: Operator;
    data: PlotDataStream;
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
     * A data stream object that contains observables for data.
     */
    private _data: PlotDataStream;

    constructor(config: PlotConfig) {
        this.name = config.name;
        this._operator = config.operator;
        this._data = config.data;
    }

    /**
     * De-Serialization
     */
    static fromDict(
        dict: PlotDict,
        dataCallback: (operator: Operator) => PlotDataStream,
        operatorMap = new Map<number, Operator>()
    ): Plot {
        const operator = Operator.fromDict(dict.operator, operatorMap);
        return new Plot({
            name: dict.name,
            operator: operator,
            data: dataCallback(operator),
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
    get data(): PlotDataStream {
        return this._data;
    }

    /**
     * Reload the data.
     */
    reload() {
        this.data.reload$.next(undefined);
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
