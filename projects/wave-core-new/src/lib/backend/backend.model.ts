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
    validUntil: TimestampString;
    project?: UUID;
    view?: STRectangleDict;
}

export interface UserDict {
    id: UUID;
    email?: string;
    realName?: string;
}

export interface CoordinateDict {
    x: number;
    y: number;
}

export interface BBoxDict {
    lowerLeftCoordinate: CoordinateDict;
    upperRightCoordinate: CoordinateDict;
}

/**
 * UNIX time in Milliseconds
 */
export interface TimeIntervalDict {
    start: number;
    end: number;
}

export interface STRectangleDict {
    spatialReference: SrsString;
    boundingBox: BBoxDict;
    timeInterval: TimeIntervalDict;
}

export interface CreateProjectResponseDict {
    id: UUID;
}

export interface ProjectListingDict {
    id: UUID;
    name: string;
    description: string;
    layerNames: Array<string>;
    changed: TimestampString;
}

export type ProjectPermissionDict = 'Read' | 'Write' | 'Owner';

export type ProjectFilterDict = 'None' | {name: {term: string}} | {description: {term: string}};

export type ProjectOrderByDict = 'DateAsc' | 'DateDesc' | 'NameAsc' | 'NameDesc';

export interface ProjectDict {
    id: UUID;
    version?: ProjectVersion;
    name: string;
    description: string;
    layers: Array<LayerDict>;
    plots: Array<PlotDict>;
    bounds: STRectangleDict;
    timeStep: TimeStepDict;
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
    noDataColor: RgbaColorDict;
    defaultColor: RgbaColorDict;
}

export interface LogarithmitGradientDict {
    breakpoints: Array<BreakpointDict>;
    noDataColor: RgbaColorDict;
    defaultColor: RgbaColorDict;
}

export interface PaletteDict {
    colors: {
        [numberValue: string]: RgbaColorDict;
    };
    noDataColor: RgbaColorDict;
    defaultColor: RgbaColorDict;
}

export interface ColorizerDict {
    linearGradient?: LinearGradientDict;
    logarithmicGradient?: LogarithmitGradientDict;
    palette?: PaletteDict;
    rgba?: {[index: string]: never};
}

export type RgbaColorDict = [number, number, number, number];

export interface SymbologyDict {
    raster?: RasterSymbologyDict;
    vector?: VectorSymbologyDict;
}

export interface RasterSymbologyDict {
    opacity: number;
    colorizer: ColorizerDict;
}

export interface VectorSymbologyDict {
    point?: PointSymbologyDict;
    line?: LineSymbologyDict;
    polygon?: PolygonSymbologyDict;
}

export interface TextSymbologyDict {
    attribute: string;
    fillColor: ColorParamDict;
    stroke: StrokeParamDict;
}

export interface PointSymbologyDict {
    radius: NumberParamDict;
    fillColor: ColorParamDict;
    stroke: StrokeParamDict;
    text?: TextSymbologyDict;
}

export interface LineSymbologyDict {
    stroke: StrokeParamDict;
    text?: TextSymbologyDict;
}

export interface PolygonSymbologyDict {
    fillColor: ColorParamDict;
    stroke: StrokeParamDict;
    text?: TextSymbologyDict;
}

export interface NumberParamDict {
    static?: number;
    derived?: DerivedNumberDict;
}

export interface ColorParamDict {
    static?: RgbaColorDict;
    derived?: DerivedColorDict;
}

export interface DerivedNumberDict {
    attribute: string;
    factor: number;
    defaultValue: number;
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
    params: OperatorParams | null;
    vectorSources?: Array<OperatorDict | SourceOperatorDict>;
    rasterSources?: Array<OperatorDict | SourceOperatorDict>;
}

type ParamTypes = string | number | boolean | Array<ParamTypes> | {[key: string]: ParamTypes} | undefined;

export interface OperatorParams {
    [key: string]: ParamTypes;
}

export interface SourceOperatorDict {
    type: string;
    params: {
        dataset: InternalDatasetIdDict; // TODO: support all Id types
    };
}

export interface TimeStepDict {
    step: number;
    granularity: TimeStepGranularityDict;
}

export type TimeStepGranularityDict = 'Millis' | 'Seconds' | 'Minutes' | 'Hours' | 'Days' | 'Months' | 'Years';

export interface DatasetDict {
    id: InternalDatasetIdDict; // TODO: support all Id types
    name: string;
    description: string;
    resultDescriptor: DatasetResultDescriptorDict;
    sourceOperator: string;
}

export interface DatasetIdDict {
    internal?: UUID;
}

export interface InternalDatasetIdDict {
    internal: UUID;
}

export interface DatasetResultDescriptorDict {
    vector?: VectorResultDescriptorDict;
    raster?: RasterResultDescriptorDict;
}

export interface NoDataDict {
    [key: string]: number;
}

export interface PlotDataDict {
    plotType: string;
    outputFormat: 'JsonPlain' | 'JsonVega' | 'ImagePng';
    data: any;
}

export interface ResultDescriptorDict {
    spatialReference?: SrsString;
}

export interface RasterResultDescriptorDict extends ResultDescriptorDict {
    dataType: 'U8' | 'U16' | 'U32' | 'U64' | 'I8' | 'I16' | 'I32' | 'I64' | 'F32' | 'F64';
    measurement: 'unitless' | MeasurementDict;
}

export interface VectorResultDescriptorDict extends ResultDescriptorDict {
    dataType: VectorDataType;
    columns: {[key: string]: 'categorical' | 'int' | 'float' | 'text'};
}

type VectorDataType = 'Data' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon';

export interface PlotResultDescriptorDict extends ResultDescriptorDict {
    spatialReference: undefined;
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
    id: DatasetIdDict;
}

export interface CreateDatasetDict {
    upload: UUID;
    definition: DatasetDefinitionDict;
}

export interface DatasetDefinitionDict {
    properties: AddDatasetDict;
    metaData: MetaDataDefinitionDict;
}

export interface AddDatasetDict {
    id?: DatasetIdDict;
    name: string;
    description: string;
    sourceOperator: string;
}

export interface AutoCreateDatasetDict {
    upload: UUID;
    datasetName: string;
    datasetDescription: string;
    mainFile: string;
}

export interface SuggestMetaDataDict {
    upload: UUID;
    mainFile?: string;
}

export interface MetaDataSuggestionDict {
    mainFile: string;
    metaData: MetaDataDefinitionDict;
}

export interface MetaDataDefinitionDict {
    OgrMetaData?: OgrMetaDataDict;
}

export interface OgrMetaDataDict {
    loadingInfo: OgrSourceDatasetDict;
    resultDescriptor: VectorResultDescriptorDict;
}

export interface OgrSourceDatasetDict {
    fileName: string;
    layerName: string;
    dataType?: VectorDataType;
    time: 'none' | OgrSourceDatasetTimeTypeDict;
    columns?: OgrSourceColumnSpecDict;
    defaultGeometry?: TypedGeometryDict;
    forceOgrTimeFilter: boolean;
    onError: 'skip' | 'abort' | 'keep';
    provenance?: ProvenanceInformationDict;
}

export interface OgrSourceDatasetTimeTypeDict {
    start?: {
        startField: string;
        startFormat: OgrSourceTimeFormatDict;
        duration: number;
    };
    'start+end'?: {
        startField: string;
        startFormat: OgrSourceTimeFormatDict;
        endField: string;
        endFormat: OgrSourceTimeFormatDict;
    };
    'start+duration'?: {
        startField: string;
        startFormat: OgrSourceTimeFormatDict;
        durationField: string;
    };
}

export interface OgrSourceTimeFormatDict {
    format: 'seconds' | 'iso' | 'custom';
    customFormat?: string;
}

export interface OgrSourceColumnSpecDict {
    x: string;
    y?: string;
    float: Array<string>;
    int: Array<string>;
    textual: Array<string>;
}

export interface TypedGeometryDict {
    Data?: '';
    MultiPoint?: MultiPointDict;
    MultiLineString?: MultiLineStringDict;
    MultiPolygon?: MultiPolygonDict;
}

export interface MultiPointDict {
    coordinates: Array<CoordinateDict>;
}

export interface MultiLineStringDict {
    coordinates: Array<Array<CoordinateDict>>;
}

export interface MultiPolygonDict {
    polygons: Array<PolygonDict>;
}

export type PolygonDict = Array<RingDict>;
export type RingDict = Array<CoordinateDict>;

export interface ProvenanceInformationDict {
    citation: string;
    license: string;
    uri: string;
}
