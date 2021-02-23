export type UUID = string;
export type TimestampString = string;
export type SrsString = string;

export interface RegistrationDict {
    id: UUID;
}

export interface SessionDict {
    id: UUID;
    user: UserDict;
    created: TimestampString;
    valid_until: TimestampString;
    project?: UUID;
    view?: STRectangleDict;
}

export interface UserDict {
    id: UUID;
    email?: string;
    real_name?: string;
}

export interface CoordinateDict {
    x: number;
    y: number;
}

export interface BBoxDict {
    lower_left_coordinate: CoordinateDict;
    upper_right_coordinate: CoordinateDict;
}

/**
 * UNIX time in Milliseconds
 */
export interface TimeIntervalDict {
    start: number;
    end: number;
}

export interface STRectangleDict {
    spatial_reference: SrsString;
    bounding_box: BBoxDict;
    time_interval: TimeIntervalDict;
}

export interface CreateProjectResponseDict {
    id: UUID;
}

export interface ProjectListingDict {
    id: UUID;
    name: string;
    description: string;
    layer_names: Array<string>;
    changed: TimestampString;
}

export type ProjectPermissionDict = 'Read' | 'Write' | 'Owner';

export type ProjectFilterDict = 'None' | { name: { term: string } } | { description: { term: string } };

export type ProjectOrderByDict = 'DateAsc' | 'DateDesc' | 'NameAsc' | 'NameDesc';

export interface ProjectDict {
    id: UUID;
    version: ProjectVersion;
    name: string;
    description: string;
    layers: Array<LayerDict>;
    plots: Array<PlotDict>;
    bounds: STRectangleDict;
    time_step: TimeStepDict;
}

export interface LayerDict {
    workflow: UUID;
    name: string;
    info: LayerInfoDict;
    visibility: {
        data: boolean,
        legend: boolean,
    };
}

export interface PlotDict {
    workflow: UUID;
    name: string;
}

export interface ProjectVersion {
    id: UUID;
    changed: TimestampString;
    author: UUID;
}

export interface ColorizerDict {
    LinearGradient?: {
        breakpoints: Array<BreakpointDict>,
        no_data_color: RgbaColor,
        default_color: RgbaColor,
    };
    LogarithmicGradient?: {
        breakpoints: Array<BreakpointDict>,
        no_data_color: RgbaColor,
        default_color: RgbaColor,
    };
    Palette?: {
        colors: { [index: number]: RgbaColor },
        no_data_color: string,
    };
    Rgba?: {};
}

export type RgbaColor = [number, number, number, number];

export interface LayerInfoDict {
    Raster?: {
        colorizer: ColorizerDict,
    };
    Vector?: {};
}

export interface BreakpointDict {
    value: number;
    color: RgbaColor;
}

export interface ErrorDict {
    error: string;
    message: string;
}

export interface ToDict<T> {
    toDict(): T;
}

export interface RegisterWorkflowResultDict {
    id: UUID;
}

export interface WorkflowDict {
    type: 'Vector' | 'Raster' | 'Plot';
    operator: OperatorDict | SourceOperatorDict;
}

export interface OperatorDict {
    type: string;
    params: OperatorParams;
    vector_sources?: Array<OperatorDict | SourceOperatorDict>;
    raster_sources?: Array<OperatorDict | SourceOperatorDict>;
}

type ParamTypes = string | number | boolean | Array<ParamTypes> | { [key: string]: ParamTypes };

export interface OperatorParams {
    [key: string]: ParamTypes;
}

export interface SourceOperatorDict {
    type: string;
    params: {
        data_set: InternalDataSetIdDict; // TODO: support all Id types
    };
}

export interface TimeStepDict {
    step: number;
    granularity: TimeStepGranularityDict;
}

export type TimeStepGranularityDict = 'Millis' |
    'Seconds' |
    'Minutes' |
    'Hours' |
    'Days' |
    'Months' |
    'Years';

export interface DataSetDict {
    id: InternalDataSetIdDict; // TODO: support all Id types
    name: string;
    description: string;
    result_descriptor: DatasetResultDescriptorDict;
    source_operator: string;
}

export interface InternalDataSetIdDict {
    Internal: UUID;
}

export interface DatasetResultDescriptorDict {
    Vector?: VectorResultDescriptorDict;
    Raster?: RasterResultDescriptorDict;
}

export interface NoDataDict {
    [key: string]: number;
}

export interface PlotDataDict {
    plot_type: string;
    output_format: 'JsonPlain' | 'JsonVega' | 'ImagePng';
    data: any;
}

export interface ResultDescriptorDict {
    spatial_reference?: SrsString;
}

export interface RasterResultDescriptorDict extends ResultDescriptorDict {
    data_type: 'U8' | 'U16' | 'U32' | 'U64' | 'I8' | 'I16' | 'I32' | 'I64' | 'F32' | 'F64';
    measurement: 'unitless' | MeasurementDict;
}

export interface VectorResultDescriptorDict extends ResultDescriptorDict {
    data_type: 'Data' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon';
    columns: { [key: string]: 'Categorical' | 'Decimal' | 'Number' | 'Text' };
}

export interface PlotResultDescriptorDict extends ResultDescriptorDict {
    spatial_reference: undefined;
}

export interface MeasurementDict {
    continuous?: {
        measurement: string,
        unit?: string,
    };
    classification?: {
        measurement: string,
        classes: {
            [key: number]: string,
        },
    };
}
