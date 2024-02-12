import {Pipe, PipeTransform} from '@angular/core';
import {ColorBreakpoint} from '@geoengine/common';

@Pipe({name: 'breakpointToCssStringPipe'})
export class BreakpointToCssStringPipe implements PipeTransform {
    transform(br: ColorBreakpoint): string {
        return br.color.rgbaCssString();
    }
}
