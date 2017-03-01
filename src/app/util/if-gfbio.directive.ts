import {Directive, DoCheck, TemplateRef, Component, ViewContainerRef, OnInit} from '@angular/core';
import {Config} from '../config.service';

@Directive({
    selector: '[waveIfGfbio]'
})
export class IfGfbioDirective {

    constructor(private config: Config,
                private templateRef: TemplateRef<Component>,
                private viewContainer: ViewContainerRef) {
        if (this.config.PROJECT.toLowerCase() === 'gfbio') {
            this.viewContainer.createEmbeddedView(this.templateRef);
        }
    }

}
