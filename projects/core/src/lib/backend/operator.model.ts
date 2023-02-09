import {
    DataIdDict,
    MeasurementDict,
    OperatorDict,
    OperatorParams,
    SourceOperatorDict,
    SrsString,
    TimeInstanceDict,
    TimeIntervalDict,
    TimeStepDict,
    TimeStepGranularityDict,
} from './backend.model';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface EmptyParams extends OperatorParams {
    [index: string]: undefined;
}

export interface ExpressionDict extends OperatorDict {
    type: 'Expression';
    params: {
        expression: string;
        outputType: string;
        outputMeasurement?: MeasurementDict;
        mapNoData: boolean;
    };
    sources: {
        a: OperatorDict | SourceOperatorDict;
        b?: OperatorDict | SourceOperatorDict;
        c?: OperatorDict | SourceOperatorDict;
        d?: OperatorDict | SourceOperatorDict;
        e?: OperatorDict | SourceOperatorDict;
        f?: OperatorDict | SourceOperatorDict;
        g?: OperatorDict | SourceOperatorDict;
        h?: OperatorDict | SourceOperatorDict;
    };
}

export interface NeighborhoodAggregateDict extends OperatorDict {
    type: 'NeighborhoodAggregate';
    params: {
        neighborhood: {type: 'weightsMatrix'; weights: Array<Array<number>>} | {type: 'rectangle'; dimensions: [number, number]};
        aggregateFunction: 'sum' | 'standardDeviation';
    };
    sources: {
        raster: SourceOperatorDict | OperatorDict;
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

export interface PieChartDict extends OperatorDict {
    type: 'PieChart';
    params: PieChartCountParams;
    sources: {
        vector: SourceOperatorDict | OperatorDict;
    };
}

export interface PieChartCountParams extends OperatorParams {
    type: 'count';
    columnName: string;
    donut?: boolean;
}

export interface ClassHistogramParams extends OperatorParams {
    columnName?: string;
}

export interface ClassHistogramDict extends OperatorDict {
    type: 'ClassHistogram';
    params: ClassHistogramParams;
    sources: {
        source: SourceOperatorDict | OperatorDict;
    };
}

export interface BoxPlotParams extends OperatorParams {
    columnNames: Array<string>;
    includeNoData: boolean;
}

export interface BoxPlotDict extends OperatorDict {
    type: 'BoxPlot';
    params: BoxPlotParams;
    sources: {
        source: SourceOperatorDict | OperatorDict | Array<SourceOperatorDict | OperatorDict>;
    };
}

export interface ScatterPlotParams extends OperatorParams {
    columnX: string;
    columnY: string;
}

export interface ScatterPlotDict extends OperatorDict {
    type: 'ScatterPlot';
    params: ScatterPlotParams;
    sources: {
        vector: SourceOperatorDict | OperatorDict;
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

export interface RasterizationDict extends OperatorDict {
    type: 'Rasterization';
    params: GridRasterizationDict | DensityRasterizationDict;
    sources: {
        vector: SourceOperatorDict | OperatorDict;
    };
}

export interface GridRasterizationDict extends OperatorParams {
    type: 'grid';
    spatialResolution: {
        x: number;
        y: number;
    };
    originCoordinate: {
        x: number;
        y: number;
    };
    gridSizeMode: 'fixed' | 'relative';
}

export interface DensityRasterizationDict extends OperatorParams {
    type: 'density';
    cutoff: number;
    stddev: number;
}

export interface ColumnRangeFilterDict extends OperatorDict {
    type: 'ColumnRangeFilter';
    params: {
        column: string;
        ranges: Array<number[]> | Array<string[]>;
        keepNulls: boolean;
    };
    sources: {
        vector: SourceOperatorDict | OperatorDict;
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

export interface StatisticsParams extends OperatorParams {
    columnNames: Array<string>;
}

export interface StatisticsDict extends OperatorDict {
    type: 'Statistics';
    params: StatisticsParams;
    sources: {
        source: SourceOperatorDict | OperatorDict | Array<SourceOperatorDict | OperatorDict>;
    };
}

export interface TemporalRasterAggregationDict extends OperatorDict {
    type: 'TemporalRasterAggregation';
    params: {
        aggregation: {
            type: TemporalRasterAggregationDictAgregationType;
            ignoreNoData?: boolean;
        };
        window: TimeStepDict;
        windowReference?: TimeInstanceDict;
        outputType?: 'U8' | 'U16' | 'U32' | 'U64' | 'I8' | 'I16' | 'I32' | 'I64' | 'F32' | 'F64';
    };
}

export type TemporalRasterAggregationDictAgregationType = 'min' | 'max' | 'first' | 'last' | 'mean' | 'sum' | 'count';

export interface RasterTypeConversionDict extends OperatorDict {
    type: 'RasterTypeConversion';
    params: {
        outputDataType: string;
    };
}

export interface VisualPointClusteringParams extends OperatorParams {
    minRadiusPx: number;
    deltaPx: number;
    radiusColumn: string;
    countColumn: string;
    columnAggregates: {
        [columnName: string]: {
            columnName: string;
            aggregateType: 'meanNumber' | 'stringSample' | 'null';
        };
    };
}

export interface OgrSourceDict extends SourceOperatorDict {
    type: 'OgrSource';
    params: {
        data: DataIdDict;
        attributeProjection?: Array<string>;
        attributeFilters?: Array<AttributeFilterDict>;
    };
}

export interface AttributeFilterDict {
    attribute: string;
    ranges: Array<[number, number] | [string, string]>;
    keepNulls?: boolean;
}

export interface TimeProjectionDict extends OperatorDict {
    type: 'TimeProjection';
    params: {
        step: TimeStepDict;
        stepReference?: TimeInstanceDict;
    };
}

export interface TimeShiftDict extends OperatorDict {
    type: 'TimeShift';
    params: AbsoluteTimeShiftDictParams | RelativeTimeShiftDictParams;
}

export interface AbsoluteTimeShiftDictParams extends OperatorParams {
    type: 'absolute';
    timeInterval: TimeIntervalDict;
}

export interface RelativeTimeShiftDictParams extends OperatorParams {
    type: 'relative';
    granularity: TimeStepGranularityDict;
    value: number;
}

export interface InterpolationDict extends OperatorDict {
    type: 'Interpolation';
    params: {
        interpolation: 'nearestNeighbor' | 'bilinear';
        inputResolution: InputResolutionDict;
    };
}

export type InputResolutionDict = {type: 'source'} | {type: 'value'; x: number; y: number};

export interface RasterUnScalingDict extends OperatorDict {
    type: 'RasterScaling';
    params: {
        slope: RasterMetadataKey | {type: 'constant'; value: number} | undefined;
        offset: RasterMetadataKey | {type: 'constant'; value: number} | undefined;
        outputMeasurement?: string;
        scalingMode: 'scale' | 'unscale';
    };
}

export interface RasterMetadataKey {
    type: 'metadataKey';
    domain?: string;
    key: string;
}
