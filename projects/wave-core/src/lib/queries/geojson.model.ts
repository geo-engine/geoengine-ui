export type FeatureID = string | number;

export interface GeoJsonFeatureCollection extends JSON {
    type: string;
    features: Array<GeoJsonFeature>;
}

export interface GeoJsonFeature {
    id?: FeatureID;
    type: string;
    geometry: GeoJsonGeometry;
    properties?: {[key: string]: string | number};
}

export interface GeoJsonGeometry {
    type: string;
    coordinates: [number, number] | Array<[number, number]>;
}
