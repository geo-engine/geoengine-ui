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

export type ProjectFilterDict = 'None' | {name: {term: string}} | {description: {term: string}};

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
    visibility: {
        data: boolean;
        legend: boolean;
    };
    symbology: SymbologyDict;
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

export interface LinearGradientDict {
    breakpoints: Array<BreakpointDict>;
    no_data_color: RgbaColorDict;
    default_color: RgbaColorDict;
}

export interface LogarithmitGradientDict {
    breakpoints: Array<BreakpointDict>;
    no_data_color: RgbaColorDict;
    default_color: RgbaColorDict;
}

export interface PaletteDict {
    colors: {
        [numberValue: string]: RgbaColorDict;
    };
    no_data_color: RgbaColorDict;
    default_color: RgbaColorDict;
}

export interface ColorizerDict {
    LinearGradient?: LinearGradientDict;
    LogarithmicGradient?: LogarithmitGradientDict;
    Palette?: PaletteDict;
    Rgba?: {[index: string]: never};
}

export type RgbaColorDict = [number, number, number, number];

export interface SymbologyDict {
    Raster?: RasterSymbologyDict;
    Vector?: VectorSymbologyDict;
}

export interface RasterSymbologyDict {
    opacity: number;
    colorizer: ColorizerDict;
}

export interface VectorSymbologyDict {
    Point?: PointSymbologyDict;
    Line?: LineSymbologyDict;
    Polygon?: PolygonSymbologyDict;
}

export interface TextSymbologyDict {
    attribute: string;
    fill_color: ColorParamDict;
    stroke: StrokeParamDict;
}

export interface PointSymbologyDict {
    radius: NumberParamDict;
    fill_color: ColorParamDict;
    stroke: StrokeParamDict;
    text?: TextSymbologyDict;
}

export interface LineSymbologyDict {
    stroke: StrokeParamDict;
    text?: TextSymbologyDict;
}

export interface PolygonSymbologyDict {
    fill_color: ColorParamDict;
    stroke: StrokeParamDict;
    text?: TextSymbologyDict;
}

export interface NumberParamDict {
    Static?: number;
    Derived?: DerivedNumberDict;
}

export interface ColorParamDict {
    Static?: RgbaColorDict;
    Derived?: DerivedColorDict;
}

export interface DerivedNumberDict {
    attribute: string;
    factor: number;
    default_value: number;
}

export interface DerivedColorDict {
    attribute: string;
    colorizer: ColorizerDict;
}

export interface StrokeParamDict {
    width: NumberParamDict;
    color: ColorParamDict;
    // TODO: dash
}

export interface BreakpointDict {
    value: number;
    color: RgbaColorDict;
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

type ParamTypes = string | number | boolean | Array<ParamTypes> | {[key: string]: ParamTypes};

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

export type TimeStepGranularityDict = 'Millis' | 'Seconds' | 'Minutes' | 'Hours' | 'Days' | 'Months' | 'Years';

export interface DataSetDict {
    id: InternalDataSetIdDict; // TODO: support all Id types
    name: string;
    description: string;
    result_descriptor: DatasetResultDescriptorDict;
    source_operator: string;
}

export interface DataSetIdDict {
    Internal?: UUID;
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
    columns: {[key: string]: 'Categorical' | 'Decimal' | 'Number' | 'Text'};
}

export interface PlotResultDescriptorDict extends ResultDescriptorDict {
    spatial_reference: undefined;
}

export interface MeasurementDict {
    continuous?: {
        measurement: string;
        unit?: string;
    };
    classification?: {
        measurement: string;
        classes: {
            [key: number]: string;
        };
    };
}

export interface UploadResponseDict {
    id: UUID;
}

export interface DatasetIdResponseDict {
    id: DataSetIdDict;
}

export interface CreateDataSetDict {
    upload: UUID;
    // TODO: data set definition
}

export interface AutoCreateDataSetDict {
    upload: UUID;
    dataset_name: string;
    dataset_description: string;
    main_file: string;
}
