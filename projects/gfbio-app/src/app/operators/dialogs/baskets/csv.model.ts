export interface BasicColumns {
    numeric: Array<string>;
    textual: Array<string>;
}

export interface CsvColumns extends BasicColumns {
    x?: string;
    y?: string;
    time1?: string;
    time2?: string;
}

export type CsvTimeType = 'custom' | 'seconds' | 'dmyhm' | 'iso';

export interface CsvTimeFormat {
    format: CsvTimeType;
}

export type CsvErrorCase = 'skip' | 'abort' | 'keep';

export interface CsvParameters {
    separator?: string;
    on_error?: CsvErrorCase;
    geometry: string;
    time: 'none' | 'start' | 'start+end' | 'start+duration';
    time1_format?: CsvTimeFormat;
    time2_format?: CsvTimeFormat;
    duration?: number;
    columns: CsvColumns;
}

export interface Csv {
    name: string;
    params: CsvParameters;
    geometry_type?: 'points' | 'lines' | 'polygons';
}

export interface CsvColumn {
    name: string;
    numeric: boolean;
    unit: string;
}

export interface CsvFile extends Csv {
    filename: string;
}
