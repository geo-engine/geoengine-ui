import {Component, Input, ChangeDetectionStrategy, OnDestroy, OnInit, ViewChild, EventEmitter, Output} from '@angular/core';
import {BehaviorSubject, combineLatest, Observable, of, ReplaySubject, Subscription} from 'rxjs';
import {map, mergeMap, tap} from 'rxjs/operators';
import {RasterLayer} from '../../layer.model';
import {MapService} from '../../../map/map.service';
import {ProjectService} from '../../../project/project.service';
import {Config} from '../../../config.service';
import {BackendService} from '../../../backend/backend.service';
import {HistogramDict, HistogramParams} from '../../../backend/operator.model';
import {LinearGradient, LogarithmicGradient} from '../../../colors/colorizer.model';
import {ColorAttributeInput} from '../../../colors/color-attribute-input/color-attribute-input.component';
import {UUID, WorkflowDict} from '../../../backend/backend.model';
import {ColorBreakpoint} from '../../../colors/color-breakpoint.model';
import {UserService} from '../../../users/user.service';
import {extentToBboxDict} from '../../../util/conversions';
import {VegaChartData} from '../../../plots/vega-viewer/vega-viewer.component';
import {ColorMapSelectorComponent} from '../../../colors/color-map-selector/color-map-selector.component';
import {LayoutService} from '../../../layout.service';
import {Color} from '../../../colors/color';

/**
 * An editor for generating raster symbologies.
 */
@Component({
    selector: 'geoengine-raster-gradient-symbology-editor',
    templateUrl: 'raster-gradient-symbology-editor.component.html',
    styleUrls: ['raster-gradient-symbology-editor.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RasterGradientSymbologyEditorComponent implements OnDestroy, OnInit {
    @ViewChild(ColorMapSelectorComponent)
    colorMapSelector!: ColorMapSelectorComponent;

    @Input() layer!: RasterLayer;

    @Input() colorizer!: LinearGradient | LogarithmicGradient;
    @Output() colorizerChange = new EventEmitter<LinearGradient | LogarithmicGradient>();

    // The min value used for color table generation
    layerMinValue: number | undefined = undefined;
    // The max value used for color table generation
    layerMaxValue: number | undefined = undefined;

    scale: 'linear' | 'logarithmic' = 'linear';

    histogramData = new ReplaySubject<VegaChartData>(1);
    histogramLoading = new BehaviorSubject(false);
    histogramCreated = false;

    protected histogramWorkflowId = new ReplaySubject<UUID>(1);
    protected histogramSubscription?: Subscription;

    protected underColor?: ColorAttributeInput;
    protected overColor?: ColorAttributeInput;
    protected noDataColor?: ColorAttributeInput;

    constructor(
        protected readonly projectService: ProjectService,
        protected readonly backend: BackendService,
        protected readonly layoutService: LayoutService,
        protected readonly userService: UserService,
        protected readonly mapService: MapService,
        protected readonly config: Config,
    ) {}

    ngOnInit(): void {
        this.updateNodataAndDefaultColor();

        this.updateLayerMinMaxFromColorizer();

        this.createHistogramWorkflowId().subscribe((histogramWorkflowId) => this.histogramWorkflowId.next(histogramWorkflowId));
    }

    ngOnDestroy(): void {
        if (this.histogramSubscription) {
            this.histogramSubscription.unsubscribe();
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
        // if (this.colorMapEquals(this.colorizer.colors, colors)) {
        //     return;
        // }
        // TODO: adapt early return to new colorizer
        this.colorizer = this.colorizer.cloneWith({breakpoints: colorTable});
        this.colorizerChange.emit(this.colorizer);
    }

    private colorMapEquals(a: Map<number, Color>, b: Map<number, Color>): boolean {
        if (a.size !== b.size) {
            return false;
        }
        for (const [key, aValue] of a) {
            const bValue = b.get(key);
            if (!bValue || !aValue.equals(bValue)) {
                return false;
            }
        }
        return true;
    }

    get histogramAutoReload(): boolean {
        return !!this.histogramSubscription;
    }

    set histogramAutoReload(autoReload: boolean) {
        if (autoReload) {
            this.initializeHistogramDataSubscription();
        } else {
            this.histogramSubscription?.unsubscribe();
            this.histogramSubscription = undefined;
        }
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
        if (!histogramSignal || !histogramSignal.binStart || histogramSignal.binStart.length !== 2) {
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

    /**
     * Sets the layer min/max values from the colorizer.
     */
    updateLayerMinMaxFromColorizer(): void {
        const breakpoints = this.colorizer.getBreakpoints();
        this.updateLayerMinValue(breakpoints[0].value);
        this.updateLayerMaxValue(breakpoints[breakpoints.length - 1].value);
    }

    updateHistogram(): void {
        this.histogramCreated = true;
        this.histogramSubscription = this.createHistogramStream().subscribe((histogramData) => {
            this.histogramData.next(histogramData);
            this.histogramSubscription?.unsubscribe();
            this.histogramAutoReload = false;
        });
    }

    createColorTable(): void {
        this.colorMapSelector?.applyChanges();
        // TODO: Need to update or recreate the color palette display here
        // These attempts didn't work:
        // this.colorizerChange.emit(this.colorizer);
        // this.colorizer = this.colorizer.cloneWith({breakpoints: this.colorizer.getBreakpoints()});
        // this.updateColorTable(this.colorizer.getBreakpoints());

        // Color table must be updated, but
        // this.colorTable = [...this.colorTable]
        // won't work because colorTable is not a field...
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

    private initializeHistogramDataSubscription(): void {
        if (this.histogramSubscription) {
            this.histogramSubscription.unsubscribe();
        }

        this.histogramSubscription = this.createHistogramStream().subscribe((histogramData) => this.histogramData.next(histogramData));
    }

    private createHistogramStream(): Observable<VegaChartData> {
        return combineLatest([
            this.histogramWorkflowId,
            this.projectService.getTimeStream(),
            this.mapService.getViewportSizeStream(),
            this.userService.getSessionTokenForRequest(),
            this.projectService.getSpatialReferenceStream(),
        ]).pipe(
            tap(() => this.histogramLoading.next(true)),
            mergeMap(([workflowId, time, viewport, sessionToken, sref]) =>
                this.backend.getPlot(
                    workflowId,
                    {
                        bbox: extentToBboxDict(viewport.extent),
                        crs: sref.srsString,
                        spatialResolution: [viewport.resolution, viewport.resolution],
                        time: time.toDict(),
                    },
                    sessionToken,
                ),
            ),
            map((plotData) => plotData.data),
            tap(() => this.histogramLoading.next(false)),
        );
    }

    private createHistogramWorkflowId(): Observable<UUID> {
        return this.projectService.getWorkflow(this.layer.workflowId).pipe(
            mergeMap((workflow) =>
                combineLatest([
                    of({
                        type: 'Plot',
                        operator: {
                            type: 'Histogram',
                            params: {
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
                    } as WorkflowDict),
                    this.userService.getSessionTokenForRequest(),
                ]),
            ),
            mergeMap(([workflow, sessionToken]) => this.backend.registerWorkflow(workflow, sessionToken)),
            map((workflowRegistration) => workflowRegistration.id),
        );
    }
}
