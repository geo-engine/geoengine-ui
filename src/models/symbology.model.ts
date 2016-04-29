import ol from "openlayers";

export abstract class Symbology {
    abstract get olStyle(): ol.style.Style; // Map<ol.geom.GeometryType, Array<ol.style.Style>>;

    abstract clone(): Symbology;

    static randomSimplePointSymbology(): SimplePointSymbology {
        return new SimplePointSymbology("#ff0000");
    }

    static randomSimpleVectorSymbology(): SimpleVectorSymbology {
        return new SimpleVectorSymbology("#ff0000");
    }
};

export class SimpleVectorSymbology extends Symbology {
    fill_color: ol.Color | string = "#ff0000";
    stroke_color: ol.Color | string = "#000000";
    stroke_width: number = 1;
    opacity: number = 0.5;

    constructor(fill_color: ol.Color | string) {
        super();
        this.fill_color = fill_color;
    }

    clone(): SimpleVectorSymbology {
        return new SimpleVectorSymbology(this.fill_color);
    }

    get olStyle(): ol.style.Style {
        return new ol.style.Style({
            fill: new ol.style.Fill({ color: this.fill_color }),
            stroke: new ol.style.Stroke({ color: this.stroke_color, width: this.stroke_width })
        });
    }
}

export abstract class RasterSymbology extends Symbology {}

export class SimplePointSymbology extends Symbology {
  fill_color: ol.Color | string = "#ff0000";
  stroke_color: ol.Color | string = "#000000";
  stroke_width: number = 1;
  radius: number = 5;

  constructor(fill_color: ol.Color | string) {
      super();
      this.fill_color = fill_color;
  }

  clone(): SimplePointSymbology {
      let clone = new SimplePointSymbology(this.fill_color);
      // clone.fill_color = this.fill_color;
      clone.stroke_color = this.stroke_color;
      clone.stroke_width = this.stroke_width;
      clone.radius = this.radius;
      return clone;
  }

  get olStyle(): ol.style.Style {
      return new ol.style.Style({
          image: new ol.style.Circle({
              radius: this.radius,
              fill: new ol.style.Fill({ color: this.fill_color }),
              stroke: new ol.style.Stroke({ color: this.stroke_color, width: this.stroke_width })
          })
      });
  }
}
