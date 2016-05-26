import {Component, Input, ChangeDetectionStrategy} from '@angular/core';
import {CORE_DIRECTIVES} from '@angular/common';

import {Observable} from 'rxjs/Rx';

import {MATERIAL_DIRECTIVES} from 'ng2-material';
import {MdToolbar} from '@angular2-material/toolbar';

import {LayoutService} from '../app/layout.service';

@Component({
    selector: 'wave-info-bar',
    template: `
    <md-toolbar>
        <button md-button class="md-icon-button" aria-label="Toggle Data Table"
                (click)="layoutService.toggleDataTableVisibility()"
                [ngSwitch]="dataTableVisible$ | async">
            <i *ngSwitchWhen="true" md-icon>expand_more</i>
            <i *ngSwitchWhen="false" md-icon>expand_less</i>
        </button>
        <small>Data Table</small>
        <md-divider *ngIf="citationString"></md-divider>
        <small class="citation" *ngIf="citationString">Citation: {{citationString}}</small>
    </md-toolbar>
    `,
    styles: [`
    :host {
        display: block;
    }
    md-toolbar, md-toolbar >>> .md-toolbar-layout, md-toolbar >>> md-toolbar-row {
        min-height: 100%;
        height: 100%;
        padding: 0;
    }
    .citation {
        flex: 1 1 auto;
    }
    md-divider {
        transform: rotate(90deg);
        width: 16px;
    }
    `],
    directives: [CORE_DIRECTIVES, MATERIAL_DIRECTIVES, MdToolbar],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class InfoBarComponent {
    @Input() citationString: string = '';

    private dataTableVisible$: Observable<boolean>;

    constructor(
        private layoutService: LayoutService
    ) {
        this.dataTableVisible$ = this.layoutService.getDataTableVisibilityStream();
    }
}
