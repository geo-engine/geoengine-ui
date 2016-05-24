import {Component, Input, ChangeDetectionStrategy} from '@angular/core';
import {MdToolbar} from '@angular2-material/toolbar';
import {Observable} from 'rxjs/Rx';

import {MATERIAL_DIRECTIVES} from 'ng2-material';

import {LayoutService} from '../app/layout.service';

@Component({
    selector: 'wave-info-bar',
    template: `
    <md-toolbar layout="row" layout-align="start center">
        <button md-button class="md-icon-button" aria-label="Settings"
                (click)="layoutService.toggleDataTableVisibility()"
                [ngSwitch]="dataTableVisible$ | async">
            <i *ngSwitchWhen="true" md-icon>expand_more</i>
            <i *ngSwitchWhen="false" md-icon>expand_less</i>
        </button>
        <small>
        Data Table
        <hr>
        Citation:
        {{citationString}}
        </small>
    </md-toolbar>
    `,
    styles: [`
    :host {
        display: block;
    }
    md-toolbar {
        height: 100%;
        min-height: 100%;
    }
    hr {
        transform: rotate(90deg);
        margin: 0px 10px;
        display: inline;
        border: 1px solid rgba(255, 255, 255, 0.87059);
    }
    `],
    directives: [MATERIAL_DIRECTIVES, MdToolbar],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class InfoBarComponent {
    @Input() citationString: string = 'none';

    private dataTableVisible$: Observable<boolean>;

    constructor(
        private layoutService: LayoutService
    ) {
        this.dataTableVisible$ = this.layoutService.getDataTableVisibilityStream();
    }
}
