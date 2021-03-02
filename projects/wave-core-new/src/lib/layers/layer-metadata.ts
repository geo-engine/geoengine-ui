import { HasLayerType, LayerType } from './layer.model';
import { RasterResultDescriptorDict, VectorResultDescriptorDict } from '../backend/backend.model';
import { RasterDataType, RasterDataTypes, VectorColumnDataType, VectorColumnDataTypes, VectorDataType, VectorDataTypes } from '../operators/datatype.model';
import * as Immutable from 'immutable';
import { Measurement } from './measurement';
import { ResultType, ResultTypes } from '../operators/result-type.model';

export abstract class LayerMetadata implements HasLayerType {
    readonly abstract layerType: LayerType;

    public abstract isOfResultType(resultType: ResultType);
}

export class VectorLayerMetadata extends LayerMetadata {
    readonly layerType = 'vector';

    readonly dataType: VectorDataType;
    readonly columns: Immutable.Map<string, VectorColumnDataType>;

    constructor(dataType: VectorDataType, columns: { [index: string]: VectorColumnDataType }) {
        super();

        this.dataType = dataType;
        this.columns = Immutable.Map(columns);
    }

    static fromDict(dict: VectorResultDescriptorDict): VectorLayerMetadata {
        const dataType = VectorDataTypes.fromCode(dict.data_type);

        const columns: { [index: string]: VectorColumnDataType } = {};
        for (const columnName of Object.keys(dict.columns)) {
            columns[columnName] = VectorColumnDataTypes.fromCode(dict.columns[columnName]);
        }

        return new VectorLayerMetadata(dataType, columns);
    }

    public isOfResultType(resultType: ResultType): boolean {
        return this.dataType.toResultType() === resultType;
    }
}

export class RasterLayerMetadata extends LayerMetadata {
    readonly layerType = 'raster';

    readonly dataType: RasterDataType;
    readonly measurement: Measurement;

    constructor(dataType: RasterDataType, measurement: Measurement) {
        super();

        this.dataType = dataType;
        this.measurement = measurement;
    }

    static fromDict(dict: RasterResultDescriptorDict): RasterLayerMetadata {
        const dataType = RasterDataTypes.fromCode(dict.data_type);
        const measurement = Measurement.fromDict(dict.measurement);

        return new RasterLayerMetadata(dataType, measurement);
    }

    public isOfResultType(resultType: ResultType) {
        return resultType == ResultTypes.RASTER;
    }
}
