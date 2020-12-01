import {Unit, UnitMappingDict} from '../../unit.model';
import {MappingRasterColorizerDict} from '../../../colors/colorizer-data.model';
import {IColorizerData} from '../../../colors/colorizer-data.model';

/**
 * An interface for transformation of raster layer values.
 */
export interface MappingTransform {
  datatype: string;
  offset: number;
  scale: number;
  unit: Unit;
}

/**
 * An interface for the provenance data provided by MAPPING.
 */
export interface ProvenanceInfo {
    uri: string;
    license: string;
    citation: string;
}

/**
 * An interface for raster layers provided by MAPPING.
 */
export interface SourceRasterLayerDescription {
    name: string;
    id: number;
    datatype: string;
    nodata: number;
    unit: Unit;
    methodology?: MappingRasterMethodology;
    colorizer?: IColorizerData;
    transform: MappingTransform;
    hasTransform: boolean;
    isSwitchable: boolean;
    missingUnit?: boolean;
    coords: {
        crs: string,
        origin: number[],
        scale: number[],
        size: number[],
    };
    provenance: ProvenanceInfo;
    time_start?: string;
    time_end?: string;
}

/**
 * An interface for vector layers provided by MAPPING.
 */
export interface SourceVectorLayerDescription {
    name: string;
    id: number | string;
    title: string;
    geometryType: string; // FIXME: this must be the layer type -> POINT, POLYGON, LINE...
    textual: string[];
    numeric: string[];
    coords: {
        crs: string
    };
    colorizer?: IColorizerData;
    provenance: ProvenanceInfo;
    time_start?: string;
    time_end?: string;
}

/**
 * An interface for a MAPPING source and the provided data.
 */
export interface MappingSource {
    operator: string;
    source: string;
    name: string;
    rasterLayer?: SourceRasterLayerDescription[];
    vectorLayer?: SourceVectorLayerDescription[];
    descriptionText?: string;
    imgUrl?: string;
    tags?: Array<string>;
    provenance: ProvenanceInfo;
    time_start?: string;
    time_end?: string;
}

/**
 * An interface for sources as provided by MAPPING.
 */
export interface MappingSourceDict {
    operator?: string;
    name?: string;
    dataset_name?: string;
    descriptionText?: string;
    imgUrl?: string;
    tags?: string[];
    colorizer?: MappingRasterColorizerDict;
    provenance?: {
        uri: string,
        license: string,
        citation: string,
    };
    coords: {
        crs: string,
        epsg?: number,
        origin?: number[],
        scale?: number[],
        size?: number[],
    };
    channels?: [MappingSourceRasterLayerDict];
    layer?: [MappingSourceVectorLayerDict];
    time_start?: string;
    time_end?: string;
}

/**
 * An interface for raster sources as provided by MAPPING.
 */
export interface MappingSourceRasterLayerDict {
    datatype: string;
    nodata: number;
    name?: string;
    unit?: UnitMappingDict;
    methodology?: MappingRasterMethodology;
    colorizer?: MappingRasterColorizerDict;
    transform?: {
        unit?: UnitMappingDict,
        datatype: string,
        scale: number,
        offset: number,
    };
    coords: {
        crs: string,
        origin: number[],
        scale: number[],
        size: number[],
    };
    provenance?: {
        uri: string,
        license: string,
        citation: string,
    };
    time_start?: string;
    time_end?: string;
}

/**
 * An interface for vector sources as provided by MAPPING.
 */
export interface MappingSourceVectorLayerDict {
    id?: number | string;
    name: string;
    title?: string;
    geometry_type: string; // FIXME: this must be the layer type -> POINT, POLYGON, LINE...
    textual?: string[];
    numeric?: string[];
    coords: {
        crs: string,
    };
    uri?: string;
    license?: string;
    citation?: string;
    provenance?: {
        uri: string,
        license: string,
        citation: string,
    };
    time_start?: string;
    time_end?: string;
}

/**
 * An interface for MAPPING responses when requesting sources.
 */
export interface MappingSourceResponse {
    sourcelist: {[index: string]: MappingSourceDict};
}

/**
 * An interface for raster methodology description.
 */
export interface MappingRasterMethodology {
    type: 'SATELLITE_SENSOR';
}

/**
 * An interface providing information for satellite sensor data.
 */
export interface MappingSatelliteSensorRasterMethodology extends MappingRasterMethodology {
    central_wave_length_nm: number;
}
