import {Pipe, PipeTransform} from '@angular/core';
import {IMappingRasterColorizer, MappingColorizer} from './symbology.model';

@Pipe({name: 'waveWappingColorizerToGradient'})
export class MappingColorizerToGradientPipe implements PipeTransform {

    static colorsHexAsCssGradient(colorizer: MappingColorizer): string {
        const elementSize = 100.0 / colorizer.breakpoints.length;
        const halfElementSize = elementSize / 2.0;
        const breaks = colorizer.breakpoints;
        let colorStr = '';
        for (let i = 0; i < breaks.length; i++) {
            colorStr += ', ' + breaks[i][1] + ' ' + (i * elementSize + halfElementSize) + '%';
        }

        let cssStr = 'linear-gradient(to bottom' + colorStr + ')';
        return cssStr;
    }

    static rgbaString(r: number, g: number, b: number, a?: number): string {
        const alpha = (!!a) ? (a / 255.0) : 1.0;
        return 'rgba(' + r.toString() + ',' + g.toString() + ',' + b.toString() + ',' + alpha.toString() + ')'
    }

    static colorsRgbaAsCssGradient(colorizer: IMappingRasterColorizer): string {
        const elementSize = 100.0 / colorizer.breakpoints.length;
        const halfElementSize = elementSize / 2.0;
        const breaks = colorizer.breakpoints;
        let colorStr = '';
        for (let i = 0; i < breaks.length; i++) {
            const br = breaks[i];
            // console.log("MappingColorizerToGradientPipe.colorsRgbaAsCssGradient", br, MappingColorizerToGradientPipe.rgbaString(br.r, br.g, br.b, br.a));
            colorStr += ', ' + MappingColorizerToGradientPipe.rgbaString(br.r, br.g, br.b, br.a) + ' ' + (i * elementSize + halfElementSize) + '%';
        }

        const cssStr = 'linear-gradient(to bottom' + colorStr + ')';
        // console.log("MappingColorizerToGradientPipe.colorsRgbaAsCssGradient", cssStr);
        return cssStr;
    }

    transform(colorizer: IMappingRasterColorizer): string {
        const gradient = MappingColorizerToGradientPipe.colorsRgbaAsCssGradient(colorizer);
        console.log('MappingColorizerToGradient.Pipe', gradient);
        return gradient;
    }
}
