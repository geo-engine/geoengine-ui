import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict} from '../operator-type.model';

interface RasterValueExtractionTypeMappingDict extends OperatorTypeMappingDict {
    xResolution: number;
    yResolution: number;
    names: Array<string>;
}

export interface RasterValueExtractionTypeDict extends OperatorTypeDict {
    xResolution: number;
    yResolution: number;
    attributeNames: Array<string>;
}

interface RasterValueExtractionTypeConfig {
    xResolution: number;
    yResolution: number;
    attributeNames: Array<string>;
}

/**
 * The raster value extraction type.
 */
export class RasterValueExtractionType extends OperatorType {
    private static _TYPE = 'raster_value_extraction';
    private static _ICON_URL = OperatorType.createIconDataUrl(RasterValueExtractionType._TYPE);
    private static _NAME = 'Raster Value Extraction';

    static get TYPE(): string {
        return RasterValueExtractionType._TYPE;
    }
    static get ICON_URL(): string {
        return RasterValueExtractionType._ICON_URL;
    }
    static get NAME(): string {
        return RasterValueExtractionType._NAME;
    }

    private xResolution: number;
    private yResolution: number;
    private attributeNames: Array<string>;

    constructor(config: RasterValueExtractionTypeConfig) {
        super();
        this.xResolution = config.xResolution;
        this.yResolution = config.yResolution;
        this.attributeNames = config.attributeNames;
    }

    static fromDict(dict: RasterValueExtractionTypeDict): RasterValueExtractionType {
        return new RasterValueExtractionType(dict);
    }

    getMappingName(): string {
        return RasterValueExtractionType.TYPE;
    }

    getIconUrl(): string {
        return RasterValueExtractionType.ICON_URL;
    }

    toString(): string {
        return RasterValueExtractionType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [
            ['xResolution', this.xResolution.toString()],
            ['yResolution', this.yResolution.toString()],
            ['attributeNames', this.attributeNames.join(', ')],
        ];
    }

    toMappingDict(): RasterValueExtractionTypeMappingDict {
        return {
            xResolution: this.xResolution,
            yResolution: this.yResolution,
            names: this.attributeNames,
        };
    }

    toDict(): RasterValueExtractionTypeDict {
        return {
            operatorType: RasterValueExtractionType.TYPE,
            xResolution: this.xResolution,
            yResolution: this.yResolution,
            attributeNames: this.attributeNames,
        };
    }

    cloneWithModifications(options?: {}): OperatorType {
        return RasterValueExtractionType.fromDict(this.toDict()); // TODO: add modifications
    }
}
