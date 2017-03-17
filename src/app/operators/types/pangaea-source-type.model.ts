import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict}
  from '../operator-type.model';
import {CsvParameters} from '../dialogs/baskets/csv.model';

interface PangaeaSourceTypeConfig {
    dataLink: string;
    csvParameters: CsvParameters;
}

interface PangaeaSourceTypeMappingDict extends OperatorTypeMappingDict, CsvParameters {
    dataLink: string;
}

export interface PangaeaSourceTypeDict extends OperatorTypeDict  {
    dataLink: string;
    csvParameters: CsvParameters;
}

/**
 * The Pangaea source type.
 */
export class PangaeaSourceType extends OperatorType {
    private static _TYPE = 'pangaea_source';
    private static _ICON_URL = OperatorType.createIconDataUrl(PangaeaSourceType._TYPE);
    private static _NAME = 'Pangaea Source';

    static get TYPE(): string { return PangaeaSourceType._TYPE; }
    static get ICON_URL(): string { return PangaeaSourceType._ICON_URL; }
    static get NAME(): string { return PangaeaSourceType._NAME; }

    private dataLink: string;
    private csvParameters: CsvParameters;

    constructor(config: PangaeaSourceTypeConfig) {
        super();
        this.dataLink = config.dataLink;
        this.csvParameters = config.csvParameters;
    }

    static fromDict(dict: PangaeaSourceTypeDict): PangaeaSourceType {
        return new PangaeaSourceType({
            dataLink: dict.dataLink,
            csvParameters: dict.csvParameters,
    });
    }

    getMappingName(): string {
        return PangaeaSourceType.TYPE;
    }

    getIconUrl(): string {
        return PangaeaSourceType.ICON_URL;
    }

    toString(): string {
        return PangaeaSourceType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [
            ['dataLink', this.dataLink],
            ['geometry', this.csvParameters.geometry],
            ['separator', (this.csvParameters.separator) ?
                this.csvParameters.separator : ''],
            ['time', (this.csvParameters.time) ? this.csvParameters.time : ''],
        ];
    }

    toMappingDict(): PangaeaSourceTypeMappingDict {
        let dict = this.csvParameters as PangaeaSourceTypeMappingDict;
        dict.dataLink = this.dataLink;
        return dict;
    }

    toDict(): PangaeaSourceTypeDict {
        return {
            operatorType: PangaeaSourceType.TYPE,
            dataLink: this.dataLink,
            csvParameters: this.csvParameters,
        };
    }

}
