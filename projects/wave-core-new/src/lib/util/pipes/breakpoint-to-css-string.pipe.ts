import {Pipe, PipeTransform} from '@angular/core';
import {ColorBreakpointDict} from '../../colors/color-breakpoint.model';
import {Color} from '../../colors/color';


@Pipe({name: 'breakpointToCssStringPipe'})
export class BreakpointToCssStringPipe implements PipeTransform {

    transform(br: ColorBreakpointDict): string {
        return Color.rgbaToCssString(br.rgba);
    }
}
