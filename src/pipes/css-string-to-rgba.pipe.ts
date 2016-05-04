import {Pipe, PipeTransform} from "angular2/core";

@Pipe({name: "cssStringToRgbaPipe"})
export class CssStringToRgbaPipe implements PipeTransform {

  transform(rgba_css: string): [number, number, number, number] {
      let rgba = rgba_css.match(/^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+.*\d*)\s*\)$/i) || rgba_css.match(/^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
      if (rgba) {
          return [parseInt(rgba[1]), parseInt(rgba[2]), parseInt(rgba[3]), rgba[4] === undefined ? 1 : parseFloat(rgba[4])];
      }

      let threeDigit = rgba_css.match(/^#([0-9a-f]{3})$/i)[1];
      if (threeDigit) {
          // in three-character format, each value is multiplied by 0x11 to give an
          // even scale from 0x00 to 0xff
          return [
              parseInt(threeDigit.charAt(0), 16) * 0x11,
              parseInt(threeDigit.charAt(1), 16) * 0x11,
              parseInt(threeDigit.charAt(2), 16) * 0x11,
              1
          ];
      }

      let sixDigit = rgba_css.match(/^#([0-9a-f]{6})$/i)[1];
      if (sixDigit) {
          return [
             parseInt(sixDigit.substr(0, 2), 16),
             parseInt(sixDigit.substr(2, 2), 16),
             parseInt(sixDigit.substr(4, 2), 16),
             1
         ];
     }
  }
}
