import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict} from '../operator-type.model';

interface RgbaCompositeTypeConfig {
    rasterRedMin: number,
    rasterRedMax: number,
    rasterRedScale: number,
    rasterGreenMin: number,
    rasterGreenMax: number,
    rasterGreenScale: number,
    rasterBlueMin: number,
    rasterBlueMax: number,
    rasterBlueScale: number,
}

interface RgbaCompositeTypeMappingDict extends OperatorTypeMappingDict {
    raster_r_min: number,
    raster_r_max: number,
    raster_r_scale: number,
    raster_g_min: number,
    raster_g_max: number,
    raster_g_scale: number,
    raster_b_min: number,
    raster_b_max: number,
    raster_b_scale: number,
}

export interface RgbaCompositeTypeDict extends OperatorTypeDict {
    rasterRedMin: number,
    rasterRedMax: number,
    rasterRedScale: number,
    rasterGreenMin: number,
    rasterGreenMax: number,
    rasterGreenScale: number,
    rasterBlueMin: number,
    rasterBlueMax: number,
    rasterBlueScale: number,
}

/**
 * The RGBA composite type.
 */
export class RgbaCompositeType extends OperatorType {
    private static _TYPE = 'rgba_composite';
    private static _ICON_URL = OperatorType.createIconDataUrl(RgbaCompositeType._TYPE);
    private static _NAME = 'RGBA Composite';

    static get TYPE(): string {
        return RgbaCompositeType._TYPE;
    }

    static get ICON_URL(): string {
        return RgbaCompositeType._ICON_URL;
    }

    static get NAME(): string {
        return RgbaCompositeType._NAME;
    }

    readonly rasterRedMin: number;
    readonly rasterRedMax: number;
    readonly rasterRedScale: number;
    readonly rasterGreenMin: number;
    readonly rasterGreenMax: number;
    readonly rasterGreenScale: number;
    readonly rasterBlueMin: number;
    readonly rasterBlueMax: number;
    readonly rasterBlueScale: number;

    constructor(config: RgbaCompositeTypeConfig) {
        super();
        this.rasterRedMin = config.rasterRedMin;
        this.rasterRedMax = config.rasterRedMax;
        this.rasterRedScale = config.rasterRedScale;
        this.rasterGreenMin = config.rasterGreenMin;
        this.rasterGreenMax = config.rasterGreenMax;
        this.rasterGreenScale = config.rasterGreenScale;
        this.rasterBlueMin = config.rasterBlueMin;
        this.rasterBlueMax = config.rasterBlueMax;
        this.rasterBlueScale = config.rasterBlueScale;
    }

    static fromDict(dict: RgbaCompositeTypeDict): RgbaCompositeType {
        return new RgbaCompositeType({
            rasterRedMin: dict.rasterRedMin,
            rasterRedMax: dict.rasterRedMax,
            rasterRedScale: dict.rasterRedScale,
            rasterGreenMin: dict.rasterGreenMin,
            rasterGreenMax: dict.rasterGreenMax,
            rasterGreenScale: dict.rasterGreenScale,
            rasterBlueMin: dict.rasterBlueMin,
            rasterBlueMax: dict.rasterBlueMax,
            rasterBlueScale: dict.rasterBlueScale,
        });
    }

    getMappingName(): string {
        return RgbaCompositeType.TYPE;
    }

    getIconUrl(): string {
        return RgbaCompositeType.ICON_URL;
    }

    toString(): string {
        return RgbaCompositeType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [
            ['rasterRedMin', this.rasterRedMin.toString()],
            ['rasterRedMax', this.rasterRedMax.toString()],
            ['rasterRedScale', this.rasterRedScale.toString()],
            ['rasterGreenMin', this.rasterGreenMin.toString()],
            ['rasterGreenMax', this.rasterGreenMax.toString()],
            ['rasterGreenScale', this.rasterGreenScale.toString()],
            ['rasterBlueMin', this.rasterBlueMin.toString()],
            ['rasterBlueMax', this.rasterBlueMax.toString()],
            ['rasterBlueScale', this.rasterBlueScale.toString()],
        ];
    }

    toMappingDict(): RgbaCompositeTypeMappingDict {
        return {
            raster_r_min: this.rasterRedMin,
            raster_r_max: this.rasterRedMax,
            raster_r_scale: this.rasterRedScale,
            raster_g_min: this.rasterGreenMin,
            raster_g_max: this.rasterGreenMax,
            raster_g_scale: this.rasterGreenScale,
            raster_b_min: this.rasterBlueMin,
            raster_b_max: this.rasterBlueMax,
            raster_b_scale: this.rasterBlueScale,
        };
    }

    toDict(): RgbaCompositeTypeDict {
        return {
            operatorType: RgbaCompositeType.TYPE,
            rasterRedMin: this.rasterRedMin,
            rasterRedMax: this.rasterRedMax,
            rasterRedScale: this.rasterRedScale,
            rasterGreenMin: this.rasterGreenMin,
            rasterGreenMax: this.rasterGreenMax,
            rasterGreenScale: this.rasterGreenScale,
            rasterBlueMin: this.rasterBlueMin,
            rasterBlueMax: this.rasterBlueMax,
            rasterBlueScale: this.rasterBlueScale,
        };
    }

}
