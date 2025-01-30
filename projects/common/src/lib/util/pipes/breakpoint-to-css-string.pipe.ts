import {Pipe, PipeTransform} from '@angular/core';
import {ColorBreakpoint} from '../../colors/color-breakpoint.model';

@Pipe({
    name: 'breakpointToCssStringPipe',
    standalone: false,
})
export class BreakpointToCssStringPipe implements PipeTransform {
    transform(br: ColorBreakpoint): string {
        return br.color.rgbaCssString();
    }
}
