import {Pipe, PipeTransform} from '@angular/core';
import {MappingRasterColorizerBreakpoint} from '../../layers/symbology/symbology.model';


@Pipe({name: 'breakpointToCssStringPipe'})
export class BreakpointToCssStringPipe implements PipeTransform {

  transform(br: MappingRasterColorizerBreakpoint): string {
    const alpha = (br.a) ? br.a : 1.0;
    return 'rgba(' + br.r + ',' + br.g + ',' + br.b + ',' + alpha + ')';
  }
}
