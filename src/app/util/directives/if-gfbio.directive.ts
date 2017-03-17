import {Directive, DoCheck, TemplateRef, Component, ViewContainerRef, OnInit} from '@angular/core';
import {Config} from '../../config.service';

@Directive({
    selector: '[waveIfGfbio]'
})
export class IfGfbioDirective {

    constructor(private config: Config,
                private templateRef: TemplateRef<Component>,
                private viewContainer: ViewContainerRef) {
        const projectIsGFBio = this.config.PROJECT.toLowerCase() === 'gfbio';
        if (projectIsGFBio) {
            this.viewContainer.createEmbeddedView(this.templateRef);
        }
    }

}
