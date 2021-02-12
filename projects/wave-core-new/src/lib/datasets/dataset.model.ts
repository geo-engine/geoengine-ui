import {UUID} from '../backend/backend.model';
import {SpatialReference} from '../operators/spatial-reference.model';
import {DataType} from '../operators/datatype.model';

export interface DataSet {
    id: InternalDataSetId; // TODO: support all Id types
    name: string;
    description: string;
    result_descriptor: ResultDescriptor;
    source_operator: string;
}

export interface InternalDataSetId {
    Internal: UUID;
}

export interface ResultDescriptor {
    Vector?: {
        data_type: 'Data' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon';
        spatial_reference: SpatialReference;
        columns: { [key: string]: string}
    };
    Raster?: {
        data_type: DataType;
        spatial_reference: SpatialReference;
    };
}

export function getDataSetType(dataSet: DataSet): 'Raster' | 'Vector' {
    if ('Raster' in dataSet.result_descriptor) {
        return 'Raster';
    } else {
        return 'Vector';
    }
}
