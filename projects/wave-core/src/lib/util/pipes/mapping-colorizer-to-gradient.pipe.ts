import {Pipe, PipeTransform} from '@angular/core';
import {IColorizerData} from '../../colors/colorizer-data.model';
import {Color} from '../../colors/color';

/**
 * Pipe to transform colorizer data into a css string.
 */
@Pipe({name: 'waveWappingColorizerToGradient'})
export class MappingColorizerToGradientPipe implements PipeTransform {
    /**
     * Transform red, green, blue, and alpha values into a css string.
     */
    static rgbaString(r: number, g: number, b: number, a?: number): string {
        const alpha = !!a ? a / 255.0 : 1.0;
        return 'rgba(' + r.toString() + ',' + g.toString() + ',' + b.toString() + ',' + alpha.toString() + ')';
    }

    /**
     * Transform colorizer data into a css gradient.
     */
    static colorsRgbaAsCssGradient(colorizer: IColorizerData, angle: number = 180): string {
        const elementSize = 100.0 / colorizer.breakpoints.length;
        const halfElementSize = elementSize / 2.0;
        const breaks = colorizer.breakpoints;

        const validAngle = angle !== undefined ? angle % 360.0 : 180;

        let colorStr = '';
        for (let i = 0; i < breaks.length; i++) {
            const br = breaks[i];
            colorStr += ', ';
            colorStr += Color.rgbaToCssString(br.rgba) + ' ' + (i * elementSize + halfElementSize) + '%';
        }

        const cssStr = 'linear-gradient(' + validAngle + 'deg ' + colorStr + ')';
        return cssStr;
    }

    /**
     * Transform colorizer data into a css gradient.
     */
    transform(colorizer: IColorizerData, angle: number = 180): string {
        const gradient = MappingColorizerToGradientPipe.colorsRgbaAsCssGradient(colorizer, angle);
        return gradient;
    }
}
