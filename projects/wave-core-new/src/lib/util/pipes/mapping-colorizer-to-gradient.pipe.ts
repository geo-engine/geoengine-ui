import {Pipe, PipeTransform} from '@angular/core';
import {Color} from '../../colors/color';
import {Colorizer} from '../../colors/colorizer.model';

/**
 * Pipe to transform colorizer data into a css string.
 */
@Pipe({name: 'waveWappingColorizerToGradient'})
export class MappingColorizerToGradientPipe implements PipeTransform {
    /**
     * Transform red, green, blue, and alpha values into a css string.
     */
    static rgbaString(r: number, g: number, b: number, a?: number): string {
        const alpha = a ?? 1.0;
        return 'rgba(' + r.toString() + ',' + g.toString() + ',' + b.toString() + ',' + alpha.toString() + ')';
    }

    /**
     * Transform colorizer data into a css gradient.
     */
    static colorsRgbaAsCssGradient(colorizer: Colorizer, angle: number = 180): string {
        const numColors = colorizer.getNumberOfColors();
        const elementSize = 100.0 / numColors;
        const halfElementSize = elementSize / 2.0;

        const validAngle = angle !== undefined ? angle % 360.0 : 180;

        let colorStr = '';
        for (let i = 0; i < numColors; i++) {
            const color = colorizer.getColorAtIndex(i);
            colorStr += ', ';
            colorStr += Color.rgbaToCssString(color) + ' ' + (i * elementSize + halfElementSize) + '%';
        }

        const cssStr = 'linear-gradient(' + validAngle + 'deg ' + colorStr + ')';
        return cssStr;
    }

    /**
     * Transform colorizer data into a css gradient.
     */
    transform(colorizer: Colorizer, angle: number = 180): string {
        const gradient = MappingColorizerToGradientPipe.colorsRgbaAsCssGradient(colorizer, angle);
        return gradient;
    }
}
