import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict}
  from '../operator-type.model';

interface PangaeaSourceTypeConfig {
    dataLink: string;

}

interface PangaeaSourceTypeMappingDict extends OperatorTypeMappingDict {
    dataLink: string;
}

export interface PangaeaSourceTypeDict extends OperatorTypeDict  {
    dataLink: string;
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

    private dataLink: string

    constructor(config: PangaeaSourceTypeConfig) {
        super();
        this.dataLink = config.dataLink;
    }

    static fromDict(dict: PangaeaSourceTypeDict): PangaeaSourceType {
        return new PangaeaSourceType({
            dataLink: dict.dataLink,
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
        ];
    }

    toMappingDict(): PangaeaSourceTypeMappingDict {
        return {
            dataLink: this.dataLink,
        };
    }

    toDict(): PangaeaSourceTypeDict {
        return {
            operatorType: PangaeaSourceType.TYPE,
            dataLink: this.dataLink,
        };
    }

}
