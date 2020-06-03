import {Pipe, PipeTransform} from '@angular/core';
import {IColorizerData} from '../colorizer-data.model';
import {Colormap, ColormapNames, ColormapStepScale} from '../colormaps/colormap.model';

/**
 * A pipe to transform a colormap into a colorizer data.
 */
@Pipe({name: 'waveColormapNameToColorizerData'})
export class ColormapNameToColorizerDataPipe implements PipeTransform {

    transform(
        colormapName: ColormapNames, min: number = 0, max: number = 0, steps: number = 10, stepScale: ColormapStepScale = 'linear'
    ): IColorizerData {
        return Colormap.createColorizerDataWithName(colormapName, min, max, steps, stepScale);
    }
}
