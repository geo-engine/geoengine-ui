import {Component, ChangeDetectionStrategy, OnInit} from '@angular/core';
import {COMMON_DIRECTIVES} from '@angular/common';

import {MATERIAL_DIRECTIVES} from 'ng2-material';

import {BasicDialog} from '../dialogs/basic-dialog.component';
import {HistogramComponent} from './histogram.component';

import {Plot} from './plot.model';

@Component({
    selector: 'wave-plot-detail-dialog',
    template: `
    <div [ngSwitch]="(plot.data.data$ | async)?.type">
        <template ngSwitchWhen="text">
            <pre>{{(plot.data.data$ | async)?.data}}</pre>
        </template>
        <template ngSwitchWhen="png">
            <img src="data:image/png;base64,{{(plot.data.data$ | async)?.data}}" #plotImage
                 [width]="getWidthBound(dialog.maxWidth$ | async,
                                        plotImage.naturalWidth)"
                 [alt]="plot.name">
        </template>
        <template ngSwitchWhen="histogram">
            <wave-histogram [data]="plot.data.data$ | async"
                            [width]="dialog.maxWidth$ | async"
                            [height]="(dialog.maxHeight$ | async) - 5"
                            interactable="true">
            </wave-histogram>
        </template>
    </div>
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
    }

    getWidthBound(maxContentWidth: number, imageNaturalWidth: number) {
        return Math.min(maxContentWidth, imageNaturalWidth);
    }
}
