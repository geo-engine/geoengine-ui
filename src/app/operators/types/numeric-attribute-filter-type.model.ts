import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict} from '../operator-type.model';

interface NumericAttributeFilterTypeMappingDict extends OperatorTypeMappingDict {
    name: string;
    includeNoData: boolean;
    rangeMin?: number;
    rangeMax?: number;
}

export interface NumericAttributeFilterTypeDict extends OperatorTypeDict  {
    attributeName: string;
    includeNoData: boolean;
    rangeMin?: number;
    rangeMax?: number;
}

interface NumericAttributeFilterTypeConfig {
    attributeName: string;
    includeNoData: boolean;
    rangeMin?: number;
    rangeMax?: number;
}

/**
 * The numeric attribute filter type.
 */
export class NumericAttributeFilterType extends OperatorType {
    private static _TYPE = 'numeric_attribute_filter';
    private static _ICON_URL = OperatorType.createIconDataUrl(NumericAttributeFilterType._TYPE);
    private static _NAME = 'Numeric Attribute Filter';

    static get TYPE(): string { return NumericAttributeFilterType._TYPE; }
    static get ICON_URL(): string { return NumericAttributeFilterType._ICON_URL; }
    static get NAME(): string { return NumericAttributeFilterType._NAME; }

    private name: string;
    private includeNoData: boolean;
    private rangeMin: number;
    private rangeMax: number;

    constructor(config: NumericAttributeFilterTypeConfig) {
        super();
        this.name = config.attributeName;
        this.includeNoData = !!config.includeNoData; // defaults to false on undefined
        this.rangeMin = config.rangeMin;
        this.rangeMax = config.rangeMax;
    }

    static fromDict(dict: NumericAttributeFilterTypeDict): NumericAttributeFilterType {
        return new NumericAttributeFilterType(dict);
    }

    getMappingName(): string {
        return NumericAttributeFilterType.TYPE;
    }

    getIconUrl(): string {
        return NumericAttributeFilterType.ICON_URL;
    }

    toString(): string {
        return NumericAttributeFilterType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        const parameters: Array<[string, string]> = [
            ['includeNoData', this.includeNoData.toString()],
        ];
        if (this.rangeMin) {
            parameters.push(['rangeMin', this.rangeMin.toString()]);
        }
        if (this.rangeMax) {
            parameters.push(['rangeMax', this.rangeMax.toString()]);
        }
        return parameters;
    }

    toMappingDict(): NumericAttributeFilterTypeMappingDict {
        return {
            name: this.name,
            includeNoData: this.includeNoData,
            rangeMin: this.rangeMin,
            rangeMax: this.rangeMax,
        };
    }

    toDict(): NumericAttributeFilterTypeDict {
        return {
            operatorType: NumericAttributeFilterType.TYPE,
            attributeName: this.name,
            includeNoData: this.includeNoData,
            rangeMin: this.rangeMin,
            rangeMax: this.rangeMax,
        };
    }

    cloneWithModifications(options?: {}): OperatorType {
        return NumericAttributeFilterType.fromDict(this.toDict()); // TODO: add modifications
    }

}
