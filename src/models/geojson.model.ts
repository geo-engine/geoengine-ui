export interface GeoJsonFeatureCollection extends JSON {
    type: string;
    features: [ GeoJsonFeature ];
}

export interface GeoJsonFeature {
    id?: string;
    type: string;
    geometry: GeoJsonGeometry;
    properties?: { [key: string]: string | number } ;
}

export interface GeoJsonGeometry {
    type: string;
    coordinates: [number, number] | Array<[number, number]>;
}
