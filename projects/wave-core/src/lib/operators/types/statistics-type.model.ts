import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict} from '../operator-type.model';

interface StatisticsTypeMappingDict extends OperatorTypeMappingDict {
    raster_width?: number;
    raster_height?: number;
}

export interface StatisticsTypeDict extends OperatorTypeDict {
    raster_width?: number;
    raster_height?: number;
}

/**
 * If the statistic is for a raster value, it is necessary to specify
 * query resolutions (in pixels) on which the statistics are calculated.
 */
interface StatisticsTypeConfig {
    raster_width?: number;
    raster_height?: number;
}

/**
 * The layer statistics type.
 */
export class StatisticsType extends OperatorType {
    private static _TYPE = 'statistics';
    private static _ICON_URL = OperatorType.createIconDataUrl(StatisticsType._TYPE);
    private static _NAME = 'Layer Statistics';

    static get TYPE(): string {
        return StatisticsType._TYPE;
    }

    static get ICON_URL(): string {
        return StatisticsType._ICON_URL;
    }

    static get NAME(): string {
        return StatisticsType._NAME;
    }

    private raster_width: number;
    private raster_height: number;

    constructor(config: StatisticsTypeConfig) {
        super();
        this.raster_width = config.raster_width ? config.raster_width : undefined;
        this.raster_height = config.raster_height ? config.raster_height : undefined;
    }

    static fromDict(dict: StatisticsTypeDict): StatisticsType {
        return new StatisticsType(dict);
    }

    getMappingName(): string {
        return StatisticsType.TYPE;
    }

    getIconUrl(): string {
        return StatisticsType.ICON_URL;
    }

    toString(): string {
        return StatisticsType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [
            ['raster_width', this.raster_width.toString()],
            ['raster_height', this.raster_height.toString()],
        ];
    }

    toMappingDict(): StatisticsTypeMappingDict {
        if (this.raster_width || this.raster_height) {
            return {
                raster_height: this.raster_height,
                raster_width: this.raster_width,
            };
        }

        return {};
    }

    toDict(): StatisticsTypeDict {
        if (this.raster_width || this.raster_height) {
            return {
                operatorType: StatisticsType.TYPE,
                raster_height: this.raster_height,
                raster_width: this.raster_width,
            };
        }

        return {
            operatorType: StatisticsType.TYPE,
        };
    }

    cloneWithModifications(options?: {}): OperatorType {
        return StatisticsType.fromDict(this.toDict()); // TODO: add modifications
    }
}
