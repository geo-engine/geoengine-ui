import {Component, Input, ChangeDetectionStrategy } from '@angular/core';
import {CORE_DIRECTIVES} from '@angular/common';

import {Observable} from 'rxjs/Rx';

import {MATERIAL_DIRECTIVES} from 'ng2-material';

import {LayerService} from '../layers/layer.service';
import {Provenance} from './provenance.model';

@Component({
    selector: 'wave-provenance-list',
    template: `
    <md-content class='container' [style.height.px]='height'>
        <md-list>
           <md-list-item *ngFor="let pro of prov$ | async">
            <p md-line>{{pro.citation}}</p>
           </md-list-item>
        </md-list>
    </md-content>
    `,
    styles: [`
    :host {
        display: block;
    }
    container{
        overflow-y: auto;
        display: block;
    }
    `],
    directives: [CORE_DIRECTIVES, MATERIAL_DIRECTIVES],
     changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProvenanceListComponent {

    @Input()
    private height: number;

    private prov$: Observable<Iterable<Provenance>>;

    constructor(private layerService: LayerService) {
        this.prov$ = layerService.getSelectedLayerStream().map(l => l.provenanceStream).switch();
    }

}
