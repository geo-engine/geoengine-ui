import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict} from '../operator-type.model';

interface CSVTimeFormat {
    format: 'custom' | 'seconds' | 'dmyhm' | 'iso';
    customFormat?: string;
}

export interface CSVParameters {
    fieldSeparator: string;
    geometry: 'xy' | 'wkt';
    time: 'none' | {use: 'start', duration: number} | 'start+inf' | 'start+end' | 'start+duration';
    timeFormat?: {
        time1?: CSVTimeFormat;
        time2?: CSVTimeFormat;
    };
    header: 0 | Array<string>;
    columns: {
        x: string;
        y?: string;
        time1?: string;
        time2?: string;
        numeric: Array<string>;
        textual: Array<string>;
    };
    onError: 'skip' | 'abort' | 'keep';
    provenance?: {
        citation: string;
        license: string;
        uri: string;
    };
}

interface CsvSourceTypeConfig {
    dataURI: string;
    parameters: CSVParameters;
}

interface MappingTimeFormat {
    format: 'custom' | 'seconds' | 'dmyhm' | 'iso';
    custom_format?: string;
}
interface CsvSourceTypeMappingDict extends OperatorTypeMappingDict {
    filename: string;
    separator: string;
    geometry: 'xy' | 'wkt';
    time: 'none' | 'start' | 'start+end' | 'start+duration';
    duration?: number | 'inf';
    time1_format?: MappingTimeFormat;
    time2_format?: MappingTimeFormat;
    columns: {
        x: string;
        y?: string;
        time1?: string;
        time2?: string;
        numeric: Array<string>;
        textual: Array<string>;
    };
    on_error: 'skip' | 'abort' | 'keep';
    provenance?: {
        citation: string;
        license: string;
        uri: string;
    };
}

export interface CsvSourceTypeDict extends OperatorTypeDict {
    dataURI: string;
    parameters: CSVParameters;
}

/**
 * The CSV source type.
 */
export class CsvSourceType extends OperatorType {
    private static _TYPE = 'csv_source';
    private static _ICON_URL = OperatorType.createIconDataUrl(CsvSourceType._TYPE);
    private static _NAME = 'CSV Source';

    static get TYPE(): string {
        return CsvSourceType._TYPE;
    }

    static get ICON_URL(): string {
        return CsvSourceType._ICON_URL;
    }

    static get NAME(): string {
        return CsvSourceType._NAME;
    }

    private dataURI: string;
    private parameters: CSVParameters;

    static fromDict(dict: CsvSourceTypeDict): CsvSourceType {
        return new CsvSourceType({
            dataURI: dict.dataURI,
            parameters: dict.parameters,
        });
    }

    constructor(config: CsvSourceTypeConfig) {
        super();
        this.dataURI = config.dataURI;
        this.parameters = config.parameters;
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
            ['dataURI', this.dataURI],
            ['geometry', this.parameters.geometry],
            ['fieldSeparator', this.parameters.fieldSeparator],
            ['time', (this.parameters.time) ? JSON.stringify(this.parameters.time) : ''],
        ];
    }

    toMappingDict(): CsvSourceTypeMappingDict {
        let data = this.dataURI;
        if (Array.isArray(this.parameters.header)) {
            if (data.indexOf('data:') === 0) {
                const commaPosition = data.indexOf(',');
                const uriPart = data.substring(0, commaPosition + 1);
                const dataPart = data.substring(commaPosition + 1, data.length);

                const headerPart = (this.parameters.header as Array<string>)
                    .join(this.parameters.fieldSeparator) + '\n';

                data = uriPart + headerPart + dataPart;
            }

        }

        let dict: CsvSourceTypeMappingDict = {
            filename: data,
            separator: this.parameters.fieldSeparator,
            geometry: this.parameters.geometry,
            on_error: this.parameters.onError,
            time: 'none',
            columns: {
                x: this.parameters.columns.x,
                numeric: this.parameters.columns.numeric,
                textual: this.parameters.columns.textual,
            },
        };

        if (this.parameters.time === 'start+inf') {
            dict.time = 'start';
            dict.duration = 'inf';
        } else if (typeof this.parameters.time === 'object') {
            const startPlusDuration = this.parameters.time as {use: string, duration: number};
            dict.time = 'start';
            dict.duration = startPlusDuration.duration;
        } else {
            dict.time = this.parameters.time;
        }

        if (this.parameters.time !== 'none') {
            dict.time1_format = {
                format: this.parameters.timeFormat.time1.format,
            };
            if (this.parameters.timeFormat.time1.format === 'custom') {
                dict.time1_format.custom_format = this.parameters.timeFormat.time1.customFormat;
            }

            dict.columns.time1 = this.parameters.columns.time1;

            if (this.parameters.timeFormat.time2) {
                dict.time2_format = {
                    format: this.parameters.timeFormat.time2.format,
                };
                if (this.parameters.timeFormat.time2.format === 'custom') {
                    dict.time2_format.custom_format = this.parameters.timeFormat.time2.customFormat;
                }

                dict.columns.time2 = this.parameters.columns.time2;
            }
        }

        if (this.parameters.geometry !== 'wkt') {
            dict.columns.y = this.parameters.columns.y;
        }

        if (this.parameters.provenance) {
            dict.provenance = this.parameters.provenance;
        }

        return dict;
    }

    toDict(): CsvSourceTypeDict {
        return {
            operatorType: CsvSourceType.TYPE,
            dataURI: this.dataURI,
            parameters: this.parameters,
        };
    }

}
