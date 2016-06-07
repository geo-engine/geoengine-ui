import ol from 'openlayers';
import {Observable} from 'rxjs/Rx';
import {Unit, Interpolation} from '../operators/unit.model';

export enum SymbologyType {
    RASTER,
    SIMPLE_POINT,
    SIMPLE_VECTOR,
    MAPPING_COLORIZER_RASTER,
    ICON_POINT,
}

/**
 * Serialization interface
 */
 export interface SymbologyDict {
     symbologyTypeId: string;
     symbologyConfig: ISymbology;
 }

export interface ISymbology {
}

export abstract class Symbology implements ISymbology {
    static fromDict(dict: SymbologyDict, colorizerObservable?: Observable<MappingColorizer>): Symbology {
        let symbologyType: SymbologyType = SymbologyType[dict.symbologyTypeId];
        switch (symbologyType) {
            case SymbologyType.SIMPLE_POINT:
                return new SimplePointSymbology(dict.symbologyConfig as IVectorSymbology);
            case SymbologyType.SIMPLE_VECTOR:
                return new SimpleVectorSymbology(dict.symbologyConfig as IVectorSymbology);
            case SymbologyType.RASTER:
                return new RasterSymbology(dict.symbologyConfig as IRasterSymbology);
            case SymbologyType.MAPPING_COLORIZER_RASTER:
                return new MappingColorizerRasterSymbology(
                    dict.symbologyConfig as IRasterSymbology,
                    colorizerObservable);
        }
    }

    abstract get symbologyType(): SymbologyType;

    get symbologyTypeId(): string {
        return SymbologyType[this.symbologyType];
    }

    abstract clone(): Symbology;

    abstract toConfig(): ISymbology;

    toDict(): SymbologyDict {
        return {
            symbologyTypeId: this.symbologyTypeId,
            symbologyConfig: this.toConfig(),
        };
    }
};

export interface IVectorSymbology extends ISymbology {
    fill_rgba: [number, number, number, number];
    stroke_rgba?: [number, number, number, number];
    stroke_width?: number;
}

export abstract class AbstractVectorSymbology extends Symbology implements IVectorSymbology {
    fill_rgba: [number, number, number, number];
    stroke_rgba: [number, number, number, number] = [0, 0, 0, 1];
    stroke_width: number = 1;

    abstract get olStyle(): ol.style.Style;
    abstract get describesArea(): boolean;
    abstract get describesRadius(): boolean;

    constructor(config: IVectorSymbology) {
        super();
        this.fill_rgba = config.fill_rgba;
        if (config.stroke_rgba) { this.stroke_rgba = config.stroke_rgba; };
        if (config.stroke_width) { this.stroke_width = config.stroke_width; };
    }
}

export class SimpleVectorSymbology extends AbstractVectorSymbology {

    constructor(config: IVectorSymbology) {
        super(config);
    }

    static fromConfig(config: IVectorSymbology) {
        return new SimpleVectorSymbology(config);
    }

    get symbologyType(): SymbologyType {
        return SymbologyType.SIMPLE_VECTOR;
    }

    clone(): SimpleVectorSymbology {
        return new SimpleVectorSymbology(this);
    }

    toConfig(): IVectorSymbology {
        return this.clone();
    }

    get olStyle(): ol.style.Style {
        return new ol.style.Style({
            fill: new ol.style.Fill({ color: this.fill_rgba }),
            stroke: new ol.style.Stroke({ color: this.stroke_rgba, width: this.stroke_width }),
        });
    }

    get describesArea(): boolean {
        return true;
    }
    get describesRadius(): boolean{
        return false;
    }
}

export interface ISimplePointSymbology extends IVectorSymbology {
    radius?: number;
}

export class SimplePointSymbology extends AbstractVectorSymbology implements ISimplePointSymbology {
  radius: number = 5;

  constructor(config: ISimplePointSymbology) {
      super(config);
      if (config.radius) {this.radius = config.radius; }
  }

  get symbologyType(): SymbologyType {
      return SymbologyType.SIMPLE_POINT;
  }

  clone(): SimplePointSymbology {
      return new SimplePointSymbology(this);
  }

  toConfig(): ISimplePointSymbology {
      return this.clone();
  }

  get olStyle(): ol.style.Style {
      return new ol.style.Style({
          image: new ol.style.Circle({
              radius: this.radius,
              fill: new ol.style.Fill({ color: this.fill_rgba }),
              stroke: new ol.style.Stroke({ color: this.stroke_rgba, width: this.stroke_width }),
          }),
      });
  }

  get describesArea(): boolean {
      return true;
  }
  get describesRadius(): boolean{
      return true;
  }
}

export interface IRasterSymbology extends ISymbology {
    opacity?: number;
    hue?: number;
    saturation?: number;
    unit: Unit;
}

export class RasterSymbology extends Symbology implements IRasterSymbology {
    opacity: number = 1;
    hue: number = 0;
    saturation: number = 0;
    unit: Unit;

    constructor(config: IRasterSymbology) {
        super();
        this.unit = config.unit;
        if (config.opacity) { this.opacity = config.opacity; };
        if (config.hue) { this.hue = config.hue; };
        if (config.saturation) { this.saturation = config.saturation; };
    }

    isContinuous() {
        return this.unit.interpolation === Interpolation.Continuous;
    }

    isDiscrete() {
        return this.unit.interpolation === Interpolation.Discrete;
    }

    get symbologyType(): SymbologyType {
        return SymbologyType.RASTER;
    }

    toConfig(): IRasterSymbology {
        return this.clone();
    }

    clone(): RasterSymbology {
        return new RasterSymbology(this);
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

    get symbologyType(): SymbologyType {
        return SymbologyType.MAPPING_COLORIZER_RASTER;
    }

    toConfig(): IRasterSymbology {
        return super.clone() as IRasterSymbology;
    }

    clone(): MappingColorizerRasterSymbology {
        return new MappingColorizerRasterSymbology(this, this.colorizer$);
    }

}
