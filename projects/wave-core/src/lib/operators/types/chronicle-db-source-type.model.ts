import {OperatorType, OperatorTypeCloneOptions, OperatorTypeDict, OperatorTypeMappingDict} from '../operator-type.model';

interface ChronicleDBSourceTypeConfig {
    filename: string;
    layer_name?: string;
    query_string?: string;
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

interface ChronicleDBSourceTypeMappingDict extends OperatorTypeMappingDict {
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

export interface ChronicleDBSourceTypeDict extends OperatorTypeDict {
    filename: string;
    layer_name?: string;
    query_string?: string;
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
export class ChronicleDBSourceType extends OperatorType {
    private static _TYPE = 'chronicle_db_source';
    private static _ICON_URL = OperatorType.createIconDataUrl(ChronicleDBSourceType._TYPE);
    private static _NAME = 'ChronicleDB Source';

    static get TYPE(): string {
        return ChronicleDBSourceType._TYPE;
    }

    static get ICON_URL(): string {
        return ChronicleDBSourceType._ICON_URL;
    }

    static get NAME(): string {
        return ChronicleDBSourceType._NAME;
    }

    config: ChronicleDBSourceTypeConfig;

    static fromDict(dict: ChronicleDBSourceTypeDict): ChronicleDBSourceType {
        return new ChronicleDBSourceType(dict);
    }

    constructor(config: ChronicleDBSourceTypeConfig) {
        super();
        this.config = config;
    }

    getMappingName(): string {
        return 'ogr_raw_source_with_time';
    }

    getIconUrl(): string {
        return ChronicleDBSourceType.ICON_URL;
    }

    toString(): string {
        return ChronicleDBSourceType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [
            ['filename', this.config.query_string ? '' : this.config.filename.toString()], // FIXME: workaround for CronicalDB
            ['layer_name', this.config.layer_name ? this.config.layer_name.toString() : ''],
            ['query_string', this.config.query_string ? this.config.query_string.toString() : ''],
            ['columns.time1', this.config.columns.time1 ? this.config.columns.time1.toString() : ''],
            ['columns.time2', this.config.columns.time2 ? this.config.columns.time2.toString() : ''],
            ['columns.numeric', this.config.columns.numeric.toString()],
            ['columns.textual', this.config.columns.textual.toString()],
        ];
    }

    toMappingDict(): ChronicleDBSourceTypeMappingDict {
        return this.config;
    }

    toDict(): ChronicleDBSourceTypeDict {
        return {
            operatorType: ChronicleDBSourceType.TYPE,
            ...this.config,
        };
    }

    cloneWithModifications(options?: OperatorTypeCloneOptions): OperatorType {
        return new ChronicleDBSourceType(this.config);
    }
}
