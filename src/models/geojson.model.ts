export interface GeoJsonFeatureCollection {
    type: string;
    features: [ GeoJsonFeature ];
}

export interface GeoJsonFeature {
    id?: string;
    type: string;
    geometry: GeoJsonGeometry;
    properties?: {};
}

export interface GeoJsonGeometry {
    type: string;
    coordinates: any;
}
