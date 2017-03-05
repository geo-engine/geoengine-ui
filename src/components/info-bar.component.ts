import {Component, Input, ChangeDetectionStrategy} from '@angular/core';

import {Observable} from 'rxjs/Rx';

import {LayoutService} from '../app/layout.service';

@Component({
    selector: 'wave-info-bar',
    template: `
    <md-toolbar>
        <button md-icon-button aria-label="Toggle Data Table"
                (click)="layoutService.toggleLayerDetailViewVisibility()"
                [ngSwitch]="dataTableVisible$ | async">
            <md-icon *ngSwitchCase="true">expand_more</md-icon>
            <md-icon *ngSwitchCase="false">expand_less</md-icon>
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
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class InfoBarComponent {
    @Input() citationString: string = '';

    private dataTableVisible$: Observable<boolean>;

    constructor(
        private layoutService: LayoutService
    ) {
        this.dataTableVisible$ = this.layoutService.getLayerDetailViewVisibilityStream();
    }
}
