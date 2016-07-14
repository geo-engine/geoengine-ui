import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict}
  from '../operator-type.model';

interface ClassificationTypeConfig {
    reclassNoData: boolean;
    noDataClass: number;
    remapRangeValues: Array<number>;
    remapRangeClasses: Array<number>;
}

interface ClassificationTypeMappingDict extends OperatorTypeMappingDict {
    reclassNoData: boolean;
    noDataClass: number;
    remapRange: [Array<number>, Array<number>];
}

export interface ClassificationTypeDict extends OperatorTypeDict, ClassificationTypeConfig  {

}

/**
 * The classification type.
 */
export class ClassificationType extends OperatorType {
    private static _TYPE = 'classification';
    private static _ICON_URL = 'assets/operator-type-icons/classification.png';
    private static _NAME = 'Classification';

    static get TYPE(): string { return ClassificationType._TYPE; }
    static get ICON_URL(): string { return ClassificationType._ICON_URL; }
    static get NAME(): string { return ClassificationType._NAME; }

    private reclassNoData: boolean;
    private noDataClass: number;
    private remapRangeValues: Array<number>;
    private remapRangeClasses: Array<number>;

    constructor(config: ClassificationTypeConfig) {
        super();
        this.reclassNoData = config.reclassNoData;
        this.noDataClass = config.noDataClass;
        this.remapRangeValues = config.remapRangeValues;
        this.remapRangeClasses = config.remapRangeClasses;
    }

    static fromDict(dict: ClassificationTypeDict): ClassificationType {
        return new ClassificationType(dict);
    }

    getMappingName(): string {
        return ClassificationType.TYPE;
    }

    getIconUrl(): string {
        return ClassificationType.ICON_URL;
    }

    toString(): string {
        return ClassificationType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [
            ['reclassNoData', this.reclassNoData.toString()],
            ['noDataClass', this.noDataClass.toString()],
            ['values', this.remapRangeValues.toString()],
            ['classes', this.remapRangeClasses.toString()],
        ];
    }

    toMappingDict(): ClassificationTypeMappingDict {
        return {
            reclassNoData: this.reclassNoData,
            noDataClass: this.noDataClass,
            remapRange: [this.remapRangeValues, this.remapRangeClasses],
        };
    }

    toDict(): ClassificationTypeDict {
        return {
            operatorType: ClassificationType.TYPE,
            reclassNoData: this.reclassNoData,
            noDataClass: this.noDataClass,
            remapRangeValues: this.remapRangeValues,
            remapRangeClasses: this.remapRangeClasses,
        };
    }

}
