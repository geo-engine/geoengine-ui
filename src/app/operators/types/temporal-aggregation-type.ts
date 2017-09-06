import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict} from '../operator-type.model';

type AggregationType = 'min' | 'max' | 'avg';

interface TemporalAggregationTypeMappingDict extends OperatorTypeMappingDict {
    duration: number;
    aggregationType: AggregationType;
}

export interface TemporalAggregationTypeDict extends OperatorTypeDict {
    duration: number;
    aggregationType: AggregationType;
}

interface TemporalAggregationTypeConfig {
    duration: number;
    aggregationType: AggregationType;
}

/**
 * The temporal aggregation type.
 */
export class TemporalAggregationType extends OperatorType {
    private static _TYPE = 'temporal_aggregation';
    private static _ICON_URL = OperatorType.createIconDataUrl(TemporalAggregationType._TYPE);
    private static _NAME = 'Temporal Aggregation';

    static get TYPE(): string { return TemporalAggregationType._TYPE; }
    static get ICON_URL(): string { return TemporalAggregationType._ICON_URL; }
    static get NAME(): string { return TemporalAggregationType._NAME; }

    private duration: number;
    private aggregationType: AggregationType;

    static fromDict(dict: TemporalAggregationTypeDict): TemporalAggregationType {
        return new TemporalAggregationType({
            duration: dict.duration,
            aggregationType: dict.aggregationType,
        });
    }

    constructor(config: TemporalAggregationTypeConfig) {
        super();
        this.duration = config.duration;
        this.aggregationType = config.aggregationType;
    }

    getMappingName(): string {
        return TemporalAggregationType.TYPE;
    }

    getIconUrl(): string {
        return TemporalAggregationType.ICON_URL;
    }

    toString(): string {
        return TemporalAggregationType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [
            ['duration', this.duration.toString()],
            ['aggregationType', this.aggregationType.toString()],
        ];
    }

    toMappingDict(): TemporalAggregationTypeMappingDict {
        return {
            duration: this.duration,
            aggregationType: this.aggregationType,
        };
    }

    toDict(): TemporalAggregationTypeDict {
        return {
            operatorType: TemporalAggregationType.TYPE,
            duration: this.duration,
            aggregationType: this.aggregationType,
        };
    }

}
