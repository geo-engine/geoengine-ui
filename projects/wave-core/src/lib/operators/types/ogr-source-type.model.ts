import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict} from '../operator-type.model';

interface OgrSourceTypeConfig {
    dataset_id: string;
    layer_id: string | number;
    numeric: string[];
    textual: string[];
}

interface OgrSourceTypeMappingDict extends OperatorTypeMappingDict {
    name: string;
    layer_name: string | number;
    numeric: string[];
    textual: string[];
}

export interface OgrSourceTypeDict extends OperatorTypeDict {
    dataset_id: string;
    layer_id: string | number;
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

    static get TYPE(): string {
        return OgrSourceType._TYPE;
    }
    static get ICON_URL(): string {
        return OgrSourceType._ICON_URL;
    }
    static get NAME(): string {
        return OgrSourceType._NAME;
    }

    dataset_id: string;
    layer_id: string | number;
    numeric: string[];
    textual: string[];

    static fromDict(dict: OgrSourceTypeDict): OgrSourceType {
        return new OgrSourceType(dict);
    }

    constructor(config: OgrSourceTypeConfig) {
        super();
        this.dataset_id = config.dataset_id;
        this.layer_id = config.layer_id;
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
            ['dataset_id', this.dataset_id.toString()],
            ['layer_id', this.layer_id.toString()],
            ['numeric', this.numeric.toString()],
            ['textual', this.textual.toString()],
        ];
    }

    toMappingDict(): OgrSourceTypeMappingDict {
        return {
            name: this.dataset_id,
            layer_name: this.layer_id,
            numeric: this.numeric,
            textual: this.textual,
        };
    }

    toDict(): OgrSourceTypeDict {
        return {
            operatorType: OgrSourceType.TYPE,
            dataset_id: this.dataset_id,
            layer_id: this.layer_id,
            numeric: this.numeric,
            textual: this.textual,
        };
    }

    cloneWithModifications(options?: {}): OperatorType {
        return OgrSourceType.fromDict(this.toDict()); // TODO: add modifications
    }
}
