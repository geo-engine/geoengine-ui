import ol from 'ol';
import OlStyleStyle from 'ol/style/style';
import OlStyleFill from 'ol/style/fill'
import OlStyleStroke from 'ol/style/stroke'
import OlStyleCircle from 'ol/style/circle'
import OlStyleText from 'ol/style/text'

import {Interpolation, Unit, UnitDict} from '../../operators/unit.model';
import {Color, RgbaLike, RgbaTuple, TRANSPARENT, WHITE} from '../../colors/color';
import {ColorizerData, IColorizerData, MappingRasterColorizerDict} from '../../colors/colorizer-data.model';
import {ColorBreakpoint, ColorBreakpointDict} from '../../colors/color-breakpoint.model';

export enum SymbologyType {
    RASTER,
    SIMPLE_POINT,
    CLUSTERED_POINT,
    SIMPLE_VECTOR,
    MAPPING_COLORIZER_RASTER,
    ICON_POINT, // RESERVED
    COMPLEX_POINT,
}

const DEFAULT_VECTOR_STROKE_COLOR: Color = Color.fromRgbaLike([0, 0, 0, 1]);
const DEFAULT_VECTOR_FILL_COLOR: Color = Color.fromRgbaLike([255, 0, 0, 1]);
const DEFAULT_VECTOR_HIGHLIGHT_STROKE_COLOR: Color = Color.fromRgbaLike([255, 255, 255, 1]);
const DEFAULT_VECTOR_HIGHLIGHT_FILL_COLOR: Color = Color.fromRgbaLike([0, 153, 255, 1]);
const DEFAULT_VECTOR_HIGHLIGHT_TEXT_COLOR: Color = Color.fromRgbaLike([255, 255, 255, 1]);
const DEFAULT_POINT_RADIUS = 5;
/**
 * Serialization interface
 */
export interface SymbologyDict {
    symbologyType: string;
}

// tslint:disable-next-line: no-empty-interface
export interface ISymbology {}

export abstract class Symbology implements ISymbology {

    show = false; // TODO: remove

    static fromDict(
        dict: SymbologyDict, deprecated?: any
    ): Symbology {
        switch (dict.symbologyType) {
            case SymbologyType[SymbologyType.SIMPLE_POINT]:
                return new SimplePointSymbology(dict as SimplePointSymbologyDict);
            case SymbologyType[SymbologyType.CLUSTERED_POINT]:
                return ComplexPointSymbology.createClusterSymbology(dict as VectorSymbologyDict);
            case SymbologyType[SymbologyType.COMPLEX_POINT]:
                return new ComplexPointSymbology(dict as ComplexPointSymbologyDict);
            case SymbologyType[SymbologyType.SIMPLE_VECTOR]:
                return new SimpleVectorSymbology(dict as VectorSymbologyDict);
            case SymbologyType[SymbologyType.RASTER]:
                const rasterSymbologyDict = dict as RasterSymbologyDict;
                return new RasterSymbology({
                    hue: rasterSymbologyDict.hue,
                    opacity: rasterSymbologyDict.opacity,
                    saturation: rasterSymbologyDict.saturation,
                    unit: Unit.fromDict(rasterSymbologyDict.unit),
                });
            case SymbologyType[SymbologyType.MAPPING_COLORIZER_RASTER]:
                const mappingColorizerRasterSymbologyDict = dict as RasterSymbologyDict;
                return new MappingColorizerRasterSymbology({
                        hue: mappingColorizerRasterSymbologyDict.hue,
                        opacity: mappingColorizerRasterSymbologyDict.opacity,
                        saturation: mappingColorizerRasterSymbologyDict.saturation,
                        unit: Unit.fromDict(mappingColorizerRasterSymbologyDict.unit),
                        colorizer: ColorizerData.fromDict(mappingColorizerRasterSymbologyDict.colorizer)
                    });
            default:
                throw new Error('Unsupported Symbology');
        }
    }

    abstract getSymbologyType(): SymbologyType;

    get symbologyTypeId(): string {
        return SymbologyType[this.getSymbologyType()];
    }

    abstract clone(): Symbology;

    // abstract equals(other: Symbology): boolean; TODO: equals for symbologys?

    abstract toConfig(): ISymbology;

    abstract equals(other: Symbology): boolean;

    abstract toDict(): SymbologyDict;
}

export interface VectorSymbologyConfig extends ISymbology {
    fillRGBA: RgbaLike;
    strokeRGBA?: RgbaLike;
    strokeWidth?: number;
}

interface VectorSymbologyDict extends SymbologyDict {
    fillRGBA: RgbaTuple;
    strokeRGBA: RgbaTuple;
    strokeWidth: number;
}

export abstract class AbstractVectorSymbology extends Symbology {
    _fillColorBreakpoint: ColorBreakpoint = new ColorBreakpoint({rgba: DEFAULT_VECTOR_FILL_COLOR, value: 'Default fill color'});
    _strokeColorBreakpoint: ColorBreakpoint = new ColorBreakpoint({rgba: DEFAULT_VECTOR_STROKE_COLOR, value: 'Default stroke color'});

    // fillRGBA: Color = DEFAULT_VECTOR_FILL_COLOR;
    // strokeRGBA: Color = DEFAULT_VECTOR_STROKE_COLOR;
    strokeWidth = 1;

    abstract getOlStyle(): ol.style.Style | ol.StyleFunction;
    abstract describesArea(): boolean;
    abstract describesRadius(): boolean;

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

    getHighlightSymbology(): AbstractVectorSymbology {
        const highlightSymbology: AbstractVectorSymbology = this.clone() as AbstractVectorSymbology;

        highlightSymbology.fillRGBA = DEFAULT_VECTOR_HIGHLIGHT_FILL_COLOR;
        highlightSymbology.strokeRGBA = DEFAULT_VECTOR_HIGHLIGHT_STROKE_COLOR;

        return highlightSymbology;
    }

    getOlStyleAsFunction(): ol.StyleFunction {
        const style = this.getOlStyle();

        if (style instanceof OlStyleStyle) {
            return (feature: ol.Feature, resolution: number) => style;
        } else {
            return style as ol.StyleFunction;
        }
    }

    equals(other: AbstractVectorSymbology) {
        console.log('AbstractVectorSymbology', 'equals', this, other);
        return other
            && this.fillColorBreakpoint.equals(other.fillColorBreakpoint)
            && this.strokeColorBreakpoint.equals(other.strokeColorBreakpoint)
            && this.strokeWidth === other.strokeWidth
            && this.describesArea() === other.describesArea()
            && this.describesRadius() === other.describesRadius();
    }


    setFillColorBreakpoint(colorBreakpoint: ColorBreakpoint) {
            this.fillColorBreakpoint = colorBreakpoint;
    }

    setStrokeColorBreakpoint(colorBreakpoint: ColorBreakpoint) {
            this.strokeColorBreakpoint = colorBreakpoint;
    }

    constructor(config: VectorSymbologyConfig) {
        super();
        this.fillRGBA = Color.fromRgbaLike(config.fillRGBA);
        if (config.strokeRGBA) { this.strokeRGBA = Color.fromRgbaLike(config.strokeRGBA); }
        if (config.strokeWidth) { this.strokeWidth = config.strokeWidth; }
    }
}

export class SimpleVectorSymbology extends AbstractVectorSymbology {

    static fromConfig(config: VectorSymbologyConfig) {
        return new SimpleVectorSymbology(config);
    }

    constructor(config: VectorSymbologyConfig) {
        super(config);
    }

    getSymbologyType(): SymbologyType {
        return SymbologyType.SIMPLE_VECTOR;
    }

    clone(): SimpleVectorSymbology {
        return new SimpleVectorSymbology(this);
    }

    toConfig(): VectorSymbologyConfig {
        return this.clone();
    }

    getOlStyle(): ol.style.Style {
        return new OlStyleStyle({
            fill: new OlStyleFill({ color: this.fillRGBA.rgbaTuple() }),
            stroke: new OlStyleStroke({ color: this.strokeRGBA.rgbaTuple(), width: this.strokeWidth }),
        });
    }

    describesArea(): boolean {
        return true;
    }

    describesRadius(): boolean {
        return false;
    }

    toDict(): VectorSymbologyDict {
        return {
            symbologyType: SymbologyType[SymbologyType.SIMPLE_VECTOR],
            fillRGBA: this.fillRGBA.rgbaTuple(),
            strokeRGBA: this.strokeRGBA.rgbaTuple(),
            strokeWidth: this.strokeWidth,
        };
    }
}

export interface SimplePointSymbologyConfig extends VectorSymbologyConfig {
    radius?: number;
}

interface SimplePointSymbologyDict extends VectorSymbologyDict {
    radius: number;
}

export class SimplePointSymbology extends AbstractVectorSymbology implements SimplePointSymbologyConfig {
  radius = DEFAULT_POINT_RADIUS;

  constructor(config: SimplePointSymbologyConfig) {
      super(config);
      if (config.radius) {this.radius = config.radius; }
  }

  getSymbologyType(): SymbologyType {
      return SymbologyType.SIMPLE_POINT;
  }

  clone(): SimplePointSymbology {
      return new SimplePointSymbology(this);
  }

  toConfig(): SimplePointSymbologyConfig {
      return this.clone();
  }

  getOlStyle(): ol.style.Style {
      return new OlStyleStyle({
          image: new OlStyleCircle({
              radius: this.radius,
              fill: new OlStyleFill({ color: this.fillRGBA.rgbaTuple() }),
              stroke: new OlStyleStroke({ color: this.strokeRGBA.rgbaTuple(), width: this.strokeWidth }),
          }),
      });
  }

  describesArea(): boolean {
      return true;
  }
  describesRadius(): boolean {
      return true;
  }

  equals(other: AbstractVectorSymbology) {
      console.log('SimplePointSymbology', 'equals', this, other);
      if (other instanceof SimplePointSymbology) {
          return super.equals(other as AbstractVectorSymbology) && this.radius === other.radius;
      }
      return false;
  }

  toDict(): SimplePointSymbologyDict {
      return {
          symbologyType: SymbologyType[SymbologyType.SIMPLE_POINT],
          fillRGBA: this.fillRGBA.rgbaTuple(),
          strokeRGBA: this.strokeRGBA.rgbaTuple(),
          strokeWidth: this.strokeWidth,
          radius: this.radius,
      };
  }
}

export interface ComplexPointSymbologyConfig extends SimplePointSymbologyConfig {
    colorizer?: IColorizerData;
    colorAttribute?: string;
    radiusAttribute?: string;

    textAttribute?: string
    textColor?: RgbaLike;
    textStrokeWidth?: number;
}

interface ComplexPointSymbologyDict extends SimplePointSymbologyDict {
    colorizer: IColorizerData;
    colorAttribute: string;
    radiusAttribute: string;

    textAttribute: string;
    textColor: RgbaLike;
    textStrokeWidth: number;
}

export class ComplexPointSymbology extends SimplePointSymbology implements ComplexPointSymbologyConfig {
    colorizer: ColorizerData;
    colorAttribute: string = undefined;

    textAttribute: string = undefined;
    textColor: Color = undefined;
    textStrokeWidth: number = undefined;

    radiusAttribute: string = undefined;

    private styleCache: {[key: string]: OlStyleStyle} = {};

    constructor(config: ComplexPointSymbologyConfig) {
        super(config);
        // console.log('ComplexPointSymbology', config);
        if (config.colorAttribute) {
            this.colorAttribute = config.colorAttribute;
        }
        this.colorizer = (config.colorizer) ? ColorizerData.fromDict(config.colorizer) : ColorizerData.empty();

        if (config.textAttribute) {
            this.textAttribute = config.textAttribute;
            this.textColor = config.textColor ? Color.fromRgbaLike(config.textColor) : WHITE;
            this.textStrokeWidth = config.textStrokeWidth ? config.textStrokeWidth : Math.ceil(config.strokeWidth * 0.1);
        }
        if (config.radiusAttribute) {
            this.radiusAttribute = config.radiusAttribute;
        }
    }

    /**
     * Creates a ComplexPointSymbology where radiusAttribute and textAttribute are set to the strings returned by Mappings cluster operator
     * @param {ComplexPointSymbologyConfig} config
     * @returns {ComplexPointSymbology}
     */
    static createClusterSymbology(config: ComplexPointSymbologyConfig): ComplexPointSymbology {
        config['radiusAttribute'] = '___radius';
        config['textAttribute'] = '___numberOfPoints';

        return new ComplexPointSymbology(config);
    }

    static createSimpleSymbology(config: ComplexPointSymbologyConfig): ComplexPointSymbology {
        return new ComplexPointSymbology(config);
    }

    setColorAttribute(name: string, clr: ColorizerData = ColorizerData.empty()) {
        this.colorizer = clr;
        this.colorAttribute = name;
    }

    setOrUpdateColorizer(clr: ColorizerData): boolean {
        if (clr && (!this.colorizer || !clr.equals(this.colorizer))) {
            this.colorizer = clr;
            return true;
        }
        return false;
    }

    unSetColorAttribute() {
        this.colorAttribute = undefined;
        this.colorizer = ColorizerData.empty()
    }

    getSymbologyType(): SymbologyType {
        return SymbologyType.COMPLEX_POINT;
    }

    clone(): ComplexPointSymbology {
        return new ComplexPointSymbology(this);
    }

    equals(other: AbstractVectorSymbology) {
        console.log('ComplexPointSymbology', 'equals', this, other);
        if (other instanceof ComplexPointSymbology) {
            return super.equals(other as SimplePointSymbology)
                && this.colorizer && this.colorizer.equals(other.colorizer)
                && this.colorAttribute && other.colorAttribute && this.colorAttribute === other.colorAttribute
                && this.textColor && this.textColor.equals(other.textColor)
                && this.radiusAttribute && other.radiusAttribute && this.radiusAttribute === other.radiusAttribute
                && this.textStrokeWidth && other.textStrokeWidth && this.textStrokeWidth === other.textStrokeWidth
                && this.textAttribute && other.textAttribute && this.textAttribute === other.textAttribute;
        }
        return false;
    }

    toConfig(): ComplexPointSymbologyConfig {
        return this.clone();
    }

    getOlStyle(): ol.style.Style {
        return super.getOlStyle();
    }

    getOlStyleAsFunction(): ol.StyleFunction {
        return (feature: ol.Feature, resolution: number) => {

            // console.log(feature, this.colorAttribute, this.textAttribute, this.radiusAttribute);

            const featureColorValue = (this.colorAttribute) ? feature.get(this.colorAttribute) : undefined;
            const featureTextValue = (this.textAttribute) ? feature.get(this.textAttribute) : undefined;
            const featureRadiusValue = (this.radiusAttribute) ?  feature.get(this.radiusAttribute) : undefined;

            // console.log(featureColorValue, featureTextValue, featureRadiusValue);

            let styleKey = '';
            styleKey += (featureColorValue ? featureColorValue.toString() : '|||');
            styleKey += (':::' + (featureRadiusValue ? featureRadiusValue.toString() : '|||'));
            styleKey += (':::' + (featureTextValue ? featureTextValue.toString() : '|||'));

            // console.log("ComplexPointSymbology.getOlStyleAsFunction", "styleKey", styleKey);

            if (!this.styleCache[styleKey]) {

                const colorLookup = this.colorizer.getColorForValue(featureColorValue);
                const color = colorLookup ? colorLookup.rgbaTuple() : this.fillRGBA.rgbaTuple();
                const radius = featureRadiusValue ? featureRadiusValue as number : this.radius;

                // console.log("ComplexPointSymbology.getOlStyleAsFunction", colorLookup, color, radius);

                const imageStyle = new OlStyleCircle({
                        radius: radius,
                        fill: new OlStyleFill({ color: color }),
                        stroke: new OlStyleStroke({ color: this.strokeRGBA.rgbaTuple(), width: this.strokeWidth }),
                    });

                // only build the text style if we are going to show it
                const textStyle = (!featureTextValue) ? undefined : new OlStyleText({
                    text: featureTextValue.toString(),
                    fill: new OlStyleFill({
                        color: this.textColor.rgbaTuple(),
                    }),
                    stroke: new OlStyleStroke({
                        color: this.strokeRGBA.rgbaTuple(),
                        width: this.textStrokeWidth,
                    })
                });

                const style = new OlStyleStyle({
                    image: imageStyle,
                    text: textStyle
                });
                this.styleCache[styleKey] = style;
            }

            return this.styleCache[styleKey];
        };
    }

    describesArea(): boolean {
        return true;
    }
    describesRadius(): boolean {
        return true;
    }

    toDict(): ComplexPointSymbologyDict {
        return {
            symbologyType: SymbologyType[SymbologyType.COMPLEX_POINT],
            fillRGBA: this.fillRGBA.rgbaTuple(),
            strokeRGBA: this.strokeRGBA.rgbaTuple(),
            strokeWidth: this.strokeWidth,
            colorAttribute: this.colorAttribute,
            colorizer: this.colorizer ? this.colorizer.toDict() : undefined,
            radiusAttribute: this.radiusAttribute,
            radius: this.radius,
            textAttribute: this.textAttribute,
            textColor: this.textColor.rgbaTuple(),
            textStrokeWidth: this.textStrokeWidth,
        }
    }
}

export interface IRasterSymbology extends ISymbology {
    opacity?: number;
    hue?: number;
    saturation?: number;
    unit: Unit;
}

export interface RasterSymbologyDict extends SymbologyDict {
    opacity: number;
    hue: number;
    saturation: number;
    unit: UnitDict;
    colorizer?: IColorizerData;
    noDataColor?: ColorBreakpointDict;
    overflowColor?: ColorBreakpointDict;
}

export class RasterSymbology extends Symbology implements IRasterSymbology {
    opacity = 1;
    hue = 0;
    saturation = 0;
    unit: Unit;

    constructor(config: IRasterSymbology) {
        super();
        this.unit = config.unit;
        if (config.opacity) { this.opacity = config.opacity; }
        if (config.hue) { this.hue = config.hue; }
        if (config.saturation) { this.saturation = config.saturation; }
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
        console.log('RasterSymbology', 'equals', this, other);
        return this.saturation === other.saturation
            && this.opacity === other.opacity
            && this.hue === other.hue
            && this.unit === other.unit;
    }

    toDict(): RasterSymbologyDict {
        return {
            symbologyType: SymbologyType[SymbologyType.RASTER],
            opacity: this.opacity,
            hue: this.hue,
            saturation: this.saturation,
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
        // TODO don't create grayscale
        this.colorizer = (config.colorizer) ? new ColorizerData(config.colorizer) : ColorizerData.grayScaleColorizer(config.unit);
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
        console.log('MappingColorizerRasterSymbology', 'equals', this, other);
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
            hue: this.hue,
            saturation: this.saturation,
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
