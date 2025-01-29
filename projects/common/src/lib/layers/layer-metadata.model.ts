import {HasLayerType, LayerType} from './layer.model';
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
import {SpatialReference, SrsString} from '../spatial-references/spatial-reference.model';
import {Time} from '../time/time.model';
import {BoundingBox2D} from '../spatial-bounds/bounding-box';
import {
    TypedRasterResultDescriptor as RasterResultDescriptorDict,
    TypedVectorResultDescriptor as VectorResultDescriptorDict,
    SpatialResolution,
    RasterBandDescriptor,
    TypedResultDescriptor,
} from '@geoengine/openapi-client';

export abstract class LayerMetadata implements HasLayerType {
    abstract readonly layerType: LayerType;
    readonly spatialReference: SpatialReference;
    readonly time?: Time;
    readonly bbox?: BoundingBox2D;

    public abstract get resultType(): ResultType;

    constructor(spatialReference: SpatialReference, time?: Time, bbox?: BoundingBox2D) {
        this.spatialReference = spatialReference;
        this.time = time;
        this.bbox = bbox;
    }

    public static fromDict(
        dict: RasterResultDescriptorDict | VectorResultDescriptorDict | TypedResultDescriptor,
    ): RasterLayerMetadata | VectorLayerMetadata {
        switch (dict.type) {
            case 'raster':
                return RasterLayerMetadata.fromDict(dict as RasterResultDescriptorDict);
            case 'vector':
                return VectorLayerMetadata.fromDict(dict as VectorResultDescriptorDict);
            default:
                throw Error(`Unknown result type: ${dict.type}`);
        }
    }
}

export class VectorLayerMetadata extends LayerMetadata {
    readonly layerType = 'vector';

    readonly dataType: VectorDataType;
    readonly dataTypes: Immutable.Map<string, VectorColumnDataType>;
    readonly measurements: Immutable.Map<string, Measurement>;

    constructor(
        dataType: VectorDataType,
        spatialReference: SpatialReference,
        dataTypes: {[index: string]: VectorColumnDataType},
        measurements: {[index: string]: Measurement},
        time?: Time,
        bbox?: BoundingBox2D,
    ) {
        super(spatialReference, time, bbox);

        this.dataType = dataType;
        this.dataTypes = Immutable.Map(Object.entries(dataTypes));
        this.measurements = Immutable.Map(Object.entries(measurements));
    }

    static override fromDict(dict: VectorResultDescriptorDict): VectorLayerMetadata {
        const dataType = VectorDataTypes.fromCode(dict.dataType);

        const columns: {[index: string]: VectorColumnDataType} = {};
        for (const columnName of Object.keys(dict.columns)) {
            columns[columnName] = VectorColumnDataTypes.fromCode(dict.columns[columnName].dataType);
        }

        const measurements: {[index: string]: Measurement} = {};
        for (const columnName of Object.keys(dict.columns)) {
            measurements[columnName] = Measurement.fromDict(dict.columns[columnName].measurement);
        }

        const time = dict.time ? Time.fromDict(dict.time) : undefined;
        const bbox = dict.bbox ? BoundingBox2D.fromDict(dict.bbox) : undefined;

        return new VectorLayerMetadata(dataType, SpatialReference.fromSrsString(dict.spatialReference), columns, measurements, time, bbox);
    }

    public get resultType(): ResultType {
        return this.dataType.resultType;
    }
}

export class RasterLayerMetadata extends LayerMetadata {
    readonly layerType = 'raster';

    readonly dataType: RasterDataType;
    readonly bands: RasterBandDescriptor[];

    readonly resolution?: SpatialResolution;

    constructor(
        dataType: RasterDataType,
        spatialReference: SpatialReference,
        bands: RasterBandDescriptor[],
        time?: Time,
        bbox?: BoundingBox2D,
        resolution?: SpatialResolution,
    ) {
        super(spatialReference, time, bbox);

        this.dataType = dataType;
        this.bands = bands;

        this.resolution = resolution;
    }

    static override fromDict(dict: RasterResultDescriptorDict): RasterLayerMetadata {
        const dataType = RasterDataTypes.fromCode(dict.dataType);
        const bands = dict.bands;
        const time = dict.time ? Time.fromDict(dict.time) : undefined;
        const bbox = dict.bbox ? BoundingBox2D.fromSpatialPartitionDict(dict.bbox) : undefined;

        return new RasterLayerMetadata(
            dataType,
            SpatialReference.fromSrsString(dict.spatialReference),
            bands,
            time,
            bbox,
            dict.resolution ? dict.resolution : undefined,
        );
    }

    public get resultType(): ResultType {
        return ResultTypes.RASTER;
    }
}
