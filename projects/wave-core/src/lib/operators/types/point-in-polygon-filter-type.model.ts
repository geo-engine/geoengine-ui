import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict} from '../operator-type.model';

interface PointInPolygonFilterTypeMappingDict extends OperatorTypeMappingDict {}

export interface PointInPolygonFilterTypeDict extends OperatorTypeDict {}

interface PointInPolygonFilterTypeConfig {}

/**
 * The Point in Polygon Filter type.
 */
export class PointInPolygonFilterType extends OperatorType {
    private static _TYPE = 'point_in_polygon_filter';
    private static _ICON_URL = OperatorType.createIconDataUrl(PointInPolygonFilterType._TYPE);
    private static _NAME = 'Point in Polygon Filter';

    static get TYPE(): string { return PointInPolygonFilterType._TYPE; }
    static get ICON_URL(): string { return PointInPolygonFilterType._ICON_URL; }
    static get NAME(): string { return PointInPolygonFilterType._NAME; }

    constructor(config: PointInPolygonFilterTypeConfig) {
        super();
    }

    static fromDict(dict: PointInPolygonFilterTypeDict): PointInPolygonFilterType {
        return new PointInPolygonFilterType({});
    }

    getMappingName(): string {
        return PointInPolygonFilterType.TYPE;
    }

    getIconUrl(): string {
        return PointInPolygonFilterType.ICON_URL;
    }

    toString(): string {
        return PointInPolygonFilterType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [];
    }

    toMappingDict(): PointInPolygonFilterTypeMappingDict {
        return {};
    }

    toDict(): PointInPolygonFilterTypeDict {
        return {
            operatorType: PointInPolygonFilterType.TYPE,
        };
    }

    cloneWithModifications(options?: {}): OperatorType {
        return PointInPolygonFilterType.fromDict(this.toDict()); // TODO: add modifications
    }

}
