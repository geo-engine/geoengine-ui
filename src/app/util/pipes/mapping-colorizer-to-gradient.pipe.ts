import {Pipe, PipeTransform} from '@angular/core';
import {IColorizerData} from '../../colors/colorizer-data.model';
import {Color} from '../../colors/color';

@Pipe({name: 'waveWappingColorizerToGradient'})
export class MappingColorizerToGradientPipe implements PipeTransform {

    static rgbaString(r: number, g: number, b: number, a?: number): string {
        const alpha = (!!a) ? (a / 255.0) : 1.0;
        return 'rgba(' + r.toString() + ',' + g.toString() + ',' + b.toString() + ',' + alpha.toString() + ')'
    }

    static colorsRgbaAsCssGradient(colorizer: IColorizerData): string {
        const elementSize = 100.0 / colorizer.breakpoints.length;
        const halfElementSize = elementSize / 2.0;
        const breaks = colorizer.breakpoints;
        let colorStr = '';
        for (let i = 0; i < breaks.length; i++) {
            const br = breaks[i];
            colorStr += ', ';
            colorStr += Color.rgbaToCssString(br.rgba) + ' ' + (i * elementSize + halfElementSize) + '%';
        }

        const cssStr = 'linear-gradient(to bottom' + colorStr + ')';
        return cssStr;
    }

    transform(colorizer: IColorizerData): string {
        const gradient = MappingColorizerToGradientPipe.colorsRgbaAsCssGradient(colorizer);
        return gradient;
    }
}
