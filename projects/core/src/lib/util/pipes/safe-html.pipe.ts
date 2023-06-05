import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {Pipe, PipeTransform} from '@angular/core';

/**
 * This pipe is a workaround for to strict html sanitazion:
 * see: https://github.com/angular/angular/issues/8491
 */
@Pipe({name: 'geoengineSafeHtml'})
export class SafeHtmlPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) {}

    transform(value: string): SafeHtml {
        return this.sanitizer.bypassSecurityTrustHtml(value);
    }
}
