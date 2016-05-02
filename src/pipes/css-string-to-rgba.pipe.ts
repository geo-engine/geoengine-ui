import {Pipe, PipeTransform} from "angular2/core";

@Pipe({name: "cssStringToRgbaPipe"})
export class CssStringToRgbaPipe implements PipeTransform {

  transform(rgba_css: string): Array<number> {
      let rgba = rgba_css.match(/^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+.*\d*)\s*\)$/i) || rgba_css.match(/^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
      if (rgba) {
          return [parseInt(rgba[1]), parseInt(rgba[2]), parseInt(rgba[3]), rgba[4] === undefined ? 1 : parseFloat(rgba[4])];
      }
      return [0, 0, 0, 1];
  }
}
