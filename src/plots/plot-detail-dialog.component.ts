import {Component, ChangeDetectionStrategy, OnInit} from '@angular/core';
import {COMMON_DIRECTIVES} from '@angular/common';

import {MATERIAL_DIRECTIVES} from 'ng2-material';

import {BasicDialog} from '../dialogs/basic-dialog.component';
import {HistogramComponent} from './histogram.component';

import {Plot} from './plot.model';

@Component({
    selector: 'wave-plot-detail-dialog',
    template: `
    <wave-dialog-container #dialogContainer title="{{plot.operator.resultType}}: {{plot.name}}">
        <div [ngSwitch]="(plot.data$ | async)?.type">
            <template ngSwitchWhen="text">
                <pre>{{(plot.data$ | async)?.data}}</pre>
            </template>
            <template ngSwitchWhen="png">
                <img src="data:image/png;base64,{{(plot.data$ | async)?.data}}" #plotImage
                     [width]="getWidthBound(dialog.maxWidth$ | async,
                                            plotImage.naturalWidth)"
                     [alt]="plot.name">
            </template>
            <template ngSwitchWhen="histogram">
                <wave-histogram [data]="plot.data$ | async"
                                [width]="dialog.maxWidth$ | async"
                                [height]="dialog.maxHeight$ | async"
                                interactable="true">
                </wave-histogram>
            </template>
        </div>
    </wave-dialog-container>
    `,
    styles: [`

    `],
    providers: [],
    directives: [
        COMMON_DIRECTIVES, MATERIAL_DIRECTIVES, HistogramComponent,
    ],
    pipes: [],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class PlotDetailsDialogComponent extends BasicDialog<{plot: Plot}> implements OnInit {
    plot: Plot;

    ngOnInit() {
        this.plot = this.dialogInput.plot;
        this.dialog.setTitle(`${this.plot.operator.resultType}: ${this.plot.name}`);
        this.dialog.setOverflows(false);
    }

    getWidthBound(maxContentWidth: number, imageNaturalWidth: number) {
        return Math.min(maxContentWidth, imageNaturalWidth);
    }
}
