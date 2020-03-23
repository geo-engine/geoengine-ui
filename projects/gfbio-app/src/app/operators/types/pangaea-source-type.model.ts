import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict} from 'wave-core';
import {CsvParameters} from '../dialogs/baskets/csv.model';

interface PangaeaSourceTypeConfig {
    doi: string;
    csvParameters: CsvParameters;
}

interface PangaeaSourceTypeMappingDict extends OperatorTypeMappingDict, CsvParameters {
    doi: string;
}

export interface PangaeaSourceTypeDict extends OperatorTypeDict {
    doi: string;
    csvParameters: CsvParameters;
}

/**
 * The Pangaea source type.
 */
export class PangaeaSourceType extends OperatorType {
    private static _TYPE = 'pangaea_source';
    private static _ICON_URL = OperatorType.createIconDataUrl(PangaeaSourceType._TYPE);
    private static _NAME = 'Pangaea Source';

    static get TYPE(): string {
        return PangaeaSourceType._TYPE;
    }

    static get ICON_URL(): string {
        return PangaeaSourceType._ICON_URL;
    }

    static get NAME(): string {
        return PangaeaSourceType._NAME;
    }

    private doi: string;
    private csvParameters: CsvParameters;

    constructor(config: PangaeaSourceTypeConfig) {
        super();
        this.doi = config.doi;
        this.csvParameters = config.csvParameters;
    }

    static fromDict(dict: PangaeaSourceTypeDict): PangaeaSourceType {
        return new PangaeaSourceType({
            doi: dict.doi,
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
            ['doi', this.doi],
            ['geometry', this.csvParameters.geometry],
            ['separator', (this.csvParameters.separator) ?
                this.csvParameters.separator : ''],
            ['time', (this.csvParameters.time) ? this.csvParameters.time : ''],
        ];
    }

    toMappingDict(): PangaeaSourceTypeMappingDict {
        let dict = this.csvParameters as PangaeaSourceTypeMappingDict;
        dict.doi = this.doi;
        return dict;
    }

    toDict(): PangaeaSourceTypeDict {
        return {
            operatorType: PangaeaSourceType.TYPE,
            doi: this.doi,
            csvParameters: this.csvParameters,
        };
    }

    cloneWithModifications(options?: {}): OperatorType {
        return PangaeaSourceType.fromDict(this.toDict()); // TODO: add modifications
    }

}
