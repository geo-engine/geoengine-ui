import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict}
  from '../operator-type.model';

interface HistogramTypeMappingDict extends OperatorTypeMappingDict {
    attribute: string;
    range: [number, number] | string; // `[min, max]` or `unit` or `data`
    buckets?: number;
}

export interface HistogramTypeDict extends OperatorTypeDict {
    attribute: string;
    range: { min: number, max: number } | string;
    buckets?: number;
}

interface HistogramTypeConfig {
    attribute: string;
    range: { min: number, max: number } | string;
    buckets?: number;
}

/**
 * The histogram type.
 */
export class HistogramType extends OperatorType {
    private static _TYPE = 'histogram';
    private static _ICON_URL = OperatorType.createIconDataUrl(HistogramType._TYPE);
    private static _NAME = 'Histogram';

    static get TYPE(): string { return HistogramType._TYPE; }
    static get ICON_URL(): string { return HistogramType._ICON_URL; }
    static get NAME(): string { return HistogramType._NAME; }

    private attribute: string;
    private range: { min: number, max: number } | string;
    private buckets: number;

    constructor(config: HistogramTypeConfig) {
        super();
        this.attribute = config.attribute;
        this.range = config.range;
        this.buckets = config.buckets;
    }

    static fromDict(dict: HistogramTypeDict): HistogramType {
        return new HistogramType(dict);
    }

    getMappingName(): string {
        return HistogramType.TYPE;
    }

    getIconUrl(): string {
        return HistogramType.ICON_URL;
    }

    toString(): string {
        return HistogramType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        let range: string;
        if (typeof this.range === 'string') {
            range = this.range as string;
        } else {
            const rangeStruct = this.range as { min: number, max: number };
            range = `min: ${rangeStruct.min}, max: ${rangeStruct.max}`;
        }

        return [
            ['attribute', this.attribute.toString()],
            ['range', range],
            ['buckets', this.buckets.toString()],
        ];
    }

    toMappingDict(): HistogramTypeMappingDict {
        let range: [number, number] | string;
        if (typeof this.range === 'string') {
            range = this.range as string;
        } else {
            const rangeStruct = this.range as { min: number, max: number };
            range = [rangeStruct.min, rangeStruct.max];
        }

        return {
            attribute: this.attribute,
            range: range,
            buckets: this.buckets,
        };
    }

    toDict(): HistogramTypeDict {
        return {
            operatorType: HistogramType.TYPE,
            attribute: this.attribute,
            range: this.range,
            buckets: this.buckets,
        };
    }

}
