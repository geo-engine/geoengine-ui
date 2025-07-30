import {
    Component,
    Input,
    ChangeDetectionStrategy,
    OnDestroy,
    OnInit,
    ViewChild,
    EventEmitter,
    Output,
    ChangeDetectorRef,
    OnChanges,
    SimpleChanges,
    inject,
} from '@angular/core';
import {BehaviorSubject, ReplaySubject, Subscription} from 'rxjs';
import {LinearGradient, LogarithmicGradient} from '../../colors/colorizer.model';
import {ColorAttributeInput, ColorAttributeInputComponent} from '../../colors/color-attribute-input/color-attribute-input.component';
import {ColorBreakpoint} from '../../colors/color-breakpoint.model';
import {ColorMapSelectorComponent} from '../../colors/color-map-selector/color-map-selector.component';
import {Color} from '../../colors/color';
import {ColorTableEditorComponent} from '../../colors/color-table-editor/color-table-editor.component';
import {UUID} from '../../datasets/dataset.model';
import {VegaChartData} from '../../plots/plot.model';
import {WorkflowsService} from '../../workflows/workflows.service';
import {HistogramDict, HistogramParams} from '../../operators/operator.model';
import {Workflow} from '@geoengine/openapi-client';
import {PlotsService} from '../../plots/plots.service';
import {SymbologyQueryParams} from '../symbology.model';
import {PercentileBreakpointSelectorComponent} from '../../colors/percentile-breakpoint-selector/percentile-breakpoint-selector.component';
import {MatCard, MatCardHeader, MatCardTitleGroup, MatCardTitle, MatCardSubtitle, MatCardContent} from '@angular/material/card';
import {MatIcon} from '@angular/material/icon';
import {FormsModule} from '@angular/forms';
import {MatTabGroup, MatTab} from '@angular/material/tabs';
import {VegaViewerComponent} from '../../plots/vega-viewer/vega-viewer.component';
import {MatProgressBar} from '@angular/material/progress-bar';
import {MatButton} from '@angular/material/button';
import {MatDivider} from '@angular/material/list';
import {AsyncPipe} from '@angular/common';
import {ColorizerCssGradientPipe} from '../../util/pipes/color-gradients.pipe';

/**
 * An editor for generating raster symbologies.
 */
@Component({
    selector: 'geoengine-raster-gradient-symbology-editor',
    templateUrl: 'raster-gradient-symbology-editor.component.html',
    styleUrls: ['raster-gradient-symbology-editor.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatCard,
        MatCardHeader,
        MatCardTitleGroup,
        MatCardTitle,
        MatCardSubtitle,
        MatIcon,
        MatCardContent,
        ColorAttributeInputComponent,
        FormsModule,
        MatTabGroup,
        MatTab,
        VegaViewerComponent,
        MatProgressBar,
        MatButton,
        MatDivider,
        ColorMapSelectorComponent,
        PercentileBreakpointSelectorComponent,
        ColorTableEditorComponent,
        AsyncPipe,
        ColorizerCssGradientPipe,
    ],
})
export class RasterGradientSymbologyEditorComponent implements OnDestroy, OnInit, OnChanges {
    private readonly workflowsService = inject(WorkflowsService);
    private readonly plotsService = inject(PlotsService);
    private changeDetectorRef = inject(ChangeDetectorRef);

    @ViewChild(ColorMapSelectorComponent)
    colorMapSelector!: ColorMapSelectorComponent;

    @ViewChild(PercentileBreakpointSelectorComponent)
    percentileBreakpointSelector!: PercentileBreakpointSelectorComponent;

    @ViewChild(ColorTableEditorComponent)
    colorTableEditor!: ColorTableEditorComponent;

    @Input({required: true}) band!: string;

    @Input({required: true}) workflowId!: UUID;

    @Input({required: true}) colorizer!: LinearGradient | LogarithmicGradient;

    @Input() queryParams?: SymbologyQueryParams;

    @Output() colorizerChange = new EventEmitter<LinearGradient | LogarithmicGradient>();

    // The min value used for color table generation
    layerMinValue: number | undefined = undefined;
    // The max value used for color table generation
    layerMaxValue: number | undefined = undefined;

    scale: 'linear' | 'logarithmic' = 'linear';

    histogramData = new ReplaySubject<VegaChartData>(1);
    histogramLoading = new BehaviorSubject(false);
    histogramCreated = false;

    protected histogramSubscription?: Subscription;

    protected underColor?: ColorAttributeInput;
    protected overColor?: ColorAttributeInput;
    protected noDataColor?: ColorAttributeInput;

    ngOnInit(): void {
        this.updateNodataAndDefaultColor();

        this.updateLayerMinMaxFromColorizer();
    }

    ngOnDestroy(): void {
        if (this.histogramSubscription) {
            this.histogramSubscription.unsubscribe();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.colorizer) {
            this.updateScale();
            this.updateNodataAndDefaultColor();
            this.initializeBreakpoints(this.colorizer.getBreakpoints());
        }
    }

    get colorTable(): Array<ColorBreakpoint> {
        return this.colorizer.getBreakpoints();
    }

    updateColorTable(colorTable: Array<ColorBreakpoint>): void {
        const colors = new Map<number, Color>();
        for (const breakpoint of colorTable) {
            colors.set(breakpoint.value, breakpoint.color);
        }
        this.colorizer = this.colorizer.cloneWith({breakpoints: colorTable});
        this.colorizerChange.emit(this.colorizer);
    }

    /**
     * Set the max value to use for color table generation
     */
    updateLayerMinValue(min: number): void {
        if (this.layerMinValue !== min) {
            this.layerMinValue = min;
        }
    }

    /**
     * Set the max value to use for color table generation
     */
    updateLayerMaxValue(max: number): void {
        if (this.layerMaxValue !== max) {
            this.layerMaxValue = max;
        }
    }

    updateBounds(histogramSignal: {binStart: [number, number]}): void {
        if (!histogramSignal?.binStart || histogramSignal.binStart.length !== 2) {
            return;
        }

        const [min, max] = histogramSignal.binStart;

        this.updateLayerMinValue(min);
        this.updateLayerMaxValue(max);
    }

    getUnderColor(): ColorAttributeInput {
        if (!this.underColor) {
            throw new Error('uninitialized underColor');
        }

        return this.underColor;
    }

    getOverColor(): ColorAttributeInput {
        if (!this.overColor) {
            throw new Error('uninitialized overColor');
        }

        return this.overColor;
    }

    getNoDataColor(): ColorAttributeInput {
        if (!this.noDataColor) {
            throw new Error('uninitialized noDataColor');
        }

        return this.noDataColor;
    }

    updateUnderColor(underColorInput: ColorAttributeInput): void {
        const underColor = underColorInput.value;
        this.colorizer = this.colorizer.cloneWith({underColor});

        this.colorizerChange.emit(this.colorizer);
    }

    updateOverColor(overColorInput: ColorAttributeInput): void {
        const overColor = overColorInput.value;
        this.colorizer = this.colorizer.cloneWith({overColor});

        this.colorizerChange.emit(this.colorizer);
    }

    updateNoDataColor(noDataColorInput: ColorAttributeInput): void {
        const noDataColor = noDataColorInput.value;
        this.colorizer = this.colorizer.cloneWith({noDataColor});

        this.colorizerChange.emit(this.colorizer);
    }

    updateScale(): void {
        if (this.colorizer instanceof LinearGradient) {
            this.scale = 'linear';
            return;
        }

        if (this.colorizer instanceof LogarithmicGradient) {
            this.scale = 'logarithmic';
            return;
        }
    }

    updateBreakpoints(breakpoints: Array<ColorBreakpoint>): void {
        if (!breakpoints) {
            return;
        }

        this.colorizer = this.colorizer.cloneWith({breakpoints});
        this.colorizerChange.emit(this.colorizer);
    }

    initializeBreakpoints(breakpoints: Array<ColorBreakpoint>): void {
        if (!breakpoints) {
            return;
        }

        this.colorizer = this.colorizer.cloneWith({breakpoints});
    }

    /**
     * Sets the layer min/max values from the colorizer.
     */
    updateLayerMinMaxFromColorizer(): void {
        const breakpoints = this.colorizer.getBreakpoints();
        this.updateLayerMinValue(breakpoints[0].value);
        this.updateLayerMaxValue(breakpoints[breakpoints.length - 1].value);
    }

    updateHistogram(): void {
        if (!this.queryParams) {
            return;
        }

        const histogramParams = this.queryParams;

        this.histogramCreated = true;
        this.createHistogramWorkflowId()
            .then((histogramWorkflowId) => this.createHistogram(histogramWorkflowId, histogramParams))
            .then((histogramData) => {
                this.histogramData.next(histogramData);
            })
            .catch((error) => console.error('Error:', error));
    }

    createColorTable(): void {
        this.colorMapSelector?.applyChanges();
        this.changeDetectorRef.detectChanges();
        this.colorTableEditor?.updateColorAttributes();
    }

    createPercentilesColorTable(): void {
        this.percentileBreakpointSelector?.createColorTable();
    }

    private updateNodataAndDefaultColor(): void {
        this.noDataColor = {
            key: 'No Data Color',
            value: this.colorizer.noDataColor,
        };

        this.underColor = {
            key: 'Under Color',
            value: this.colorizer.underColor,
        };

        this.overColor = {
            key: 'Over Color',
            value: this.colorizer.overColor,
        };
    }

    private createHistogram(histogramWorkflowId: UUID, histogramParams: SymbologyQueryParams): Promise<VegaChartData> {
        return this.plotsService
            .getPlot(
                histogramWorkflowId,
                histogramParams.bbox,
                histogramParams.time,
                histogramParams.resolution,
                histogramParams.spatialReference,
            )
            .then((plotData) => {
                this.histogramLoading.next(false);
                return plotData.data as VegaChartData;
            });
    }

    private createHistogramWorkflowId(): Promise<UUID> {
        return this.workflowsService.getWorkflow(this.workflowId).then((workflow) =>
            this.workflowsService.registerWorkflow({
                type: 'Plot',
                operator: {
                    type: 'Histogram',
                    params: {
                        attributeName: this.band,
                        buckets: {
                            type: 'number',
                            value: 20,
                        },
                        bounds: 'data',
                        interactive: true,
                    } as HistogramParams,
                    sources: {
                        source: workflow.operator,
                    },
                } as HistogramDict,
            } as Workflow),
        );
    }
}
