import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict} from '../operator-type.model';

interface OgrSourceTypeConfig {
    name: string;
    layer_name: string;
    numeric: string[];
    textual: string[];
}

interface OgrSourceTypeMappingDict extends OperatorTypeMappingDict {
    name: string;
    layer_name: string;
    numeric: string[];
    textual: string[];
}

export interface OgrSourceTypeDict extends OperatorTypeDict  {
    name: string;
    layer_name: string;
    numeric: string[];
    textual: string[];
}

/**
 * The raster source type.
 */
export class OgrSourceType extends OperatorType {
    private static _TYPE = 'ogr_source';
    private static _ICON_URL = OperatorType.createIconDataUrl(OgrSourceType._TYPE);
    private static _NAME = 'GDAL OGR Source';

    static get TYPE(): string { return OgrSourceType._TYPE; }
    static get ICON_URL(): string { return OgrSourceType._ICON_URL; }
    static get NAME(): string { return OgrSourceType._NAME; }

    name: string;
    layer_name: string;
    numeric: string[];
    textual: string[];

    static fromDict(dict: OgrSourceTypeDict): OgrSourceType {
        return new OgrSourceType(dict);
    }

    constructor(config: OgrSourceTypeConfig) {
        super();
        this.name = config.name;
        this.layer_name = config.layer_name;
        this.numeric = config.numeric;
        this.textual = config.textual;
    }

    getMappingName(): string {
        return OgrSourceType.TYPE;
    }

    getIconUrl(): string {
        return OgrSourceType.ICON_URL;
    }

    toString(): string {
        return OgrSourceType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [
            ['name', this.name.toString()],
            ['layer_name', this.layer_name.toString()],
            ['numeric', this.numeric.toString()],
            ['textual', this.textual.toString()],
        ];
    }

    toMappingDict(): OgrSourceTypeMappingDict {
        return {
            name: this.name,
            layer_name: this.layer_name,
            numeric: this.numeric,
            textual: this.textual,
        };
    }

    toDict(): OgrSourceTypeDict {
        return {
            operatorType: OgrSourceType.TYPE,
            name: this.name,
            layer_name: this.layer_name,
            numeric: this.numeric,
            textual: this.textual,
        };
    }

}
