import {SpatialReferenceSpecificationDict, SrsString} from '../backend/backend.model';

export class SpatialReferenceSpecification {
    readonly name: string;
    readonly spatialReference: SpatialReference;
    readonly projString: string;
    readonly extent: [number, number, number, number];
    readonly axisLabels?: [string, string];

    constructor(dict: SpatialReferenceSpecificationDict) {
        this.name = dict.name;
        this.spatialReference = SpatialReference.fromSrsString(dict.spatialReference);
        this.projString = dict.projString;
        this.extent = [
            dict.extent.lowerLeftCoordinate.x,
            dict.extent.lowerLeftCoordinate.y,
            dict.extent.upperRightCoordinate.x,
            dict.extent.upperRightCoordinate.y,
        ];
        this.axisLabels = dict.axisLabels;
    }

    static fromDict(dict: SpatialReferenceSpecificationDict): SpatialReferenceSpecification {
        return new SpatialReferenceSpecification(dict);
    }
}

export class SpatialReference {
    readonly srsString: SrsString;

    constructor(srsString: SrsString) {
        this.srsString = srsString;
    }

    static fromSrsString(srsString: SrsString): SpatialReference {
        return new SpatialReference(srsString);
    }
}

export class NamedSpatialReference {
    readonly name: string;
    readonly spatialReference: SpatialReference;

    constructor(name: string, srsString: SrsString) {
        this.name = name;
        this.spatialReference = SpatialReference.fromSrsString(srsString);
    }
}

export const WGS_84 = new NamedSpatialReference('WGS84', 'EPSG:4326');
export const WEB_MERCATOR = new NamedSpatialReference('WGS84 Webmercator', 'EPSG:3857');

export const UTM32N = new NamedSpatialReference('WGS 84 / UTM 32 N', 'EPSG:32632');
export const UTM36S = new NamedSpatialReference('WGS 84 / UTM 36 S', 'EPSG:32736');
export const WELL_KNOWN_SPATAL_REFERENCES = [WGS_84, WEB_MERCATOR, UTM32N, UTM36S];
