import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict} from '../operator-type.model';

interface RasterizePolygonTypeMappingDict extends OperatorTypeMappingDict {} // tslint:disable-line:no-empty-interface

export interface RasterizePolygonTypeDict extends OperatorTypeDict  {} // tslint:disable-line:no-empty-interface

interface RasterizePolygonTypeConfig {} // tslint:disable-line:no-empty-interface

/**
 * The raster value extraction type.
 */
export class RasterizePolygonType extends OperatorType {
    private static _TYPE = 'rasterize_polygon';
    private static _ICON_URL = OperatorType.createIconDataUrl(RasterizePolygonType._TYPE);
    private static _NAME = 'Rasterize Polygon';

    static get TYPE(): string { return RasterizePolygonType._TYPE; }
    static get ICON_URL(): string { return RasterizePolygonType._ICON_URL; }
    static get NAME(): string { return RasterizePolygonType._NAME; }

    static fromDict(dict: RasterizePolygonTypeDict): RasterizePolygonType {
        return new RasterizePolygonType(dict);
    }

    constructor(config: RasterizePolygonTypeConfig) {
        super();
    }

    getMappingName(): string {
        return RasterizePolygonType.TYPE;
    }

    getIconUrl(): string {
        return RasterizePolygonType.ICON_URL;
    }

    toString(): string {
        return RasterizePolygonType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [];
    }

    toMappingDict(): RasterizePolygonTypeMappingDict {
        return {};
    }

    toDict(): RasterizePolygonTypeDict {
        return {
            operatorType: RasterizePolygonType.TYPE,
        };
    }

    cloneWithModifications(options?: {}): OperatorType {
        return RasterizePolygonType.fromDict(this.toDict()); // TODO: add modifications
    }
}
