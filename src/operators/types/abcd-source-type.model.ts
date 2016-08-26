import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict}
  from '../operator-type.model';

interface ABCDSourceTypeConfig {
    provider: string;
    id: string;
    units?: Array<string>;
}

interface ABCDSourceTypeMappingDict extends OperatorTypeMappingDict {
    path: string;
    units: Array<string>;
}

export interface ABCDSourceTypeDict extends OperatorTypeDict  {
    provider: string;
    id: string;
    units: Array<string>;
}

/**
 * The ABCD source type.
 */
export class ABCDSourceType extends OperatorType {
    private static _TYPE = 'abcd_source';
    private static _ICON_URL = OperatorType.createIconDataUrl(ABCDSourceType._TYPE);
    private static _NAME = 'ABCD Source';

    static get TYPE(): string { return ABCDSourceType._TYPE; }
    static get ICON_URL(): string { return ABCDSourceType._ICON_URL; }
    static get NAME(): string { return ABCDSourceType._NAME; }

    private provider: string;
    private id: string;
    private units: Array<string>;

    constructor(config: ABCDSourceTypeConfig) {
        super();
        this.provider = config.provider;
        this.id = config.id;
        this.units = (config.units) ? config.units : [];
    }

    static fromDict(dict: ABCDSourceTypeDict): ABCDSourceType {
        return new ABCDSourceType({
            provider: dict.provider,
            id: dict.id,
            units: dict.units,
        });
    }

    getMappingName(): string {
        return ABCDSourceType.TYPE;
    }

    getIconUrl(): string {
        return ABCDSourceType.ICON_URL;
    }

    toString(): string {
        return ABCDSourceType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [
            ['archive', this.provider],
            ['id', this.id],
            ['units', this.units.join((', '))],
        ];
    }

    toMappingDict(): ABCDSourceTypeMappingDict {
        return {
            path: this.id,
            units: this.units,
        };
    }

    toDict(): ABCDSourceTypeDict {
        return {
            operatorType: ABCDSourceType.TYPE,
            provider: this.provider,
            id: this.id,
            units: this.units,
        };
    }

}
