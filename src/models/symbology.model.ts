import ol from "openlayers";

export enum SymbologyType {
    RASTER,
    SIMPLE_POINT,
    SIMPLE_VECTOR,
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

    static fromDict(dict: SymbologyDict): Symbology {
        let symbologyType: SymbologyType = SymbologyType[dict.symbologyTypeId];
        switch (symbologyType) {
            case SymbologyType.SIMPLE_POINT: return new SimplePointSymbology(dict.symbologyConfig);
            case SymbologyType.SIMPLE_VECTOR: return new SimpleVectorSymbology(dict.symbologyConfig);
            case SymbologyType.RASTER: return new RasterSymbology(dict.symbologyConfig);
        }
    }
};

export interface IVectorSymbology extends ISymbology {
    fill_rgba?: Array<number>;
    stroke_rgba?: Array<number>;
    stroke_width?: number;
}

export abstract class AbstractVectorSymbology extends Symbology implements IVectorSymbology {
    fill_rgba: Array<number> = [255, 0, 0, 0.8]; // TODO: maybe a new iterface rgba? or just [number]?
    stroke_rgba: Array<number> = [0, 0, 0, 1];
    stroke_width: number = 1;

    abstract get olStyle(): ol.style.Style;

    constructor(config: IVectorSymbology) {
        super();
        if (config.fill_rgba) this.fill_rgba = config.fill_rgba;
        if (config.stroke_rgba) this.stroke_rgba = config.stroke_rgba;
        if (config.stroke_width) this.stroke_width = config.stroke_width;
    }

}

export class SimpleVectorSymbology extends AbstractVectorSymbology {

    constructor(config: IVectorSymbology) {
        super(config);
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

    static fromConfig(config: IVectorSymbology) {
        return new SimpleVectorSymbology(config);
    }

    get olStyle(): ol.style.Style {
        return new ol.style.Style({
            fill: new ol.style.Fill({ color: this.fill_rgba }),
            stroke: new ol.style.Stroke({ color: this.stroke_rgba, width: this.stroke_width })
        });
    }
}

export interface ISimplePointSymbology extends IVectorSymbology {
    radius?: number;
}

export class SimplePointSymbology extends AbstractVectorSymbology implements ISimplePointSymbology {
  radius: number = 5;

  constructor(config: ISimplePointSymbology) {
      super(config);
      if (config.radius) this.radius = config.radius;
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
              stroke: new ol.style.Stroke({ color: this.stroke_rgba, width: this.stroke_width })
          })
      });
  }
}

export interface IRasterSymbology extends ISymbology {
    opacity?: number;
    hue?: number;
    saturation?: number;
}

export class RasterSymbology extends Symbology implements IRasterSymbology {
    opacity: number = 1;
    hue: number = 0;
    saturation: number = 0;

    constructor(config: IRasterSymbology) {
        super();
        if (config.opacity) this.opacity = config.opacity;
        if (config.hue) this.hue = config.hue;
        if (config.saturation) this.saturation = config.saturation;
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
