import {Pipe, PipeTransform} from '@angular/core';
import {MappingColorizer} from './symbology.model';

@Pipe({name: 'waveWappingColorizerToGradient'})
export class MappingColorizerToGradientPipe implements PipeTransform {

    static colorsAsCssGradient(colorizer: MappingColorizer): string {
        const elementSize = 100.0 / colorizer.breakpoints.length;
        const halfElementSize = elementSize / 2.0;
        const breaks = colorizer.breakpoints;
        let colorStr = '';
        for (let i = 0; i < colorizer.breakpoints.length; i++) {
            colorStr += ', ' + breaks[i][1] + ' ' + (i * elementSize + halfElementSize) + '%';
        }

        let cssStr = 'linear-gradient(to bottom' + colorStr + ')';
        return cssStr;
    }

    transform(colorizer: MappingColorizer): string {
        const gradient = MappingColorizerToGradientPipe.colorsAsCssGradient(colorizer);
        // console.log('MappingColorizerToGradient.Pipe', gradient);
        return gradient;
    }
}
