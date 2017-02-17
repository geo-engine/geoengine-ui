import * as ol from 'openlayers';
import {Observable} from 'rxjs/Rx';
import {Unit, UnitDict, Interpolation} from '../app/operators/unit.model';

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

export interface ISymbology {
}

export abstract class Symbology implements ISymbology {
    static fromDict(
        dict: SymbologyDict, colorizerObservable?: Observable<MappingColorizer>
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
                return new MappingColorizerRasterSymbology(
                    {
                        hue: mappingColorizerRasterSymbologyDict.hue,
                        opacity: mappingColorizerRasterSymbologyDict.opacity,
                        saturation: mappingColorizerRasterSymbologyDict.saturation,
                        unit: Unit.fromDict(mappingColorizerRasterSymbologyDict.unit),
                    },
                    colorizerObservable
                );
            default:
                throw 'Unsupported Symbology';
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
    strokeWidth: number = 1;

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

    constructor(config: IVectorSymbology) {
        super(config);
    }

    static fromConfig(config: IVectorSymbology) {
        return new SimpleVectorSymbology(config);
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
    describesRadius(): boolean{
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
  radius: number = 5;

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
  describesRadius(): boolean{
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

            const style = new ol.style.Style({
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

            return style;
        };
    }

    describesArea(): boolean {
        return true;
    }
    describesRadius(): boolean{
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
}

export class RasterSymbology extends Symbology implements IRasterSymbology {
    opacity: number = 1;
    hue: number = 0;
    saturation: number = 0;
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
}

export class MappingColorizerRasterSymbology extends RasterSymbology
    implements IRasterSymbology {

    colorizer$: Observable<MappingColorizer>;

    constructor(config: IRasterSymbology,
                colorizer$: Observable<MappingColorizer>) {
        super(config);
        this.colorizer$ = colorizer$;
    }

    getSymbologyType(): SymbologyType {
        return SymbologyType.MAPPING_COLORIZER_RASTER;
    }

    toConfig(): IRasterSymbology {
        return super.clone() as IRasterSymbology;
    }

    clone(): MappingColorizerRasterSymbology {
        return new MappingColorizerRasterSymbology(this, this.colorizer$);
    }

    toDict(): RasterSymbologyDict {
        return {
            symbologyType: SymbologyType[SymbologyType.MAPPING_COLORIZER_RASTER],
            opacity: this.opacity,
            hue: this.hue,
            saturation: this.saturation,
            unit: this.unit.toDict(),
        };
    }

}
