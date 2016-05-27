import {DomSanitizationService} from '@angular/platform-browser';
import {Pipe, PipeTransform} from '@angular/core';

/**
 * This pipe is a workaround for to strict css sanitazion:
 * see: https://github.com/angular/angular/issues/8491
 */
@Pipe({name: 'waveSafeStyle'})
export class SafeStylePipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizationService) {}

    transform(style: any) {
        return this.sanitizer.bypassSecurityTrustStyle(style);
    }
}
