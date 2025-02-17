import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
    name: 'geoengineTrimPipe',
    standalone: false,
})
export class TrimPipe implements PipeTransform {
    transform(value: string): string {
        if (!value) {
            return '';
        }
        if (value.trim) {
            return value.trim();
        }
        return value;
    }
}
