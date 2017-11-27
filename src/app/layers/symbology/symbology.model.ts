import * as ol from 'openlayers';
import {Observable} from 'rxjs/Rx';
import {Unit, UnitDict, Interpolation} from '../../operators/unit.model';

export enum SymbologyType {
    RASTER,
    SIMPLE_POINT,
    CLUSTERED_POINT,
    SIMPLE_VECTOR,
    MAPPING_COLORIZER_RASTER,
    ICON_POINT,
}

/**
 * Serialization interface
 */
export interface SymbologyDict {
    symbologyType: string;
}

// tslint:disable-next-line: no-empty-interface
export interface ISymbology {}

export abstract class Symbology implements ISymbology {

    show = false;

    static fromDict(
        dict: SymbologyDict, deprecated?: any
    ): Symbology {
        switch (dict.symbologyType) {
            case SymbologyType[SymbologyType.SIMPLE_POINT]:
                return new SimplePointSymbology(dict as SimplePointSymbologyDict);
            case SymbologyType[SymbologyType.CLUSTERED_POINT]:
                return new ClusteredPointSymbology(dict as VectorSymbologyDict);
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
                        colorizer: new MappingRasterColorizer(mappingColorizerRasterSymbologyDict.colorizer)
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

    abstract toConfig(): ISymbology;

    abstract toDict(): SymbologyDict;
}

export interface IVectorSymbology extends ISymbology {
    fillRGBA: [number, number, number, number];
    strokeRGBA?: [number, number, number, number];
    strokeWidth?: number;
}

interface VectorSymbologyDict extends SymbologyDict {
    fillRGBA: [number, number, number, number];
    strokeRGBA?: [number, number, number, number];
    strokeWidth?: number;
}

export abstract class AbstractVectorSymbology extends Symbology implements IVectorSymbology {
    fillRGBA: [number, number, number, number];
    strokeRGBA: [number, number, number, number] = [0, 0, 0, 1];
    strokeWidth = 1;

    abstract getOlStyle(): ol.style.Style | ol.StyleFunction;
    abstract describesArea(): boolean;
    abstract describesRadius(): boolean;

    getHighlightSymbology(): AbstractVectorSymbology {
        const highlightSymbology: AbstractVectorSymbology = this.clone() as AbstractVectorSymbology;

        highlightSymbology.fillRGBA = [0, 153, 255, 1];
        highlightSymbology.strokeRGBA = [255, 255, 255, 1];

        return highlightSymbology;
    }

    getOlStyleAsFunction(): ol.StyleFunction {
        const style = this.getOlStyle();

        if (style instanceof ol.style.Style) {
            return (feature: ol.Feature, resolution: number) => style;
        } else {
            return style as ol.StyleFunction;
        }
    }

    constructor(config: IVectorSymbology) {
        super();
        this.fillRGBA = config.fillRGBA;
        if (config.strokeRGBA) { this.strokeRGBA = config.strokeRGBA; }
        if (config.strokeWidth) { this.strokeWidth = config.strokeWidth; }
    }
}

export class SimpleVectorSymbology extends AbstractVectorSymbology {

    static fromConfig(config: IVectorSymbology) {
        return new SimpleVectorSymbology(config);
    }

    constructor(config: IVectorSymbology) {
        super(config);
    }

    getSymbologyType(): SymbologyType {
        return SymbologyType.SIMPLE_VECTOR;
    }

    clone(): SimpleVectorSymbology {
        return new SimpleVectorSymbology(this);
    }

    toConfig(): IVectorSymbology {
        return this.clone();
    }

    getOlStyle(): ol.style.Style {
        return new ol.style.Style({
            fill: new ol.style.Fill({ color: this.fillRGBA }),
            stroke: new ol.style.Stroke({ color: this.strokeRGBA, width: this.strokeWidth }),
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
            fillRGBA: this.fillRGBA,
            strokeRGBA: this.strokeRGBA,
            strokeWidth: this.strokeWidth,
        };
    }
}

export interface ISimplePointSymbology extends IVectorSymbology {
    radius?: number;
}

interface SimplePointSymbologyDict extends VectorSymbologyDict {
    radius: number;
}

export class SimplePointSymbology extends AbstractVectorSymbology implements ISimplePointSymbology {
  radius = 5;

  constructor(config: ISimplePointSymbology) {
      super(config);
      if (config.radius) {this.radius = config.radius; }
  }

  getSymbologyType(): SymbologyType {
      return SymbologyType.SIMPLE_POINT;
  }

  clone(): SimplePointSymbology {
      return new SimplePointSymbology(this);
  }

  toConfig(): ISimplePointSymbology {
      return this.clone();
  }

  getOlStyle(): ol.style.Style {
      return new ol.style.Style({
          image: new ol.style.Circle({
              radius: this.radius,
              fill: new ol.style.Fill({ color: this.fillRGBA }),
              stroke: new ol.style.Stroke({ color: this.strokeRGBA, width: this.strokeWidth }),
          }),
      });
  }

  describesArea(): boolean {
      return true;
  }
  describesRadius(): boolean {
      return true;
  }

  toDict(): SimplePointSymbologyDict {
      return {
          symbologyType: SymbologyType[SymbologyType.SIMPLE_POINT],
          fillRGBA: this.fillRGBA,
          strokeRGBA: this.strokeRGBA,
          strokeWidth: this.strokeWidth,
          radius: this.radius,
      };
  }
}

export class ClusteredPointSymbology extends AbstractVectorSymbology {

    private textRGBA: [number, number, number, number];
    private textStrokeWidth: number;

    constructor(config: IVectorSymbology) {
        super(config);

        const white = 255;
        const black = 0;
        const maxOpacity = 1;

        const colorDifference = (colorElement: number, color: Array<number>) => {
            return Array(3).fill(colorElement).map(
                (baseColor, i) => Math.pow(baseColor - color[i], 2)
            ).reduce((acc, value) => acc + value);
        };

        if (colorDifference(white, config.fillRGBA) > colorDifference(black, config.fillRGBA)) {
            this.textRGBA = [white, white, white, maxOpacity];
        } else {
            this.textRGBA = [black, black, black, maxOpacity];
        }

        this.textStrokeWidth = Math.ceil(config.strokeWidth * 0.1);
    }

    getSymbologyType(): SymbologyType {
        return SymbologyType.CLUSTERED_POINT;
    }

    clone(): ClusteredPointSymbology {
        return new ClusteredPointSymbology(this);
    }

    toConfig(): IVectorSymbology {
        return this.clone();
    }

    getOlStyle(): ol.StyleFunction {
        return (feature, resolution) => {
            const numberOfPoints = feature.get('___numberOfPoints') as number;
            const numberOfPointsString = numberOfPoints > 1 ? numberOfPoints.toString() : '';
            const radius = parseFloat(feature.get('___radius'));

            return new ol.style.Style({
                image: new ol.style.Circle({
                    radius: radius,
                    fill: new ol.style.Fill({
                        color: this.fillRGBA,
                    }),
                    stroke: new ol.style.Stroke({
                        color: this.strokeRGBA,
                        width: this.strokeWidth,
                    }),
                }),
                text: new ol.style.Text({
                    text: numberOfPointsString,
                    fill: new ol.style.Fill({
                        color: this.textRGBA,
                    }),
                    stroke: new ol.style.Stroke({
                        color: this.strokeRGBA,
                        width: this.textStrokeWidth,
                    }),
                }),
            });
        };
    }

    describesArea(): boolean {
        return true;
    }
    describesRadius(): boolean {
        return false;
    }

    getHighlightSymbology(): AbstractVectorSymbology {
        const highlightSymbology: ClusteredPointSymbology = super.getHighlightSymbology() as ClusteredPointSymbology;

        highlightSymbology.textRGBA = [255, 255, 255, 1];

        return highlightSymbology;
    }

    toDict(): VectorSymbologyDict {
        return {
            symbologyType: SymbologyType[SymbologyType.CLUSTERED_POINT],
            fillRGBA: this.fillRGBA,
            strokeRGBA: this.strokeRGBA,
            strokeWidth: this.strokeWidth,
        };
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
    colorizer?: MappingRasterColorizer;
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

export interface MappingColorizer {
    interpolation: string;
    breakpoints: Array<[number, string, string]>;
    result?: string | number;
}

export interface IMappingRasterColorizer {
    breakpoints: Array<MappingRasterColorizerBreakpoint>;
}

export interface MappingRasterColorizerBreakpoint {
    value: number;
    r: number;
    g: number;
    b: number;
    a?: number;
    name?: string;
}

export class MappingRasterColorizer implements IMappingRasterColorizer {
    breakpoints: Array<MappingRasterColorizerBreakpoint>;

    static grayScaleMappingColorizer(unit: Unit): MappingRasterColorizer {
        console.log("grayScaleMappingColorizer", unit);

        const min_br: MappingRasterColorizerBreakpoint = {
            value: (unit.min) ? unit.min : 0,
            r: 0,
            g: 0,
            b: 0,
            a: 255,
            name: 'min'
        };

        const max_br: MappingRasterColorizerBreakpoint = {
            value: (unit.max) ? unit.max : 1000,
            r: 255,
            g: 255,
            b: 255,
            a: 255,
            name: 'max'
        };

        return new MappingRasterColorizer({
            breakpoints: [min_br, max_br]
        });
    }

    constructor(config: IMappingRasterColorizer) {
        this.breakpoints = config.breakpoints;
    }

    clone(): MappingRasterColorizer {
        return new MappingRasterColorizer(this);
    }

    asMappingRequestString(): string {
        return JSON.stringify ( this as IMappingRasterColorizer );
    }
}


export interface IColorizerRasterSymbology extends IRasterSymbology {
    colorizer?: IMappingRasterColorizer;
}

export class MappingColorizerRasterSymbology extends RasterSymbology
    implements IColorizerRasterSymbology {

    colorizer: MappingRasterColorizer;

    constructor(config: IColorizerRasterSymbology) {
        super(config);
        console.log("MappingColorizerRasterSymbology.constructor", config);
        const colorizerConfig = (config.colorizer) ? config.colorizer : MappingRasterColorizer.grayScaleMappingColorizer(config.unit); // TODO don't create grayscale
        this.colorizer = new MappingRasterColorizer(colorizerConfig);
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

    toDict(): RasterSymbologyDict {
        return {
            symbologyType: SymbologyType[SymbologyType.MAPPING_COLORIZER_RASTER],
            opacity: this.opacity,
            hue: this.hue,
            saturation: this.saturation,
            unit: this.unit.toDict(),
            colorizer: this.colorizer,
        };
    }
}
