import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict}
  from '../operator-type.model';
import {CsvParameters} from '../../models/csv.model';

interface CsvSourceTypeConfig {
    csvParameters: CsvParameters;
}

interface CsvSourceTypeMappingDict extends OperatorTypeMappingDict, CsvParameters {}

export interface CsvSourceTypeDict extends OperatorTypeDict  {
    csvParameters: CsvParameters;
}

/**
 * The CSV source type.
 */
export class CsvSourceType extends OperatorType {
    private static _TYPE = 'csv_source';
    private static _ICON_URL = OperatorType.createIconDataUrl(CsvSourceType._TYPE);
    private static _NAME = 'CSV Source';

    static get TYPE(): string { return CsvSourceType._TYPE; }
    static get ICON_URL(): string { return CsvSourceType._ICON_URL; }
    static get NAME(): string { return CsvSourceType._NAME; }

    private csvParameters: CsvParameters;

    constructor(config: CsvSourceTypeConfig) {
        super();
        this.csvParameters = config.csvParameters;
    }

    static fromDict(dict: CsvSourceTypeDict): CsvSourceType {
        return new CsvSourceType({
            csvParameters: dict.csvParameters,
        });
    }

    getMappingName(): string {
        return CsvSourceType.TYPE;
    }

    getIconUrl(): string {
        return CsvSourceType.ICON_URL;
    }

    toString(): string {
        return CsvSourceType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [
            ['filename', this.csvParameters.filename],
            ['geometry', this.csvParameters.geometry],
            ['field_separator', (this.csvParameters.field_separator) ?
                this.csvParameters.field_separator : undefined],
            ['time', (this.csvParameters.time) ? this.csvParameters.time : undefined],
        ];
    }

    toMappingDict(): CsvSourceTypeMappingDict {
        return this.csvParameters;
    }

    toDict(): CsvSourceTypeDict {
        return {
            operatorType: CsvSourceType.TYPE,
            csvParameters: this.csvParameters,
        };
    }

}
