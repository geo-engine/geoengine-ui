import {
    DataIdDict,
    MeasurementDict,
    OperatorDict,
    OperatorParams,
    SourceOperatorDict,
    SrsString,
    TimeInstanceDict,
    TimeStepDict,
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
        outputNoDataValue: number | 'nan';
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

export interface ColumnRangeFilterDict extends OperatorDict {
    type: 'ColumnRangeFilter',
    params: {
        column: string,
        ranges: number[],
    }
    sources: {
        points: SourceOperatorDict | OperatorDict; // ok ... ?
    }
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
        window: TimeStepDict;
        windowReference?: TimeInstanceDict;
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
