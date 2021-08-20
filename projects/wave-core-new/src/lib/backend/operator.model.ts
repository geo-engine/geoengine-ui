import {MeasurementDict, OperatorDict, OperatorParams, SourceOperatorDict, SrsString} from './backend.model';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface EmptyParams extends OperatorParams {
    [index: string]: undefined;
}

export interface ExpressionDict extends OperatorDict {
    type: 'Expression';
    params: {
        expression: string;
        outputType: string;
        outputNoDataValue: number | 'nan';
        outputMeasurement?: MeasurementDict;
    };
    sources: {
        a: OperatorDict | SourceOperatorDict;
        b?: OperatorDict | SourceOperatorDict;
        c?: OperatorDict | SourceOperatorDict;
    };
}

export interface FeatureAttributeOverTimeDict extends OperatorDict {
    type: 'FeatureAttributeValuesOverTime';
    params: {
        idColumn: string;
        valueColumn: string;
    };
    sources: {
        vector: OperatorDict | SourceOperatorDict;
    };
}

export interface HistogramParams extends OperatorParams {
    columnName?: string;
    bounds:
        | {
              min: number;
              max: number;
          }
        | 'data';
    buckets?: number;
    interactive?: boolean;
}

export interface HistogramDict extends OperatorDict {
    type: 'Histogram';
    params: HistogramParams;
    sources: {
        source: SourceOperatorDict | OperatorDict;
    };
}

export interface MeanRasterPixelValuesOverTimeParams extends OperatorParams {
    timePosition: 'start' | 'center' | 'end';
    area: boolean;
}

export interface MeanRasterPixelValuesOverTimeDict extends OperatorDict {
    type: 'MeanRasterPixelValuesOverTime';
    params: MeanRasterPixelValuesOverTimeParams;
    sources: {
        raster: SourceOperatorDict | OperatorDict;
    };
}

export interface PointInPolygonFilterDict extends OperatorDict {
    type: 'PointInPolygonFilter';
    params: EmptyParams;
    sources: {
        points: SourceOperatorDict | OperatorDict;
        polygons: SourceOperatorDict | OperatorDict;
    };
}

export interface RasterVectorJoinParams extends OperatorParams {
    names: Array<string>;
    temporalAggregation: 'none' | 'first' | 'mean';
    featureAggregation: 'first' | 'mean';
}

export interface RasterVectorJoinDict extends OperatorDict {
    type: 'RasterVectorJoin';
    params: RasterVectorJoinParams;
    sources: {
        vector: SourceOperatorDict | OperatorDict;
        rasters: Array<SourceOperatorDict | OperatorDict>;
    };
}

export interface ReprojectionDict extends OperatorDict {
    type: 'Reprojection';
    params: {
        targetSpatialReference: SrsString;
    };
    sources: {
        source: SourceOperatorDict | OperatorDict;
    };
}

export interface StatisticsDict extends OperatorDict {
    type: 'Statistics';
    params: EmptyParams;
    sources: {
        rasters: Array<SourceOperatorDict | OperatorDict>;
    };
}

export interface TemporalRasterAggregationDict extends OperatorDict {
    type: 'TemporalRasterAggregation';
    params: {
        aggregation: {
            type: 'min' | 'max' | 'first' | 'last';
            ignoreNoData?: boolean;
        };
        window: {
            granularity: 'Millis' | 'Seconds' | 'Minutes' | 'Hours' | 'Days' | 'Months' | 'Years';
            step: number;
        };
    };
}

export interface VisualPointClusteringParams extends OperatorParams {
    minRadiusPx: number;
    deltaPx: number;
    radiusColumn: string;
    countColumn: string;
}
