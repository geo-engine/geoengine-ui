import {Component, OnInit, ChangeDetectionStrategy, ViewChild, ElementRef, Input, OnChanges, SimpleChanges} from '@angular/core';
import vegaEmbed from 'vega-embed';
import {View} from 'vega';
import {TopLevelSpec as VlSpec} from 'vega-lite';
import {Spec as VgSpec} from 'vega';

@Component({
    selector: 'wave-vega-viewer',
    templateUrl: './vega-viewer.component.html',
    styleUrls: ['./vega-viewer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VegaViewerComponent implements OnInit, OnChanges {

    @Input()
    chartData: {
        vega_string: string,
        selection_name?: string,
    };

    @Input()
    width: number;

    @Input()
    height: number;

    @ViewChild('chart', {static: true}) protected chartContainer: ElementRef;

    private vegaHandle: {
        view: View,
        spec: VlSpec | VgSpec,
        vgSpec: VgSpec,
        finalize: () => void,
    } = undefined;

    constructor() {
    }

    ngOnInit() {
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.chartData || changes.width || changes.height) {
            this.clearContents();
            if (this.chartData) {
                this.displayPlot();
            }
        }
    }

    private displayPlot() {
        const div = this.chartContainer.nativeElement;

        const width = this.width ?? div.clientWidth;
        const height = this.height ?? (width / 2);

        const spec = JSON.parse(this.chartData.vega_string);

        vegaEmbed(
            div,
            spec,
            {
                actions: false,
                theme: 'ggplot2',
                renderer: 'svg',
                config: {
                    autosize: {
                        type: 'none',
                        contains: 'padding',
                    }
                },
                width,
                height,
            },
        ).then(result => {
            this.vegaHandle = result;
        }).catch(_error => {
            // TODO: react on error
        });
    }

    private clearContents() {
        const div = this.chartContainer.nativeElement;

        if (this.vegaHandle) {
            this.vegaHandle.finalize();
            this.vegaHandle = undefined;
        }

        while (div.firstChild) {
            div.firstChild.remove();
        }
    }
}
