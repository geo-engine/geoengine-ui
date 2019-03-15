import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict} from '../operator-type.model';

interface OgrRawSourceTypeConfig {
    filename: string;
    layer_name?: string;
    time: 'none' | 'start' | 'start+end' | 'start+duration';
    duration?: number | 'inf';
    time1_format?: MappingTimeFormat;
    time2_format?: MappingTimeFormat;
    columns: {
        x?: string;
        y?: string;
        time1?: string;
        time2?: string;
        numeric: Array<string>;
        textual: Array<string>;
    };
    default?: string; // WKT definition of default value
    force_ogr_time_filter?: boolean;
    on_error: 'skip' | 'abort' | 'keep';
    provenance?: {
        citation: string;
        license: string;
        uri: string;
    };
}

// TODO: generalize and export
interface MappingTimeFormat {
    format: 'custom' | 'seconds' | 'dmyhm' | 'iso';
    custom_format?: string;
}

interface OgrRawSourceTypeMappingDict extends OperatorTypeMappingDict {
    filename: string;
    layer_name?: string;
    time: 'none' | 'start' | 'start+end' | 'start+duration';
    duration?: number | 'inf';
    time1_format?: MappingTimeFormat;
    time2_format?: MappingTimeFormat;
    columns: {
        x?: string;
        y?: string;
        time1?: string;
        time2?: string;
        numeric: Array<string>;
        textual: Array<string>;
    };
    default?: string; // WKT definition of default value
    force_ogr_time_filter?: boolean;
    on_error: 'skip' | 'abort' | 'keep';
    provenance?: {
        citation: string;
        license: string;
        uri: string;
    };
}

export interface OgrRawSourceTypeDict extends OperatorTypeDict  {
    filename: string;
    layer_name?: string;
    time: 'none' | 'start' | 'start+end' | 'start+duration';
    duration?: number | 'inf';
    time1_format?: MappingTimeFormat;
    time2_format?: MappingTimeFormat;
    columns: {
        x?: string;
        y?: string;
        time1?: string;
        time2?: string;
        numeric: Array<string>;
        textual: Array<string>;
    };
    default?: string; // WKT definition of default value
    force_ogr_time_filter?: boolean;
    on_error: 'skip' | 'abort' | 'keep';
    provenance?: {
        citation: string;
        license: string;
        uri: string;
    };
}

/**
 * The raster source type.
 */
export class OgrRawSourceType extends OperatorType {
    private static _TYPE = 'ogr_raw_source_with_time';
    private static _ICON_URL = OperatorType.createIconDataUrl(OgrRawSourceType._TYPE);
    private static _NAME = 'GDAL OGR Raw Source';

    static get TYPE(): string { return OgrRawSourceType._TYPE; }
    static get ICON_URL(): string { return OgrRawSourceType._ICON_URL; }
    static get NAME(): string { return OgrRawSourceType._NAME; }

    config: OgrRawSourceTypeConfig;

    static fromDict(dict: OgrRawSourceTypeDict): OgrRawSourceType {
        return new OgrRawSourceType(dict);
    }

    constructor(config: OgrRawSourceTypeConfig) {
        super();
        this.config = config;
    }

    getMappingName(): string {
        return OgrRawSourceType.TYPE;
    }

    getIconUrl(): string {
        return OgrRawSourceType.ICON_URL;
    }

    toString(): string {
        return OgrRawSourceType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [
            ['filename', this.config.filename.toString()],
            ['layer_name', this.config.layer_name ? this.config.layer_name.toString() : ''],
            ['columns.time1', this.config.columns.time1 ? this.config.columns.time1.toString() : ''],
            ['columns.time2', this.config.columns.time2 ? this.config.columns.time2.toString() : ''],
            ['columns.numeric', this.config.columns.numeric.toString()],
            ['columns.textual', this.config.columns.textual.toString()],
        ];
    }

    toMappingDict(): OgrRawSourceTypeMappingDict {
        return this.config;
    }

    toDict(): OgrRawSourceTypeDict {
        return {
            operatorType: OgrRawSourceType.TYPE,
            ...this.config,
        };
    }

}
