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
        <md-list dense>
           <md-list-item *ngFor="let p of prov$ | async">
               <div class="md-list-item-text md-whiteframe-3dp box">
               <dl>
                 <dt>Citation</dt><dd [innerHtml]="p.citation"></dd>
                 <dt>License</dt><dd> {{ p.license }} </dd>
                 <dt>URI</dt><dd><a [href]="p.uri" target="_blank">{{p.uri}}</a></dd>
                </dl>
               </div>
           </md-list-item>
        </md-list>
    </md-content>
    `,
    styles: [`
    md-list-item {
        margin-top: 4px;
        font-size: 13px;
    }

    md-list-item .box {
        padding: 4px;
        width: 100%;
    }

    md-list-item dl, dt, dd{
        margin: 0;
        padding: 0;
    }

    md-list-item dt {
        color: gray;
        width: 60px;
        clear: left;
        float: left;
    }

    md-list-item dt:after {
        content:":";
    }

    md-list-item dd {
        float: left;
    }

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

    @Input() height: number;

    private prov$: Observable<Iterable<Provenance>>;

    constructor(private layerService: LayerService) {
        this.prov$ = layerService.getSelectedLayerStream().map(l => {
            if (l) {
                return l.provenanceStream;
            } else {
                return Observable.of([]);
            }
        }).switch();
    }

}
