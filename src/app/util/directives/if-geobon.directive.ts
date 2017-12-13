import {Component, Directive, TemplateRef, ViewContainerRef} from '@angular/core';
import {Config} from '../../config.service';

@Directive({
    selector: '[waveIfGeoBon]'
})
export class IfGeoBonDirective {

    constructor(private config: Config,
                private templateRef: TemplateRef<Component>,
                private viewContainer: ViewContainerRef) {
        const projectIsGeoBon = this.config.PROJECT.toLowerCase() === 'geobon';
        if (projectIsGeoBon) {
            this.viewContainer.createEmbeddedView(this.templateRef);
        }
    }

}
