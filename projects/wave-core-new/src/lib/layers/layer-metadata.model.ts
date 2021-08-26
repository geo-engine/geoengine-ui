import {HasLayerType, LayerType} from './layer.model';
import {RasterResultDescriptorDict, VectorResultDescriptorDict} from '../backend/backend.model';
import {
    RasterDataType,
    RasterDataTypes,
    VectorColumnDataType,
    VectorColumnDataTypes,
    VectorDataType,
    VectorDataTypes,
} from '../operators/datatype.model';
import * as Immutable from 'immutable';
import {Measurement} from './measurement';
import {ResultType, ResultTypes} from '../operators/result-type.model';
import {SpatialReference} from '../spatial-references/spatial-reference.model';

export abstract class LayerMetadata implements HasLayerType {
    abstract readonly layerType: LayerType;
    readonly spatialReference: SpatialReference;

    public abstract get resultType(): ResultType;

    constructor(spatialReference: SpatialReference) {
        this.spatialReference = spatialReference;
    }
}

export class VectorLayerMetadata extends LayerMetadata {
    readonly layerType = 'vector';

    readonly dataType: VectorDataType;
    readonly columns: Immutable.Map<string, VectorColumnDataType>;

    constructor(dataType: VectorDataType, spatialReference: SpatialReference, columns: {[index: string]: VectorColumnDataType}) {
        super(spatialReference);

        this.dataType = dataType;
        this.columns = Immutable.Map(columns);
    }

    static fromDict(dict: VectorResultDescriptorDict): VectorLayerMetadata {
        const dataType = VectorDataTypes.fromCode(dict.dataType);

        const columns: {[index: string]: VectorColumnDataType} = {};
        for (const columnName of Object.keys(dict.columns)) {
            columns[columnName] = VectorColumnDataTypes.fromCode(dict.columns[columnName]);
        }

        return new VectorLayerMetadata(dataType, SpatialReference.fromSrsString(dict.spatialReference), columns);
    }

    public get resultType(): ResultType {
        return this.dataType.resultType;
    }
}

export class RasterLayerMetadata extends LayerMetadata {
    readonly layerType = 'raster';

    readonly dataType: RasterDataType;
    readonly measurement: Measurement;

    constructor(dataType: RasterDataType, spatialReference: SpatialReference, measurement: Measurement) {
        super(spatialReference);

        this.dataType = dataType;
        this.measurement = measurement;
    }

    static fromDict(dict: RasterResultDescriptorDict): RasterLayerMetadata {
        const dataType = RasterDataTypes.fromCode(dict.dataType);
        const measurement = Measurement.fromDict(dict.measurement);

        return new RasterLayerMetadata(dataType, SpatialReference.fromSrsString(dict.spatialReference), measurement);
    }

    public get resultType(): ResultType {
        return ResultTypes.RASTER;
    }
}
