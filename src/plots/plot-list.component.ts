import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter} from 'angular2/core';

import {MATERIAL_DIRECTIVES} from 'ng2-material/all';

import {HistogramComponent} from './histogram.component';

import {PlotService} from './plot.service';

import {Plot} from './plot.model';

@Component({
    selector: 'wave-plot-list',
    template: `
    <div layout="column" *ngIf="plotService.getPlotsVisibleStream() | async"
                         [style.max-height.px]="maxHeight">
        <md-toolbar>
            <div class="md-toolbar-tools">
                <button md-button class="md-icon-button" aria-label="Toggle"
                        (click)="plotService.togglePlotListVisibility()"
                        [ngSwitch]="plotService.getPlotListVisibleStream() | async">
                    <i md-icon>
                        <template [ngSwitchWhen]="true">expand_less</template>
                        <template [ngSwitchWhen]="false">expand_more</template>
                    </i>
                </button>
                <span flex>Output</span>
                <button md-button class="md-icon-button" aria-label="Clear Plots"
                        (click)="plotService.clearPlots()">
                    <i md-icon>delete</i>
                </button>
            </div>
        </md-toolbar>
        <md-content *ngIf="plotService.getPlotListVisibleStream() | async"
                    [style.max-height.px]="maxHeight - 40">
            <md-list>
                <md-list-item *ngFor="#plot of plotService.getPlotsStream() | async"
                              [ngSwitch]="(plot.data$ | async)?.type"
                              class="md-2-line">
                    <div class="md-list-item-text plot-header" layout="column">
                        <div layout="row">
                            <h3 flex>{{plot.name}}</h3>
                            <button md-button class="md-icon-button" aria-label="Remove Output"
                                    (click)="openDetailView.emit(plot)">
                                <i md-icon>info</i>
                            </button>
                            <button md-button class="md-icon-button" aria-label="Remove Output"
                                    (click)="plotService.removePlot(plot)">
                                <i md-icon>close</i>
                            </button>
                        </div>
                        <div class="plot-content">
                            <template ngSwitchWhen="text">
                                <pre>{{(plot.data$ | async)?.data}}</pre>
                            </template>
                            <template ngSwitchWhen="png">
                                <img src="data:image/png;base64,{{(plot.data$ | async)?.data}}"
                                     width="150" height="150" alt="{{plot.name}}">
                            </template>
                            <template ngSwitchWhen="histogram">
                                <wave-histogram [data]="plot.data$ | async"
                                                width="150" height="150"
                                                viewBoxRatio="3">
                                </wave-histogram>
                            </template>
                        </div>
                    </div>
                    <md-divider></md-divider>
                </md-list-item>
            </md-list>
        </md-content>
    </div>
    `,
    styles: [
        `
        md-content {
            overflow-y: auto !important;
        }
        md-toolbar {
            min-height: 40px;
        }
        .md-toolbar-tools {
            height: 40px;
        }
        md-list-item >>> .md-list-item-inner {
            padding-right: 0px;
        }
        .plot-header h3 {
            line-height: 40px !important;
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;
        }
        .plot-header .md-icon-button {
            margin-left: 0px;
            margin-right: 0px;
        }
        .plot-content {
            padding-right: 16px;
        }
        pre {
            white-space: pre-wrap;
            word-wrap: break-word; /* IE */
            max-height: 200px; /* TODO: reasonable value */
            overflow-y: hidden;
        }
        `,
    ],
    directives: [MATERIAL_DIRECTIVES, HistogramComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlotListComponent {
    @Input() maxHeight: number;
    @Output() openDetailView = new EventEmitter<Plot>();

    constructor(private plotService: PlotService) {}
}
