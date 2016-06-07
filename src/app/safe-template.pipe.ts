import {Pipe, PipeTransform} from '@angular/core';
import {DomSanitizationService} from '@angular/platform-browser';

@Pipe({name: 'waveSafeStyle'})
export class SafeStylePipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizationService) {}

    transform(style: string) {
        return this.sanitizer.bypassSecurityTrustStyle(style);
    }
}
