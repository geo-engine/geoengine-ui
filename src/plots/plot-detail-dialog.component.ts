import {Component, ChangeDetectionStrategy, Input} from 'angular2/core';
import {COMMON_DIRECTIVES} from 'angular2/common';
import {MATERIAL_DIRECTIVES} from 'ng2-material/all';
import {MdDialogRef, MdDialogConfig} from 'ng2-material/components/dialog/dialog';

import {DialogContainerComponent} from '../components/dialogs/dialog-basics.component';
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
                     [width]="getWidthBound(dialogContainer.maxWidth$ | async,
                                            plotImage.naturalWidth)"
                     [alt]="plot.name">
            </template>
            <template ngSwitchWhen="histogram">
                <wave-histogram [data]="plot.data$ | async"
                                [width]="dialogContainer.maxWidth$ | async"
                                [height]="dialogContainer.maxHeight$ | async"
                                interactable="true">
                </wave-histogram>
            </template>
        </div>
    </wave-dialog-container>
    `,
    styles: [
        `

        `,
    ],
    providers: [],
    directives: [
        COMMON_DIRECTIVES, MATERIAL_DIRECTIVES, DialogContainerComponent, HistogramComponent,
    ],
    pipes: [],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class PlotDetailsDialogComponent {
    @Input() plot: Plot;

    constructor(private dialog: MdDialogRef) {}

    getWidthBound(maxContentWidth: number, imageNaturalWidth: number) {
        return Math.min(maxContentWidth, imageNaturalWidth);
    }
}

export class PlotDetailsDialogConfig extends MdDialogConfig {
    plot(plot: Plot): PlotDetailsDialogConfig {
        this.context.plot = plot;
        return this;
    }
}
