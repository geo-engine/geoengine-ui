import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {Pipe, PipeTransform} from '@angular/core';

/**
 * This pipe is a workaround for to strict css sanitazion:
 * see: https://github.com/angular/angular/issues/8491
 */
@Pipe({name: 'geoengineSafeStyle'})
export class SafeStylePipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) {}

    transform(style: any): SafeHtml {
        return this.sanitizer.bypassSecurityTrustStyle(style);
    }
}
