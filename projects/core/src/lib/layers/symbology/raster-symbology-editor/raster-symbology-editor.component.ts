import {
    Component,
    Input,
    ChangeDetectionStrategy,
    OnChanges,
    SimpleChanges,
    OnDestroy,
    AfterViewInit,
    OnInit,
    ViewChild,
} from '@angular/core';
import {BehaviorSubject, combineLatest, Observable, of, ReplaySubject, Subscription} from 'rxjs';
import {map, mergeMap, tap} from 'rxjs/operators';
import {RasterSymbology} from '../symbology.model';
import {Layer, RasterLayer} from '../../layer.model';
import {MapService} from '../../../map/map.service';
import {ProjectService} from '../../../project/project.service';
import {Config} from '../../../config.service';
import {BackendService} from '../../../backend/backend.service';
import {HistogramDict, HistogramParams} from '../../../backend/operator.model';
import {LinearGradient, LogarithmicGradient, PaletteColorizer} from '../../../colors/colorizer.model';
import {ColorAttributeInput} from '../../../colors/color-attribute-input/color-attribute-input.component';
import {UUID, WorkflowDict} from '../../../backend/backend.model';
import {ColorBreakpoint} from '../../../colors/color-breakpoint.model';
import {UserService} from '../../../users/user.service';
import {extentToBboxDict} from '../../../util/conversions';
import {VegaChartData} from '../../../plots/vega-viewer/vega-viewer.component';
import {Color} from '../../../colors/color';
import {ColorMapSelectorComponent} from '../../../colors/color-map-selector/color-map-selector.component';
import {LayoutService} from '../../../layout.service';
import {ColorPaletteEditorComponent} from '../../../colors/color-palette-editor/color-palette-editor.component';

/**
 * An editor for generating raster symbologies.
 */
@Component({
    selector: 'geoengine-raster-symbology-editor',
    templateUrl: 'raster-symbology-editor.component.html',
    styleUrls: ['raster-symbology-editor.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RasterSymbologyEditorComponent implements OnChanges, OnDestroy, AfterViewInit, OnInit {
    @ViewChild(ColorMapSelectorComponent)
    colorMapSelector!: ColorMapSelectorComponent;

    @ViewChild(ColorPaletteEditorComponent)
    colorPaletteEditor!: ColorPaletteEditorComponent;

    @Input() layer!: RasterLayer;

    symbology!: RasterSymbology;

    // The min value used for color table generation
    layerMinValue: number | undefined = undefined;
    // The max value used for color table generation
    layerMaxValue: number | undefined = undefined;

    scale: 'linear' | 'logarithmic' = 'linear';

    unappliedChanges = false;

    histogramData = new ReplaySubject<VegaChartData>(1);
    histogramLoading = new BehaviorSubject(false);
    histogramCreated = false;

    paletteSelected = false; // TODO: Remove once color palette picker is implemented and switch to "getColorizerType()"

    protected histogramWorkflowId = new ReplaySubject<UUID>(1);
    protected histogramSubscription?: Subscription;

    protected defaultColor?: ColorAttributeInput;
    protected noDataColor?: ColorAttributeInput;

    constructor(
        protected readonly projectService: ProjectService,
        protected readonly backend: BackendService,
        protected readonly layoutService: LayoutService,
        protected readonly userService: UserService,
        protected readonly mapService: MapService,
        protected readonly config: Config,
    ) {}

    ngOnChanges(_changes: SimpleChanges): void {}

    ngOnInit(): void {
        this.symbology = this.layer.symbology.clone();
        this.updateNodataAndDefaultColor();

        this.updateSymbologyFromLayer();
        this.updateLayerMinMaxFromColorizer();

        this.createHistogramWorkflowId().subscribe((histogramWorkflowId) => this.histogramWorkflowId.next(histogramWorkflowId));
        this.updateColorizerType(this.getColorizerType()); // TODO: Remove after palettes are implemented
    }

    ngAfterViewInit(): void {}

    ngOnDestroy(): void {
        if (this.histogramSubscription) {
            this.histogramSubscription.unsubscribe();
        }
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

    /**
     * Get the opacity in the range [0, 100]
     */
    getOpacity(): number {
        return this.symbology.opacity * 100;
    }

    /**
     * Set the opacity value from a slider change event
     */
    updateOpacity(value: number): void {
        const opacity = value / 100;

        this.symbology = this.symbology.cloneWith({opacity});

        this.unappliedChanges = true;
    }

    getDefaultColor(): ColorAttributeInput {
        if (!this.defaultColor) {
            throw new Error('uninitialized defaultColor');
        }

        return this.defaultColor;
    }

    /**
     * Called from HTML template when a new value is emitted by the ColorPaletteEditor child component
     *
     * @param rasterSymbology The new rastersymbology to use
     */
    symbologyChangeHandler(rasterSymbology: RasterSymbology): void {
        this.symbology = rasterSymbology;
        this.unappliedChanges = true;
    }

    updateDefaultColor(defaultColorInput: ColorAttributeInput): void {
        const defaultColor = defaultColorInput.value;

        if (this.symbology.colorizer instanceof LinearGradient || this.symbology.colorizer instanceof LogarithmicGradient) {
            // TODO: refactor over/under color
            const colorizer = this.symbology.colorizer.cloneWith({overColor: defaultColor, underColor: defaultColor});
            this.symbology = this.symbology.cloneWith({colorizer});
        } else if (this.symbology.colorizer instanceof PaletteColorizer) {
            const colorizer = this.symbology.colorizer.cloneWith({defaultColor});
            this.symbology = this.symbology.cloneWith({colorizer});
        } else {
            throw new Error('unsupported colorizer type');
        }

        this.unappliedChanges = true;
    }

    applyChanges(): void {
        if (this.colorMapSelector !== undefined) {
            this.colorMapSelector.applyChanges();
        }

        if (this.colorPaletteEditor !== undefined) {
            this.colorPaletteEditor.setSymbology(this.symbology);
            this.colorPaletteEditor.initColorInputs();
            this.colorPaletteEditor.sortColorAttributeInputs();
        }

        this.unappliedChanges = false;
        this.update();
    }

    getNotified(): void {
        this.unappliedChanges = true;
    }

    resetChanges(layer: Layer): void {
        this.layoutService.setSidenavContentComponent({
            component: RasterSymbologyEditorComponent,
            config: {layer, histogramData: this.histogramData, histogramCreated: this.histogramCreated},
        });
    }

    getNoDataColor(): ColorAttributeInput {
        if (!this.noDataColor) {
            throw new Error('uninitialized noDataColor');
        }

        return this.noDataColor;
    }

    /**
     * Set the no data color
     */
    updateNoDataColor(noDataColorInput: ColorAttributeInput): void {
        const noDataColor = noDataColorInput.value;

        if (this.symbology.colorizer instanceof LinearGradient || this.symbology.colorizer instanceof LogarithmicGradient) {
            const colorizer = this.symbology.colorizer.cloneWith({noDataColor});
            this.symbology = this.symbology.cloneWith({colorizer});
        } else if (this.symbology.colorizer instanceof PaletteColorizer) {
            const colorizer = this.symbology.colorizer.cloneWith({noDataColor});
            this.symbology = this.symbology.cloneWith({colorizer});
        } else {
            throw new Error('unsupported colorizer type');
        }

        this.unappliedChanges = true;
    }

    getColorizerType(): 'linearGradient' | 'logarithmicGradient' | 'palette' {
        if (this.symbology.colorizer instanceof LinearGradient) {
            return 'linearGradient';
        }

        if (this.symbology.colorizer instanceof PaletteColorizer) {
            return 'palette';
        }

        if (this.symbology.colorizer instanceof LogarithmicGradient) {
            return 'logarithmicGradient';
        }

        throw Error('unknown colorizer type');
    }

    updateScale(): void {
        if (this.symbology.colorizer instanceof LogarithmicGradient) {
            this.scale = 'logarithmic';
            return;
        }

        this.scale = 'linear';
    }

    updateColorizerType(colorizerType: 'linearGradient' | 'logarithmicGradient' | 'palette'): void {
        // TODO: Remove this once palettes are fully implemented
        this.paletteSelected = colorizerType === 'linearGradient' || colorizerType === 'logarithmicGradient' ? false : true;

        if (this.getColorizerType() === colorizerType) {
            return;
        }

        const breakpoints = this.symbology.colorizer.getBreakpoints();
        let noDataColor: Color;
        let overColor: Color;
        let underColor: Color;
        let colorizer;

        if (this.symbology.colorizer instanceof LogarithmicGradient || this.symbology.colorizer instanceof LinearGradient) {
            noDataColor = this.symbology.colorizer.noDataColor;
            overColor = this.symbology.colorizer.overColor;
            underColor = this.symbology.colorizer.underColor;
        } else {
            // Must be a palette then, so use values from the color selectors or RGBA 0, 0, 0, 0 as a fallback
            const defaultColor: Color = this.defaultColor ? this.defaultColor.value : new Color({r: 0, g: 0, b: 0, a: 0});
            noDataColor = this.noDataColor ? this.noDataColor.value : new Color({r: 0, g: 0, b: 0, a: 0});
            overColor = defaultColor;
            underColor = defaultColor;
        }

        switch (colorizerType) {
            case 'linearGradient':
                colorizer = new LinearGradient(breakpoints, noDataColor, overColor, underColor);
                break;
            case 'logarithmicGradient':
                colorizer = new LogarithmicGradient(breakpoints, noDataColor, overColor, underColor);
                break;
            case 'palette':
                colorizer = new PaletteColorizer(this.colorPaletteEditor.getColors(), noDataColor, overColor);
                break;
        }
        this.symbology = this.symbology.cloneWith({colorizer});
        this.updateScale();
        this.unappliedChanges = true;
    }

    /**
     * Set the symbology colorizer
     */
    updateBreakpoints(breakpoints: Array<ColorBreakpoint>): void {
        if (!breakpoints) {
            return;
        }

        if (
            // try with palette
            !(this.symbology.colorizer instanceof LinearGradient) &&
            !(this.symbology.colorizer instanceof LogarithmicGradient && !(this.symbology.colorizer instanceof PaletteColorizer))
        ) {
            return;
            // TODO: implement other variants
        }

        this.symbology = this.symbology.cloneWith({colorizer: this.symbology.colorizer.cloneWith({breakpoints})});

        this.update();
    }

    /**
     * Sets the current (working) symbology to the one of the current layer.
     */
    updateSymbologyFromLayer(): void {
        if (!this.layer || !this.layer.symbology || this.layer.symbology.equals(this.symbology)) {
            return;
        }
        this.symbology = this.layer.symbology;

        this.updateNodataAndDefaultColor();

        this.updateScale();
    }

    /**
     * Sets the layer min/max values from the colorizer.
     */
    updateLayerMinMaxFromColorizer(): void {
        const breakpoints = this.symbology.colorizer.getBreakpoints();
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

    private updateNodataAndDefaultColor(): void {
        if (this.symbology.colorizer instanceof LinearGradient || this.symbology.colorizer instanceof LogarithmicGradient) {
            // TODO: refactor over/under color
            this.defaultColor = {
                key: 'Overflow Color',
                value: this.symbology.colorizer.underColor,
            };
        } else if (this.symbology.colorizer instanceof PaletteColorizer) {
            this.defaultColor = {
                key: 'Overflow Color',
                value: this.symbology.colorizer.defaultColor,
            };
        } else {
            // TODO: refactor over/under color
            this.defaultColor = undefined;
        }

        if (
            this.symbology.colorizer instanceof LinearGradient ||
            this.symbology.colorizer instanceof LogarithmicGradient ||
            this.symbology.colorizer instanceof PaletteColorizer
        ) {
            this.noDataColor = {
                key: 'No Data Color',
                value: this.symbology.colorizer.noDataColor,
            };
        } else {
            this.noDataColor = undefined;
        }
    }

    private update(): void {
        this.projectService.changeLayer(this.layer, {symbology: this.symbology});
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
                                buckets: 20,
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
