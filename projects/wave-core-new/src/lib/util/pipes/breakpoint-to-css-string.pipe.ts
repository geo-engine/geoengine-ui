import {Pipe, PipeTransform} from '@angular/core';
import {BreakpointDict} from '../../backend/backend.model';
import {Color} from '../../colors/color';

@Pipe({name: 'breakpointToCssStringPipe'})
export class BreakpointToCssStringPipe implements PipeTransform {
    transform(br: BreakpointDict): string {
        return Color.rgbaToCssString(br.color);
    }
}
