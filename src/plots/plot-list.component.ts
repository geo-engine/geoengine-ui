import {Component, ChangeDetectionStrategy, Input}
  from '@angular/core';

import {Observable} from 'rxjs/Rx';

import Config from '../app/config.model';

import {PlotDetailsDialogComponent} from './plot-detail-dialog.component';

import {PlotService} from './plot.service';
import {Plot} from './plot.model';

import {LayoutService} from '../app/layout.service';
import {LoadingState} from '../shared/loading-state.model';

/**
 * A component to list all plots.
 */
@Component({
    selector: 'wave-plot-list',
    template: `
    <md-toolbar>
        <button md-button class="md-icon-button" aria-label="Toggle List Visibility"
                (click)="layoutService.togglePlotListVisibility()"
                [ngSwitch]="plotListVisible$ | async">
            <i md-icon>
                <template [ngSwitchCase]="true">expand_less</template>
                <template [ngSwitchCase]="false">expand_more</template>
            </i>
        </button>
        <span>Output</span>
        <button md-button class="md-icon-button" aria-label="Clear Plots"
                (click)="plotService.clearPlots()">
            <i md-icon>delete</i>
        </button>
    </md-toolbar>
    <div class="md-content" *ngIf="plotListVisible$ | async" [style.max-height.px]="maxHeight - 48">
        <md-list>
            <md-list-item *ngFor="let plot of plots$ | async"
                          [ngSwitch]="(plot.data.data$ | async)?.type"
                          class="md-2-line">
                <div class="md-list-item-text plot-header" layout="column">
                    <div layout="row">
                        <h3 flex [title]="plot.name">{{plot.name}}</h3>
                        <button
                            md-button class="md-icon-button" aria-label="Detail"
                            *ngIf="(plot.data.state$ | async) === LoadingState.OK"
                            (click)="plotDetailsDialogDialog.show({plot: plot})"
                        >
                            <i md-icon>fullscreen</i>
                        </button>
                        <button
                            md-button class="md-icon-button error-button" aria-label="Error"
                            *ngIf="(plot.data.state$ | async) === LoadingState.ERROR"
                            (click)="plot.reload()"
                        >
                            <i md-icon>replay</i>
                        </button>
                        <button md-button class="md-icon-button" aria-label="Remove Output"
                                (click)="plotService.removePlot(plot)">
                            <i md-icon>close</i>
                        </button>
                    </div>
                    <div class="plot-content">
                        <template ngSwitchCase="text">
                            <pre>{{(plot.data.data$ | async)?.data}}</pre>
                        </template>
                        <template ngSwitchCase="png">
                            <img src="data:image/png;base64,{{(plot.data.data$ | async)?.data}}"
                                 width="150" height="150" alt="{{plot.name}}">
                        </template>
                        <template ngSwitchCase="histogram">
                          <i>"FIXME: fix the histogram component"</i>
                        </template>
                        <md-progress-circle
                            mode="indeterminate"
                            *ngIf="(plot.data.state$ | async) === LoadingState.LOADING"
                        ></md-progress-circle>
                    </div>
                </div>
                <md-divider></md-divider>
            </md-list-item>
        </md-list>
    </div>>
    <wave-dialog-loader #plotDetailsDialogDialog
        [type]="PlotDetailsDialogComponent"
    ></wave-dialog-loader>
    `,
    styles: [`
    .md-content {
        overflow-y: auto !important;
    }
    md-toolbar,
    md-toolbar >>> .md-toolbar-layout,
    md-toolbar >>> md-toolbar-row {
        padding: 0;
        min-height: 48px;
        height: 48px;
    }
    md-toolbar span {
        flex: 1 1 auto;
    }
    md-list-item >>> .md-list-item-inner {
        padding-right: 0px;
        padding-left: 8px;
        width: calc(100% - 8px);
    }
    .plot-header {
        width: 100%;
        min-width: 0;
        margin: 0 !important;
    }
    .plot-header h3 {
        line-height: 40px !important;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        width: calc(100% - 2*40px);
    }
    .plot-header .md-icon-button {
        margin-left: 0px;
        margin-right: 0px;
    }
    .plot-header .error-button {
        color: ${Config.COLORS.WARN};
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
    md-progress-circle {
        position: absolute;
        top: 0px;
        left: calc(50% - 36px/2);
        width: 36px;
        height: 36px;
    }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlotListComponent {
    // make visible in template
    LoadingState = LoadingState; // tslint:disable-line:variable-name

    @Input() maxHeight: number; // in px

    PlotDetailsDialogComponent = PlotDetailsDialogComponent; // tslint:disable-line:variable-name

    plotListVisible$: Observable<boolean>;
    plots$: Observable<Array<Plot>>;

    constructor(
        private plotService: PlotService,
        private layoutService: LayoutService
    ) {
        this.plotListVisible$ = this.layoutService.getPlotListVisibilityStream();

        this.plots$ = this.plotService.getPlotsStream();
    }

}

/* TODO: FIXME: add the histogram
 <wave-histogram [data]="plot.data.data$ | async"
 width="150" height="150"
 viewBoxRatio="3">
 </wave-histogram>
 */
