import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict} from '../operator-type.model';

interface HeatmapTypeConfig {
    attribute: string;
    radius: number;
}

interface HeatmapTypeMappingDict extends OperatorTypeMappingDict {
    attribute: string;
    radius: number;
}

export interface HeatmapTypeDict extends OperatorTypeDict {
    attribute: string;
    radius: number;
}

/**
 * The heatmap type.
 */
export class HeatmapType extends OperatorType {
    private static _TYPE = 'rasterization';
    private static _ICON_URL = OperatorType.createIconDataUrl(HeatmapType._TYPE);
    private static _NAME = 'Heatmap';

    private attribute: string;
    private radius: number;

    static fromDict(dict: HeatmapTypeDict): HeatmapType {
        return new HeatmapType({
            attribute: dict.attribute,
            radius: dict.radius,
        });
    }

    constructor(config: HeatmapTypeConfig) {
        super();
        this.attribute = config.attribute;
        this.radius = config.radius;
    }

    static get TYPE(): string {
        return HeatmapType._TYPE;
    }

    static get ICON_URL(): string {
        return HeatmapType._ICON_URL;
    }

    static get NAME(): string {
        return HeatmapType._NAME;
    }

    getMappingName(): string {
        return HeatmapType.TYPE;
    }

    getIconUrl(): string {
        return HeatmapType.ICON_URL;
    }

    toString(): string {
        return HeatmapType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [
            ['attribute', this.attribute.toString()],
            ['radius', this.radius.toString()],
        ];
    }

    toMappingDict(): HeatmapTypeMappingDict {
        return {
            attribute: this.attribute,
            radius: this.radius,
        };
    }

    toDict(): HeatmapTypeDict {
        return {
            operatorType: HeatmapType.TYPE,
            attribute: this.attribute,
            radius: this.radius,
        };
    }

}
