import ol from "openlayers";

export abstract class Symbology {
    abstract clone(): Symbology;

    static randomSimplePointSymbology(): SimplePointSymbology {
        return new SimplePointSymbology([255, 0, 0, 0.8]);
    }

    static randomSimpleVectorSymbology(): SimpleVectorSymbology {
        return new SimpleVectorSymbology([255, 0, 0, 0.8]);
    }

};

export abstract class AbstractVectorSymbology extends Symbology {
    fill_rgba: Array<number> = [255, 0, 0, 0.8]; // TODO: maybe a new iterface rgba? or just [number]?
    stroke_rgba: Array<number> = [0, 0, 0, 1];
    stroke_width: number = 1;

    abstract get olStyle(): ol.style.Style;

    constructor(fill_rgba: Array<number>) {
        super();
        this.fill_rgba = fill_rgba;
    }

}

export class SimpleVectorSymbology extends AbstractVectorSymbology {

    constructor(fill_color: Array<number>) {
        super(fill_color);
    }

    clone(): SimpleVectorSymbology {
        let clone = new SimpleVectorSymbology(this.fill_rgba);
        // clone.fill_rgba = this.fill_rgba;
        clone.stroke_rgba = this.stroke_rgba;
        clone.stroke_width = this.stroke_width;
        return clone;
    }

    get olStyle(): ol.style.Style {
        return new ol.style.Style({
            fill: new ol.style.Fill({ color: this.fill_rgba }),
            stroke: new ol.style.Stroke({ color: this.stroke_rgba, width: this.stroke_width })
        });
    }
}

export class SimplePointSymbology extends AbstractVectorSymbology {
  radius: number = 5;

  constructor(fill_rgba: Array<number>) {
      super(fill_rgba);
  }

  clone(): SimplePointSymbology {
      let clone = new SimplePointSymbology(this.fill_rgba);
      // clone.fill_rgba = this.fill_rgba;
      clone.stroke_rgba = this.stroke_rgba;
      clone.stroke_width = this.stroke_width;
      clone.radius = this.radius;
      return clone;
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

export class RasterSymbology extends Symbology {
    opacity: number = 1;
    hue: number = 0;
    saturation: number = 0;

    constructor(opacity: number) {
        super();
        this.opacity = opacity;
    }


    clone(): RasterSymbology {
        let clone = new RasterSymbology(this.opacity);
        clone.saturation = this.saturation;
        clone.hue = this.hue;
        return clone;
    }

}
