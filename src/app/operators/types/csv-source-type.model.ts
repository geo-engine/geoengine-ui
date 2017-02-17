import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict}
  from '../operator-type.model';
import {CsvParameters} from '../../../models/csv.model';

interface CsvSourceTypeConfig {
    csvParameters: CsvParameters;
    filename: string;
}

interface CsvSourceTypeMappingDict extends OperatorTypeMappingDict, CsvParameters {
    filename: string;
}

export interface CsvSourceTypeDict extends OperatorTypeDict  {
    csvParameters: CsvParameters;
    filename: string;
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
    private filename: string;

    constructor(config: CsvSourceTypeConfig) {
        super();
        this.csvParameters = config.csvParameters;
        this.filename = config.filename;
    }

    static fromDict(dict: CsvSourceTypeDict): CsvSourceType {
        return new CsvSourceType({
            csvParameters: dict.csvParameters,
            filename: dict.filename,
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
            ['filename', this.filename],
            ['geometry', this.csvParameters.geometry],
            ['field_separator', (this.csvParameters.separator) ?
                this.csvParameters.separator : ''],
            ['time', (this.csvParameters.time) ? this.csvParameters.time : ''],
        ];
    }

    toMappingDict(): CsvSourceTypeMappingDict {
        let dict = this.csvParameters as CsvSourceTypeMappingDict;
        dict.filename = this.filename;
        return dict;
    }

    toDict(): CsvSourceTypeDict {
        return {
            operatorType: CsvSourceType.TYPE,
            csvParameters: this.csvParameters,
            filename: this.filename,
        };
    }

}
