import {Component, ChangeDetectionStrategy, OnInit} from '@angular/core';

import {Plot} from './plot.model';

type PlotDetailsDialogType = {plot: Plot, [index: string]: Plot};

@Component({
    selector: 'wave-plot-detail-dialog',
    template: `
    <div [ngSwitch]="(plot.data.data$ | async)?.type">
        <template ngSwitchCase="text">
            <pre>{{(plot.data.data$ | async)?.data}}</pre>
        </template>
        <template ngSwitchCase="png">
            <img src="data:image/png;base64,{{(plot.data.data$ | async)?.data}}" #plotImage
                 [width]="getWidthBound(dialog.maxWidth$ | async,
                                        plotImage.naturalWidth)"
                 [alt]="plot.name">
        </template>
        <template ngSwitchCase="histogram">
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
    changeDetection: ChangeDetectionStrategy.Default,
})
export class PlotDetailsDialogComponent
                                        implements OnInit {
    plot: Plot;

    ngOnInit() {
        // this.plot = this.dialogInput.plot;
        // this.dialog.setTitle(`${this.plot.operator.resultType}: ${this.plot.name}`);
    }

    getWidthBound(maxContentWidth: number, imageNaturalWidth: number) {
        return Math.min(maxContentWidth, imageNaturalWidth);
    }
}
