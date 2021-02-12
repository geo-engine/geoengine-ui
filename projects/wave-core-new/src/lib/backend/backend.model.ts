export type UUID = string;
export type TimestampString = string;
export type STRefString = string;

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
    spatial_reference: STRefString;
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
    operator: OperatorDict;
}

export interface OperatorDict {
    type: string;
    params: Params;
}

type ParamTypes = string | number | Array<ParamTypes> | { [key: string]: ParamTypes };

interface Params {
    [key: string]: ParamTypes;
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
