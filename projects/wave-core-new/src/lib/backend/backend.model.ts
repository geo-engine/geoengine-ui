export type UUID = string;
export type TimestampString = string;
export type SrsString = string;

/**
 * Marker dictionary for types that only use primitive types and sub-types.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SerializableDict {}

export interface RegistrationDict {
    id: UUID;
}

export interface SessionDict {
    id: UUID;
    user?: UserDict;
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
 * UNIX timestamp in milliseconds.
 *
 * TODO: For input, allow ISO 8601 string
 */
export type TimeInstanceDict = string;

/**
 * UNIX time in Milliseconds
 *
 * TODO: For input, allow ISO 8601 strings
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

export type ColorizerDict = LinearGradientDict | LogarithmitGradientDict | PaletteDict | RgbaColorizerDict;

export interface RgbaColorizerDict {
    type: 'rgba';
}

export interface LinearGradientDict {
    type: 'linearGradient';
    breakpoints: Array<BreakpointDict>;
    noDataColor: RgbaColorDict;
    defaultColor: RgbaColorDict;
}

export interface LogarithmitGradientDict {
    type: 'logarithmicGradient';
    breakpoints: Array<BreakpointDict>;
    noDataColor: RgbaColorDict;
    defaultColor: RgbaColorDict;
}

export interface PaletteDict {
    type: 'palette';
    colors: {
        [numberValue: string]: RgbaColorDict;
    };
    noDataColor: RgbaColorDict;
    defaultColor: RgbaColorDict;
}

export type RgbaColorDict = [number, number, number, number];

export type SymbologyDict = RasterSymbologyDict | VectorSymbologyDict;
export type VectorSymbologyDict = PointSymbologyDict | LineSymbologyDict | PolygonSymbologyDict;

export interface RasterSymbologyDict {
    type: 'raster';
    opacity: number;
    colorizer: ColorizerDict;
}

export interface TextSymbologyDict {
    attribute: string;
    fillColor: ColorParamDict;
    stroke: StrokeParamDict;
}

export interface PointSymbologyDict {
    type: 'point';
    radius: NumberParamDict;
    fillColor: ColorParamDict;
    stroke: StrokeParamDict;
    text?: TextSymbologyDict;
}

export interface LineSymbologyDict {
    type: 'line';
    stroke: StrokeParamDict;
    text?: TextSymbologyDict;
}

export interface PolygonSymbologyDict {
    type: 'polygon';
    fillColor: ColorParamDict;
    stroke: StrokeParamDict;
    text?: TextSymbologyDict;
}

export type NumberParamDict = StaticNumberDict | DerivedNumberDict;

export interface StaticNumberDict {
    type: 'static';
    value: number;
}

export interface DerivedNumberDict {
    type: 'derived';
    attribute: string;
    factor: number;
    defaultValue: number;
}

export type ColorParamDict = StaticColorDict | DerivedColorDict;

export interface StaticColorDict {
    type: 'static';
    color: RgbaColorDict;
}

export interface DerivedColorDict {
    type: 'derived';
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
    sources: OperatorSourcesDict;
}

export interface OperatorSourcesDict {
    [name: string]: OperatorDict | SourceOperatorDict | Array<OperatorDict | SourceOperatorDict> | undefined;
}

type ParamTypes = string | number | boolean | Array<ParamTypes> | {[key: string]: ParamTypes} | SerializableDict | undefined;

export interface OperatorParams {
    [key: string]: ParamTypes;
}

export interface SourceOperatorDict {
    type: string;
    params: {
        dataset: DatasetIdDict;
        attributeFilters?: Array<AttributeFilterDict>;
    };
}

export type AttributeRangeDict = [string | number, string | number];

export interface AttributeFilterDict {
    attribute: string;
    ranges: Array<AttributeRangeDict>;
    keepNulls: boolean;
}

export interface TimeStepDict {
    step: number;
    granularity: TimeStepGranularityDict;
}

export type TimeStepGranularityDict = 'Millis' | 'Seconds' | 'Minutes' | 'Hours' | 'Days' | 'Months' | 'Years';

export interface DatasetDict {
    id: DatasetIdDict;
    name: string;
    description: string;
    resultDescriptor: TypedResultDescriptorDict;
    sourceOperator: string;
    symbology?: SymbologyDict;
    attributeFilters?: Array<AttributeFilterDict>;
}

export type DatasetIdDict = InternalDatasetIdDict | ExternalDatasetIdDict;

export interface InternalDatasetIdDict {
    type: 'internal';
    datasetId: UUID;
}
export interface ExternalDatasetIdDict {
    type: 'external';
    providerId: UUID;
    datasetId: string;
}

export type DatasetOrderByDict = 'NameAsc' | 'NameDesc';

export interface NoDataDict {
    [key: string]: number;
}

export interface PlotDataDict {
    plotType: string;
    outputFormat: 'JsonPlain' | 'JsonVega' | 'ImagePng';
    data: any;
}

export interface ResultDescriptorDict {
    spatialReference: SrsString;
}

export type TypedResultDescriptorDict = VectorResultDescriptorDict | RasterResultDescriptorDict;

export interface RasterResultDescriptorDict extends ResultDescriptorDict {
    type: 'raster';
    dataType: 'U8' | 'U16' | 'U32' | 'U64' | 'I8' | 'I16' | 'I32' | 'I64' | 'F32' | 'F64';
    measurement: MeasurementDict;
}

export interface VectorResultDescriptorDict extends ResultDescriptorDict {
    type: 'vector';
    dataType: VectorDataType;
    columns: {[key: string]: 'categorical' | 'int' | 'float' | 'text'};
}

type VectorDataType = 'Data' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon';

export type MeasurementDict = UnitLessMeasurementDict | ContinuousMeasurementDict | ClassificationMeasurementDict;

export interface UnitLessMeasurementDict {
    type: 'unitless';
}

export interface ContinuousMeasurementDict {
    type: 'continuous';
    measurement: string;
    unit?: string;
}

export interface ClassificationMeasurementDict {
    type: 'classification';
    measurement: string;
    classes: {
        [key: number]: string;
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
    symbology?: SymbologyDict;
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

export type MetaDataDefinitionDict = OgrMetaDataDict;

export interface OgrMetaDataDict {
    type: 'OgrMetaData';
    loadingInfo: OgrSourceDatasetDict;
    resultDescriptor: VectorResultDescriptorDict;
}

export interface OgrSourceDatasetDict {
    fileName: string;
    layerName: string;
    dataType?: VectorDataType;
    time: OgrSourceDatasetTimeTypeDict;
    columns?: OgrSourceColumnSpecDict;
    forceOgrTimeFilter: boolean;
    onError: 'ignore' | 'abort';
}

export type OgrSourceDatasetTimeTypeDict =
    | NoneOgrSourceDatasetTimeTypeDict
    | StartOgrSourceDatasetTimeTypeDict
    | StartEndOgrSourceDatasetTimeTypeDict
    | StartDurationOgrSourceDatasetTimeTypeDict;

export interface NoneOgrSourceDatasetTimeTypeDict {
    type: 'none';
}

export interface StartOgrSourceDatasetTimeTypeDict {
    type: 'start';
    startField: string;
    startFormat: OgrSourceTimeFormatDict;
    duration: OgrSourceDurationSpecDict;
}

export interface StartEndOgrSourceDatasetTimeTypeDict {
    type: 'start+end';
    startField: string;
    startFormat: OgrSourceTimeFormatDict;
    endField: string;
    endFormat: OgrSourceTimeFormatDict;
}

export interface StartDurationOgrSourceDatasetTimeTypeDict {
    type: 'start+duration';
    startField: string;
    startFormat: OgrSourceTimeFormatDict;
    durationField: string;
}

export interface OgrSourceTimeFormatDict {
    format: 'seconds' | 'auto' | 'custom';
    customFormat?: string;
}

export interface OgrSourceColumnSpecDict {
    x: string;
    y?: string;
    float: Array<string>;
    int: Array<string>;
    text: Array<string>;
}

export type OgrSourceDurationSpecDict = ValueOgrSourceDurationSpecDict | InfiniteOgrSourceDurationSpecDict | ZeroOgrSourceDurationSpecDict;

export interface ValueOgrSourceDurationSpecDict extends TimeStepDict {
    type: 'value';
}

export interface InfiniteOgrSourceDurationSpecDict {
    type: 'infinite';
}

export interface ZeroOgrSourceDurationSpecDict {
    type: 'zero';
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

export interface ProvenanceDict {
    citation: string;
    license: string;
    uri: string;
}

export interface ProvenanceOutputDict {
    dataset: DatasetIdDict;
    provenance: ProvenanceDict;
}

export interface SpatialReferenceSpecificationDict {
    name: string;
    spatialReference: SrsString;
    projString: string;
    extent: BBoxDict;
    axisLabels?: [string, string];
}

export interface DataSetProviderListingDict {
    id: UUID;
    typeName: string;
    name: string;
}

export interface GeoEngineError {
    readonly error: string;
    readonly message: string;
}
