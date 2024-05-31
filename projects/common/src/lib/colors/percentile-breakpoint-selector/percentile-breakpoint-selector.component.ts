import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges,
} from '@angular/core';
import {FormArray, UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {BehaviorSubject} from 'rxjs';
import {Color, RgbaTuple} from '../color';
import {ColorBreakpoint} from '../color-breakpoint.model';
import {geoengineValidators} from '../../util/form.validators';
import {MPL_COLORMAPS} from '../color-map-selector/mpl-colormaps';
import {UUID} from '../../datasets/dataset.model';
import {WorkflowsService} from '../../workflows/workflows.service';
import {StatisticsDict, StatisticsParams} from '../../operators/operator.model';
import {Workflow} from '@geoengine/openapi-client';
import {SymbologyQueryParams} from '../../symbology/symbology.model';
import {PlotsService} from '../../plots/plots.service';

/**
 * The ColormapColorizerComponent is a dialog to generate ColorizerData from colormaps.
 */
@Component({
    selector: 'geoengine-percentile-breakpoint-selector',
    templateUrl: 'percentile-breakpoint-selector.component.html',
    styleUrls: ['percentile-breakpoint-selector.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PercentileBreakpointSelectorComponent implements OnInit, OnDestroy, OnChanges {
    @Input({required: true}) band!: string;

    @Input({required: true}) workflowId!: UUID;

    @Input({required: true}) queryParams!: SymbologyQueryParams;

    /**
     * Emmits colorizer breakpoint arrays
     */
    @Output() breakpointsChange = new EventEmitter<Array<ColorBreakpoint>>();

    /**
     * Informs parent to enable "Apply Changes" button
     */
    @Output() changesToForm = new EventEmitter<void>();

    readonly colorMaps = MPL_COLORMAPS;

    readonly MAX_PERCENTILES = 8;

    /**
     * The form control used in the template.
     */
    form: UntypedFormGroup;

    /**
     * The local (work-in-progress) Colorizer.
     */
    breakpoints?: Array<ColorBreakpoint>;

    statisticsLoading$ = new BehaviorSubject(false);

    protected readonly largerThanZeroValidator = geoengineValidators.largerThan(0);

    constructor(
        protected readonly changeDetectorRef: ChangeDetectorRef,
        protected readonly formBuilder: UntypedFormBuilder,
        protected readonly workflowsService: WorkflowsService,
        protected readonly plotsService: PlotsService,
    ) {
        const initialColorMapName = Object.keys(this.colorMaps)[0];

        this.form = formBuilder.group({
            percentiles: this.formBuilder.array(
                [0.25, 0.5, 0.75].map((p) => [p, [Validators.required]]),
                [Validators.minLength(1), Validators.maxLength(this.MAX_PERCENTILES)],
            ),
            colorMap: [this.colorMaps[initialColorMapName], [Validators.required]],
            colorMapReverseColors: [false],
        });
    }

    ngOnInit(): void {}

    ngOnDestroy(): void {}

    ngOnChanges(changes: SimpleChanges): void {}

    /**
     * Replace the min and max values.
     */
    patchMinMaxValues(min?: number, max?: number): void {
        if (typeof min !== 'number' || typeof max !== 'number') {
            return;
        }

        const bounds: {min: number; max: number} = this.form.controls['bounds'].value;

        if (bounds.min === min && bounds.max === max) {
            return;
        }

        this.form.controls.bounds.setValue({min, max});

        this.updateColorizerData();
    }

    /**
     * Clears the local colorizer data.
     */
    removeColorizerData(): void {
        this.breakpoints = undefined;
    }

    /**
     * Apply changes to color table to the colorizer data.
     */
    applyChanges(): void {
        if (!this.breakpoints) {
            return;
        }

        this.breakpointsChange.emit(this.breakpoints);
    }

    async createColorTable(): Promise<void> {
        if (this.form.invalid) {
            return;
        }

        await this.updateColorizerData();
        this.applyChanges();
    }

    get percentiles(): FormArray {
        return this.form.get('percentiles') as FormArray;
    }

    removePercentileAt(index: number): void {
        if (this.percentiles.length <= 1) {
            return;
        }

        this.percentiles.removeAt(index);
    }

    addPercentile(): void {
        if (this.percentiles.length >= this.MAX_PERCENTILES) {
            return;
        }

        this.percentiles.push(this.formBuilder.control(0.5, [Validators.required]));
    }

    public static createBreakpoints(
        colorMap: Array<RgbaTuple>,
        colorMapReverseColors: boolean,
        percentiles: number[],
    ): Array<ColorBreakpoint> {
        const breakpoints = new Array<ColorBreakpoint>();

        for (let i = 0; i < percentiles.length; i++) {
            let value = percentiles[i];

            const frac = i / percentiles.length;

            const colorMapPos = frac * (colorMap.length - 1);
            let colorMapIndex = Math.floor(colorMapPos);
            const colorMapPosRemainder = colorMapPos - colorMapIndex;
            let nextMapIndex = Math.min(colorMapIndex + 1, colorMap.length - 1);

            if (colorMapReverseColors) {
                colorMapIndex = colorMap.length - colorMapIndex - 1;
                nextMapIndex = Math.max(0, colorMapIndex - 1);
            }

            // we use the colorMapPosRemainder to interpolate between the two colors
            //if the remainder is 0, we can just use the colorMapIndex and return the color
            if (colorMapPosRemainder < Number.EPSILON) {
                breakpoints.push(new ColorBreakpoint(value, Color.fromRgbaLike(colorMap[colorMapIndex])));
                continue;
            }

            //otherwise we need to interpolate between the two colors
            const color = Color.fromRgbaLike(colorMap[colorMapIndex]);
            const nextColor = Color.fromRgbaLike(colorMap[nextMapIndex]);

            const r = color.r + colorMapPosRemainder * (nextColor.r - color.r);
            const g = color.g + colorMapPosRemainder * (nextColor.g - color.g);
            const b = color.b + colorMapPosRemainder * (nextColor.b - color.b);
            const a = color.a + colorMapPosRemainder * (nextColor.a - color.a);

            const realColor = Color.fromRgbaLike([Math.trunc(r), Math.trunc(g), Math.trunc(b), Math.trunc(a)]);

            breakpoints.push(new ColorBreakpoint(value, realColor));
        }

        return breakpoints;
    }

    async updateColorizerData(): Promise<void> {
        if (!this.form.valid) {
            this.breakpoints = undefined;
            return;
        }

        this.breakpoints = await this.createBreakpoints();

        this.changeDetectorRef.markForCheck();
    }

    protected async createBreakpoints(): Promise<Array<ColorBreakpoint>> {
        const colorMap: Array<RgbaTuple> = this.form.controls['colorMap'].value;
        const colorMapReverseColors: boolean = this.form.controls['colorMapReverseColors'].value;
        const percentiles: number[] = this.form.controls['percentiles'].value;

        const statisticsWorkflowsId = await this.createStatisticsWorkflow(percentiles);
        const statistics = await this.createStatistics(statisticsWorkflowsId, this.queryParams);

        // add min and max to percentiles
        const percentileValues = statistics.percentiles.map((p) => p.value);
        percentileValues.unshift(statistics.min);
        percentileValues.push(statistics.max);

        percentileValues.sort();

        return PercentileBreakpointSelectorComponent.createBreakpoints(colorMap, colorMapReverseColors, percentileValues);
    }

    private createStatistics(
        histogramWorkflowId: UUID,
        queryParams: SymbologyQueryParams,
    ): Promise<{min: number; max: number; percentiles: {percentile: number; value: number}[]}> {
        this.statisticsLoading$.next(true);
        return this.plotsService
            .getPlot(histogramWorkflowId, queryParams.bbox, queryParams.time, queryParams.resolution, queryParams.spatialReference)
            .then((plotData) => {
                this.statisticsLoading$.next(false);

                const statistics = plotData.data as any;

                if (!(this.band in plotData.data)) {
                    throw new Error('Band not found in statistics');
                }

                return statistics[this.band] as {min: number; max: number; percentiles: {percentile: number; value: number}[]};
            });
    }

    protected createStatisticsWorkflow(percentiles: number[]): Promise<UUID> {
        return this.workflowsService.getWorkflow(this.workflowId).then((workflow) =>
            this.workflowsService.registerWorkflow({
                type: 'Plot',
                operator: {
                    type: 'Statistics',
                    params: {
                        columnNames: [this.band],
                        percentiles,
                    } as StatisticsParams,
                    sources: {
                        source: [workflow.operator],
                    },
                } as StatisticsDict,
            } as Workflow),
        );
    }
}
