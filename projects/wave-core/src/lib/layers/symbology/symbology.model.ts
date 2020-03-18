import {Interpolation, Unit, UnitDict} from '../../operators/unit.model';
import {Color, RgbaLike, RgbaTuple, TRANSPARENT, WHITE} from '../../colors/color';
import {ColorizerData, IColorizerData, MappingRasterColorizerDict} from '../../colors/colorizer-data.model';
import {ColorBreakpoint, ColorBreakpointDict} from '../../colors/color-breakpoint.model';
import {Colormap} from '../../colors/colormaps/colormap.model';

export enum SymbologyType {
    RASTER,
    SIMPLE_POINT,
    CLUSTERED_POINT,
    SIMPLE_LINE,
    SIMPLE_VECTOR,
    MAPPING_COLORIZER_RASTER,
    ICON_POINT, // RESERVED
    COMPLEX_POINT,
    COMPLEX_VECTOR,
    COMPLEX_LINE
}

export const DEFAULT_VECTOR_STROKE_COLOR: Color = Color.fromRgbaLike([0, 0, 0, 1]);
export const DEFAULT_VECTOR_FILL_COLOR: Color = Color.fromRgbaLike([255, 0, 0, 1]);
export const DEFAULT_VECTOR_HIGHLIGHT_STROKE_COLOR: Color = Color.fromRgbaLike([255, 255, 255, 1]);
export const DEFAULT_VECTOR_HIGHLIGHT_FILL_COLOR: Color = Color.fromRgbaLike([0, 153, 255, 1]);
export const DEFAULT_VECTOR_HIGHLIGHT_TEXT_COLOR: Color = Color.fromRgbaLike([255, 255, 255, 1]);
export const DEFAULT_POINT_RADIUS = 5;
/**
 * Serialization interface
 */
export interface SymbologyDict {
    symbologyType: string;
}

// tslint:disable-next-line: no-empty-interface
export interface ISymbology {}


// TODO: Clean up...
export abstract class AbstractSymbology implements ISymbology {

    static fromDict(
        dict: SymbologyDict
    ): AbstractSymbology {
        switch (dict.symbologyType) {
            case SymbologyType[SymbologyType.SIMPLE_POINT]:
                return ComplexPointSymbology.createSimpleSymbology(dict as ComplexPointSymbologyDict);
            case SymbologyType[SymbologyType.CLUSTERED_POINT]:
                return ComplexPointSymbology.createClusterSymbology(dict as VectorSymbologyDict);
            case SymbologyType[SymbologyType.COMPLEX_POINT]:
                return new ComplexPointSymbology(dict as ComplexPointSymbologyDict);

            case SymbologyType[SymbologyType.SIMPLE_LINE]:
                return ComplexLineSymbology.createSimpleSymbology(dict as VectorSymbologyDict);
            case SymbologyType[SymbologyType.COMPLEX_LINE]:
                return ComplexLineSymbology.createSymbology(dict as VectorSymbologyDict);

            case SymbologyType[SymbologyType.SIMPLE_VECTOR]:
                return ComplexVectorSymbology.createSimpleSymbology(dict as VectorSymbologyDict);
            case SymbologyType[SymbologyType.COMPLEX_VECTOR]:
                return ComplexVectorSymbology.createSimpleSymbology(dict as ComplexVectorSymbologyDict);

            case SymbologyType[SymbologyType.RASTER]:
                const rasterSymbologyDict = dict as RasterSymbologyDict;
                return new RasterSymbology({
                    opacity: rasterSymbologyDict.opacity,
                    unit: Unit.fromDict(rasterSymbologyDict.unit),
                });
            case SymbologyType[SymbologyType.MAPPING_COLORIZER_RASTER]:
                const mappingColorizerRasterSymbologyDict = dict as RasterSymbologyDict;
                return new MappingColorizerRasterSymbology({
                    opacity: mappingColorizerRasterSymbologyDict.opacity,
                    unit: Unit.fromDict(mappingColorizerRasterSymbologyDict.unit),
                    colorizer: ColorizerData.fromDict(mappingColorizerRasterSymbologyDict.colorizer)
                });
            default:
                throw new Error('Unsupported AbstractSymbology');
        }
    }

    abstract getSymbologyType(): SymbologyType;

    get symbologyType(): SymbologyType {
        return this.getSymbologyType();
    }

    get symbologyTypeId(): string {
        return SymbologyType[this.getSymbologyType()];
    }

    abstract clone(): AbstractSymbology;

    abstract toConfig(): ISymbology;

    abstract equals(other: AbstractSymbology): boolean;

    abstract toDict(): SymbologyDict;
}

export interface VectorSymbologyConfig extends ISymbology {
    fillRGBA?: RgbaLike;
    strokeRGBA?: RgbaLike;
    strokeWidth?: number;
}

interface VectorSymbologyDict extends SymbologyDict {
    fillRGBA: RgbaTuple;
    strokeRGBA: RgbaTuple;
    strokeWidth: number;
}

export abstract class AbstractVectorSymbology extends AbstractSymbology {
    _fillColorBreakpoint: ColorBreakpoint = new ColorBreakpoint({rgba: DEFAULT_VECTOR_FILL_COLOR, value: 'Default fill color'});
    _strokeColorBreakpoint: ColorBreakpoint = new ColorBreakpoint({rgba: DEFAULT_VECTOR_STROKE_COLOR, value: 'Default stroke color'});
    strokeWidth = 1;

    abstract describesElementFill(): boolean;

    abstract describesElementStroke(): boolean;

    abstract describesPointsWithRadius(): boolean;

    public get symbologyIconName(): string {
        switch (this.getSymbologyType()) {
            case SymbologyType.SIMPLE_POINT:
            case SymbologyType.COMPLEX_POINT:
                return 'symbology:point';
            case SymbologyType.SIMPLE_LINE:
            case SymbologyType.COMPLEX_LINE:
                return 'symbology:line';
            case SymbologyType.SIMPLE_VECTOR:
            case SymbologyType.COMPLEX_VECTOR:
                return 'symbology:polygon';
            default:
                throw new Error(`No symbology icon name defined for ${this.symbologyType}`);
        }
    }

    // Wrap colors in ColorBreakpoint for easy form usage
    set fillColorBreakpoint(colorBreakpoint: ColorBreakpoint) {
        this._fillColorBreakpoint = colorBreakpoint;
    }

    get fillColorBreakpoint(): ColorBreakpoint {
        return this._fillColorBreakpoint;
    }

    set strokeColorBreakpoint(colorBreakpoint: ColorBreakpoint) {
        this._strokeColorBreakpoint = colorBreakpoint;
    }

    get strokeColorBreakpoint(): ColorBreakpoint {
        return this._strokeColorBreakpoint;
    }

    // Wrap colors in ColorBreakpoint for easy form usage
    set fillRGBA(color: Color) {
        this._fillColorBreakpoint.setColor(color);
    }

    get fillRGBA(): Color {
        return this._fillColorBreakpoint.rgba;
    }

    set strokeRGBA(color: Color) {
        this._strokeColorBreakpoint.setColor(color);
    }

    get strokeRGBA(): Color {
        return this._strokeColorBreakpoint.rgba;
    }

    equals(other: AbstractVectorSymbology) {
        return other
            && this.fillColorBreakpoint.equals(other.fillColorBreakpoint)
            && this.strokeColorBreakpoint.equals(other.strokeColorBreakpoint)
            && this.strokeWidth === other.strokeWidth
            && this.describesElementFill() === other.describesElementFill()
            && this.describesPointsWithRadius() === other.describesPointsWithRadius();
    }


    setFillColorBreakpoint(colorBreakpoint: ColorBreakpoint) {
            this.fillColorBreakpoint = colorBreakpoint;
    }

    setStrokeColorBreakpoint(colorBreakpoint: ColorBreakpoint) {
            this.strokeColorBreakpoint = colorBreakpoint;
    }

    protected constructor(config: VectorSymbologyConfig) {
        super();
        if (config.fillRGBA) {
            this.fillRGBA = Color.fromRgbaLike(config.fillRGBA);
        }
        if (config.strokeRGBA) {
            this.strokeRGBA = Color.fromRgbaLike(config.strokeRGBA);
        }
        if (config.strokeWidth) { this.strokeWidth = config.strokeWidth; }
    }
}

export type StrokeDashStyle = Array<number>;

export interface ComplexVectorSymbologyConfig extends VectorSymbologyConfig {
    fillColorizer?: IColorizerData;
    fillColorAttribute?: string;
    strokeColorizer?: IColorizerData;
    strokeColorAttribute?: string;
    strokeDashStyle?: StrokeDashStyle;
    textAttribute?: string;
    textColor?: RgbaLike;
    textStrokeWidth?: number;
}

export interface ComplexVectorSymbologyDict extends VectorSymbologyDict {
    fillColorizer: IColorizerData;
    fillColorAttribute: string;
    strokeColorizer: IColorizerData;
    strokeColorAttribute: string;
    strokeDashStyle: StrokeDashStyle;
    textAttribute: string;
    textColor: RgbaLike;
    textStrokeWidth: number;
}

export interface ComplexPointSymbologyConfig extends ComplexVectorSymbologyConfig {
    radius?: number;
    radiusAttribute?: string;
    radiusFactor?: number;
}

interface ComplexPointSymbologyDict extends ComplexVectorSymbologyDict {
    radius: number;
    radiusAttribute: string;
    radiusFactor: number;
}

export abstract class AbstractComplexVectorSymbology extends AbstractVectorSymbology {
    fillColorizer: ColorizerData;
    fillColorAttribute: string = undefined;
    strokeColorizer: ColorizerData;
    strokeColorAttribute: string = undefined;
    strokeDashStyle: StrokeDashStyle = undefined;
    textAttribute: string = undefined;
    textColor: Color = undefined;
    textStrokeWidth: number = undefined;

    protected constructor(config: ComplexVectorSymbologyConfig) {
        super(config);
        if (config.fillColorAttribute) {
            this.fillColorAttribute = config.fillColorAttribute;
        }
        this.fillColorizer = (config.fillColorizer) ? ColorizerData.fromDict(config.fillColorizer) : ColorizerData.empty();

        if (config.strokeColorAttribute) {
            this.strokeColorAttribute = config.strokeColorAttribute;
        }
        this.strokeColorizer = (config.strokeColorizer) ? ColorizerData.fromDict(config.strokeColorizer) : ColorizerData.empty();

        if (config.strokeDashStyle) {
            this.strokeDashStyle = config.strokeDashStyle;
        }

        if (config.textAttribute) {
            this.textAttribute = config.textAttribute;
        }
        this.textColor = config.textColor ? Color.fromRgbaLike(config.textColor) : WHITE;
        this.textStrokeWidth = config.textStrokeWidth ? config.textStrokeWidth : Math.ceil(config.strokeWidth * 0.1);
    }

    setFillColorAttribute(name: string, clr: ColorizerData = ColorizerData.empty()) {
        this.fillColorizer = clr;
        this.fillColorAttribute = name;
    }

    setOrUpdateFillColorizer(clr: ColorizerData): boolean {
        if (clr && (!this.fillColorizer || !clr.equals(this.fillColorizer))) {
            this.fillColorizer = clr;
            return true;
        }
        return false;
    }

    unSetFillColorAttribute() {
        this.fillColorAttribute = undefined;
        this.fillColorizer = ColorizerData.empty();
    }

    setStrokeColorAttribute(name: string, clr: ColorizerData = ColorizerData.empty()) {
        this.strokeColorizer = clr;
        this.strokeColorAttribute = name;
    }

    setOrUpdateStrokeColorizer(clr: ColorizerData): boolean {
        if (clr && (!this.strokeColorizer || !clr.equals(this.strokeColorizer))) {
            this.strokeColorizer = clr;
            return true;
        }
        return false;
    }

    unSetStrokeColorAttribute() {
        this.strokeColorAttribute = undefined;
        this.strokeColorizer = ColorizerData.empty();
    }

    setStrokeDashStyle(strokeDashStyle: StrokeDashStyle) {
        this.strokeDashStyle = strokeDashStyle;
    }

    unSetStrokeDashStyle() {
        this.strokeDashStyle = undefined;
    }

    equals(other: AbstractVectorSymbology) {
        if (other instanceof AbstractComplexVectorSymbology) {
            return super.equals(other as AbstractComplexVectorSymbology)
                && this.fillColorizer && this.fillColorizer.equals(other.fillColorizer)
                && this.fillColorAttribute && other.fillColorAttribute && this.fillColorAttribute === other.fillColorAttribute
                && this.strokeColorizer && this.strokeColorizer.equals(other.strokeColorizer)
                && this.strokeColorAttribute && other.strokeColorAttribute && this.strokeColorAttribute === other.strokeColorAttribute
                && this.strokeDashStyle && other.strokeDashStyle && this.strokeDashStyle === other.strokeDashStyle
                && this.textColor && this.textColor.equals(other.textColor)
                && this.textStrokeWidth && other.textStrokeWidth && this.textStrokeWidth === other.textStrokeWidth
                && this.textAttribute && other.textAttribute && this.textAttribute === other.textAttribute;
        }
        return false;
    }

    toDict(): ComplexVectorSymbologyDict {
        return {
            symbologyType: SymbologyType[this.getSymbologyType()],
            fillRGBA: this.fillRGBA.rgbaTuple(),
            strokeRGBA: this.strokeRGBA.rgbaTuple(),
            strokeWidth: this.strokeWidth,
            fillColorAttribute: this.fillColorAttribute,
            fillColorizer: this.fillColorizer ? this.fillColorizer.toDict() : undefined,
            strokeColorAttribute: this.strokeColorAttribute,
            strokeColorizer: this.strokeColorizer,
            strokeDashStyle: this.strokeDashStyle,
            textAttribute: this.textAttribute,
            textColor: this.textColor.rgbaTuple(),
            textStrokeWidth: this.textStrokeWidth,
        };
    }

}

export class ComplexLineSymbology extends AbstractComplexVectorSymbology implements ComplexVectorSymbologyConfig {
    protected constructor(config: ComplexVectorSymbologyConfig) {
        super(config);
    }

    static createSimpleSymbology(config: ComplexVectorSymbologyConfig): ComplexLineSymbology {
        return new ComplexLineSymbology(config);
    }

    static createSymbology(config: ComplexVectorSymbologyConfig): ComplexLineSymbology {
        return new ComplexLineSymbology(config);
    }

    describesElementStroke(): boolean {
        return true;
    }

    describesElementFill(): boolean {
        return false;
    }

    describesPointsWithRadius(): boolean {
        return false;
    }

    getSymbologyType(): SymbologyType {
        return SymbologyType.COMPLEX_LINE;
    }

    clone(): ComplexLineSymbology {
        return new ComplexLineSymbology(this);
    }

    toConfig(): ComplexLineSymbology {
        return this.clone();
    }
}

export class ComplexVectorSymbology extends AbstractComplexVectorSymbology implements ComplexVectorSymbologyConfig {

    protected constructor(config: ComplexVectorSymbologyConfig) {
        super(config);
    }

    static createSimpleSymbology(config: ComplexVectorSymbologyConfig): ComplexVectorSymbology {
        return new ComplexVectorSymbology(config);
    }

    static createSymbology(config: ComplexPointSymbologyConfig): ComplexVectorSymbology {
        return new ComplexVectorSymbology(config);
    }

    describesElementStroke(): boolean {
        return true;
    }

    describesElementFill(): boolean {
        return true;
    }

    describesPointsWithRadius(): boolean {
        return false;
    }

    getSymbologyType(): SymbologyType {
        return SymbologyType.COMPLEX_VECTOR;
    }
    clone(): ComplexVectorSymbology {
        return new ComplexVectorSymbology(this);
    }
    toConfig(): ComplexVectorSymbologyConfig {
        return this.clone();
    }
}

export class ComplexPointSymbology extends AbstractComplexVectorSymbology implements ComplexPointSymbologyConfig {

    radiusAttribute: string = undefined;
    radiusFactor = 1.0;
    radius: number = DEFAULT_POINT_RADIUS;

    constructor(config: ComplexPointSymbologyConfig) {
        super(config);

        if (config.radius) {
            this.radius = config.radius;
        }

        if (config.radiusAttribute) {
            this.radiusAttribute = config.radiusAttribute;
        }
        this.radiusFactor = (config.radiusFactor) ? config.radiusFactor : 1.0;
    }

    /**
     * Creates a ComplexPointSymbology where radiusAttribute and textAttribute are set to the strings returned by Mappings cluster operator
     */
    static createClusterSymbology(config: ComplexPointSymbologyConfig): ComplexPointSymbology {
        config['radiusAttribute'] = '___radius';
        config['textAttribute'] = '___numberOfPoints';
        config['clustered'] = true;

        return ComplexPointSymbology.createSymbology(config);
    }

    static createSimpleSymbology(config: ComplexPointSymbologyConfig): ComplexPointSymbology {
        return ComplexPointSymbology.createSymbology(config);
    }

    static createSymbology(config: ComplexPointSymbologyConfig): ComplexPointSymbology {
        return new ComplexPointSymbology(config);
    }

    getSymbologyType(): SymbologyType {
        return SymbologyType.COMPLEX_POINT;
    }

    clone(): ComplexPointSymbology {
        return new ComplexPointSymbology(this);
    }

    equals(other: AbstractVectorSymbology) {
        if (other instanceof ComplexPointSymbology) {
            return super.equals(other as AbstractComplexVectorSymbology)
                && this.radiusAttribute && other.radiusAttribute && this.radiusAttribute === other.radiusAttribute;
        }
        return false;
    }

    toConfig(): ComplexPointSymbologyConfig {
        return this.clone();
    }

    describesElementStroke(): boolean {
        return true;
    }

    describesElementFill(): boolean {
        return true;
    }

    describesPointsWithRadius(): boolean {
        return true;
    }

    setRadiusAttribute(name: string, factor = 1.0) {
        this.radiusAttribute = name;
        this.radiusFactor = factor;
    }

    unSetRadiusAttribute() {
        this.radiusAttribute = undefined;
        this.radiusFactor = 1.0;
    }

    toDict(): ComplexPointSymbologyDict {
        return {
            symbologyType: SymbologyType[SymbologyType.COMPLEX_POINT],
            fillRGBA: this.fillRGBA.rgbaTuple(),
            strokeRGBA: this.strokeRGBA.rgbaTuple(),
            strokeWidth: this.strokeWidth,
            fillColorAttribute: this.fillColorAttribute,
            fillColorizer: this.fillColorizer ? this.fillColorizer.toDict() : undefined,
            strokeColorAttribute: this.strokeColorAttribute,
            strokeColorizer: this.strokeColorizer,
            strokeDashStyle: this.strokeDashStyle,
            radiusAttribute: this.radiusAttribute,
            radiusFactor: this.radiusFactor,
            radius: this.radius,
            textAttribute: this.textAttribute,
            textColor: this.textColor.rgbaTuple(),
            textStrokeWidth: this.textStrokeWidth,
        };
    }
}

export interface IRasterSymbology extends ISymbology {
    opacity?: number;
    unit: Unit;
}

export interface RasterSymbologyDict extends SymbologyDict {
    opacity: number;
    unit: UnitDict;
    colorizer?: IColorizerData;
    noDataColor?: ColorBreakpointDict;
    overflowColor?: ColorBreakpointDict;
}

export class RasterSymbology extends AbstractSymbology implements IRasterSymbology {
    opacity = 1;
    unit: Unit;

    constructor(config: IRasterSymbology) {
        super();
        this.unit = config.unit;
        if (config.opacity) { this.opacity = config.opacity; }
    }

    isContinuous() {
        return this.unit.interpolation === Interpolation.Continuous;
    }

    isDiscrete() {
        return this.unit.interpolation === Interpolation.Discrete;
    }

    isUnknown() {
        return !this.unit || !this.unit.interpolation || this.unit.interpolation === 0;
    }

    getSymbologyType(): SymbologyType {
        return SymbologyType.RASTER;
    }

    toConfig(): IRasterSymbology {
        return this.clone();
    }

    clone(): RasterSymbology {
        return new RasterSymbology(this);
    }

    equals(other: RasterSymbology) {
        return this.opacity === other.opacity
            && this.unit === other.unit;
    }

    toDict(): RasterSymbologyDict {
        return {
            symbologyType: SymbologyType[SymbologyType.RASTER],
            opacity: this.opacity,
            unit: this.unit.toDict(),
        };
    }
}

export interface IColorizerRasterSymbology extends IRasterSymbology {
    colorizer?: IColorizerData;
    noDataColor?: ColorBreakpointDict;
    overflowColor?: ColorBreakpointDict;
}

export class MappingColorizerRasterSymbology extends RasterSymbology
    implements IColorizerRasterSymbology {

    colorizer: ColorizerData;
    noDataColor: ColorBreakpoint;
    overflowColor: ColorBreakpoint;

    constructor(config: IColorizerRasterSymbology) {
        super(config);
        this.colorizer = (config.colorizer) ? new ColorizerData(config.colorizer)
            : Colormap.createColorizerDataWithName('VIRIDIS', config.unit.min, config.unit.max);
        this.noDataColor = (config.noDataColor) ? new ColorBreakpoint(config.noDataColor)
            : new ColorBreakpoint({rgba: TRANSPARENT, value: 'NoData'});
        this.overflowColor = (config.overflowColor) ? new ColorBreakpoint(config.overflowColor)
            : new ColorBreakpoint({rgba: TRANSPARENT, value: 'Overflow'});
    }

    getSymbologyType(): SymbologyType {
        return SymbologyType.MAPPING_COLORIZER_RASTER;
    }

    isUnknown(): boolean {
        return super.isUnknown();
    }

    toConfig(): IColorizerRasterSymbology {
        return this.clone() as IColorizerRasterSymbology;
    }

    clone(): MappingColorizerRasterSymbology {
        return new MappingColorizerRasterSymbology(this);
    }

    equals(other: RasterSymbology) {
        if (other instanceof MappingColorizerRasterSymbology) {
            return super.equals(other as RasterSymbology)
                && this.colorizer && this.colorizer.equals(other.colorizer)
                && this.noDataColor && this.noDataColor.equals(other.noDataColor)
                && this.overflowColor && this.overflowColor.equals(other.overflowColor);
        }
        return false;
    }

    toDict(): RasterSymbologyDict {
        return {
            symbologyType: SymbologyType[SymbologyType.MAPPING_COLORIZER_RASTER],
            opacity: this.opacity,
            unit: this.unit.toDict(),
            colorizer: this.colorizer.toDict(),
            noDataColor: this.noDataColor.toDict(),
            overflowColor: this.overflowColor.toDict()
        };
    }

    mappingColorizerRequestString(): string {
        const mcbs: MappingRasterColorizerDict = {
            type: this.colorizer.type,
            nodata: this.noDataColor.asMappingRasterColorizerBreakpoint(),
            overflow: this.overflowColor.asMappingRasterColorizerBreakpoint(),
            breakpoints: this.colorizer.breakpoints.map(br => br.asMappingRasterColorizerBreakpoint())
        };
        return JSON.stringify(mcbs);
    }
}
