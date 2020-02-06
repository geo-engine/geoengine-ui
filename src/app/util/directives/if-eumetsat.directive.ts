import {Directive, TemplateRef, Component, ViewContainerRef} from '@angular/core';
import {Config} from '../../config.service';

@Directive({
    selector: '[waveIfEUMETSAT]'
})
export class IfEUMETSATDirective {

    constructor(private config: Config,
                private templateRef: TemplateRef<Component>,
                private viewContainer: ViewContainerRef) {
        if (this.config.PROJECT.toUpperCase() === 'EUMETSAT') {
            this.viewContainer.createEmbeddedView(this.templateRef);
        }
    }

}
