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
                <table>
                    <tr>
                        <td>Citation:</td>
                        <td [innerHtml]="p.citation"></td>
                    </tr>
                    <tr>
                        <td>License:</td>
                        <td>{{p.license}}</td>
                    </tr>
                    <tr>
                        <td>URI:</td>
                        <td><a [href]="p.uri">{{p.uri}}</a></td>
                    </tr>
                </table>
                <md-divider></md-divider>
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

    md-list-item {
        margin: 0;
        font-size: 13px;
    }

    table {
        margin: 16px 0px;
    }
    table td {
        padding: 0;
        margin: 0;
    }
    table td:first-child {
        color: gray;
        width: 60px;
        vertical-align: top;
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
