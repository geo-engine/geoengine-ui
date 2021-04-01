import {Component, Input, ChangeDetectionStrategy, OnChanges, SimpleChanges, OnDestroy, AfterViewInit, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {RasterSymbology} from '../symbology.model';
import {RasterLayer} from '../../layer.model';
import {MapService} from '../../../map/map.service';
import {ProjectService} from '../../../project/project.service';
import {Config} from '../../../config.service';
import {BackendService} from '../../../backend/backend.service';
import {MatSliderChange} from '@angular/material/slider';
import {HistogramParams} from '../../../backend/operator.model';
import {LinearGradient, PaletteColorizer} from '../../../colors/colorizer.model';
import {ColorAttributeInput} from '../../../colors/color-attribute-input/color-attribute-input.component';
import {WorkflowDict} from '../../../backend/backend.model';
import {ColorBreakpoint} from '../../../colors/color-breakpoint.model';

/**
 * An editor for generating raster symbologies.
 */
@Component({
    selector: 'wave-raster-symbology-editor',
    templateUrl: 'raster-symbology-editor.component.html',
    styleUrls: ['raster-symbology-editor.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RasterSymbologyEditorComponent implements OnChanges, OnDestroy, AfterViewInit, OnInit {
    @Input() layer!: RasterLayer;

    symbology: RasterSymbology;

    // The min value used for color table generation
    layerMinValue: number | undefined = undefined;
    // The max value used for color table generation
    layerMaxValue: number | undefined = undefined;
    // A subject with the histogram data of the current layer view
    // layerHistogramData$: ReplaySubject<HistogramData> = new ReplaySubject(1);
    // Subject indicating if the histogram is still processing
    // layerHistogramDataLoading$ = new BehaviorSubject(false);
    // Histogram auto reload enabled / disabled
    // layerHistogramAutoReloadEnabled = true;
    // private layerHistogramDataSubscription: Subscription = undefined;

    constructor(
        protected readonly projectService: ProjectService,
        protected readonly backend: BackendService,
        protected readonly mapService: MapService,
        protected readonly config: Config,
    ) {}

    ngOnChanges(_changes: SimpleChanges): void {}

    ngOnInit(): void {
        this.symbology = this.layer.symbology.clone();

        this.updateSymbologyFromLayer();
        this.updateLayerMinMaxFromColorizer();
    }

    ngAfterViewInit(): void {
        // this.reinitializeLayerHistogramDataSubscription();
    }

    ngOnDestroy(): void {
        // this.layerHistogramDataSubscription.unsubscribe();
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

    /**
     * Get the opacity in the range [0, 100]
     */
    getOpacity(): number {
        return this.symbology.opacity * 100;
    }

    /**
     * Set the opacity value from a slider change event
     */
    updateOpacity(event: MatSliderChange): void {
        if (!event || !event.value) {
            return;
        }

        const opacity = event.value / 100;

        this.symbology = this.symbology.cloneWith({opacity});

        this.update();
    }

    getDefaultColor(): ColorAttributeInput {
        const key = 'Overflow Color';
        if (this.symbology.colorizer instanceof LinearGradient || this.symbology.colorizer instanceof PaletteColorizer) {
            return {
                key,
                value: this.symbology.colorizer.defaultColor,
            };
        } else {
            throw new Error('unsupported colorizer type');
        }
    }

    updateDefaultColor(defaultColorInput: ColorAttributeInput): void {
        const defaultColor = defaultColorInput.value;

        if (this.symbology.colorizer instanceof LinearGradient) {
            const colorizer = this.symbology.colorizer.cloneWith({defaultColor});
            this.symbology = this.symbology.cloneWith({colorizer});
        } else if (this.symbology.colorizer instanceof PaletteColorizer) {
            const colorizer = this.symbology.colorizer.cloneWith({defaultColor});
            this.symbology = this.symbology.cloneWith({colorizer});
        } else {
            throw new Error('unsupported colorizer type');
        }

        this.update();
    }

    getNoDataColor(): ColorAttributeInput {
        const key = 'No Data Color';
        if (this.symbology.colorizer instanceof LinearGradient || this.symbology.colorizer instanceof PaletteColorizer) {
            return {
                key,
                value: this.symbology.colorizer.noDataColor,
            };
        } else {
            throw new Error('unsupported colorizer type');
        }
    }

    /**
     * Set the no data color
     */
    updateNoDataColor(noDataColorInput: ColorAttributeInput): void {
        const noDataColor = noDataColorInput.value;

        if (this.symbology.colorizer instanceof LinearGradient) {
            const colorizer = this.symbology.colorizer.cloneWith({noDataColor});
            this.symbology = this.symbology.cloneWith({colorizer});
        } else if (this.symbology.colorizer instanceof PaletteColorizer) {
            const colorizer = this.symbology.colorizer.cloneWith({noDataColor});
            this.symbology = this.symbology.cloneWith({colorizer});
        } else {
            throw new Error('unsupported colorizer type');
        }

        this.update();
    }

    getColorizerType(): 'linearGradient' | 'logarithmicGradient' | 'palette' {
        if (this.symbology.colorizer instanceof LinearGradient) {
            return 'linearGradient';
        }

        if (this.symbology.colorizer instanceof PaletteColorizer) {
            return 'palette';
        }
    }

    updateColorizerType(_colorizerType: 'linearGradient' | 'logarithmicGradient' | 'palette'): void {
        // TODO: implement
    }

    /**
     * Set the symbology colorizer
     */
    updateBreakpoints(breakpoints: Array<ColorBreakpoint>): void {
        if (!breakpoints) {
            return;
        }

        if (!(this.symbology.colorizer instanceof LinearGradient)) {
            return;
            // TODO: implement other variants
        }

        this.symbology = this.symbology.cloneWith({colorizer: this.symbology.colorizer.cloneWith({breakpoints})});

        this.update();
    }

    /**
     * Access the current colorizer min value. May be undefined.
     */
    // get colorizerMinValue(): number | undefined {
    //     return this.symbology.colorizer.firstBreakpoint.value as number;
    // }

    /**
     * Access the current colorizer max value. May be undefined.
     */
    // get colorizerMaxValue(): number | undefined {
    //     return this.symbology.colorizer.lastBreakpoint.value as number;
    // }

    /**
     * Sets the current (working) symbology to the one of the current layer.
     */
    updateSymbologyFromLayer(): void {
        if (!this.layer || !this.layer.symbology || this.layer.symbology.equals(this.symbology)) {
            return;
        }
        this.symbology = this.layer.symbology;
    }

    /**
     * Sets the layer min/max values from the colorizer.
     */
    updateLayerMinMaxFromColorizer(): void {
        const breakpoints = this.symbology.colorizer.getBreakpoints();
        this.updateLayerMinValue(breakpoints[0].value);
        this.updateLayerMaxValue(breakpoints[breakpoints.length - 1].value);
    }

    /**
     * Update the histogram auto reload setting.
     * @param event contains a checked: boolean value.
     */
    // updateHistogramAutoReload(event: MatSlideToggleChange): void {
    //     this.layerHistogramAutoReloadEnabled = event.checked;
    // }

    private update(): void {
        this.projectService.changeLayer(this.layer, {symbology: this.symbology});
    }

    // private reinitializeLayerHistogramDataSubscription(): void {
    //     if (this.layerHistogramDataSubscription) {
    //         this.layerHistogramDataSubscription.unsubscribe();
    //     }

    //     this.layerHistogramData$.next(undefined);
    //     this.layerHistogramDataLoading$.next(true);

    //     const sub = observableCombineLatest(
    //         observableCombineLatest(
    //             this.projectService.getTimeStream(),
    //             this.projectService.getProjectionStream(),
    //             this.mapService.getViewportSizeStream(),
    //         ).pipe(
    //             filter((_) => this.layerHistogramAutoReloadEnabled),
    //             debounceTime(this.config.DELAYS.DEBOUNCE),
    //         ),
    //         this.projectService.getLayerChangesStream(this.layer).pipe(
    //             startWith({operator: true}),
    //             filter((c) => c.operator !== undefined),
    //             map((_) => this.buildHistogramOperator()),
    //         ),
    //     ).subscribe(([[projectTime, projection, viewport], histogramOperator]) => {
    //         this.layerHistogramData$.next(undefined);
    //         this.layerHistogramDataLoading$.next(true);

    //         this.mappingQueryService
    //             .getPlotData({
    //                 operator: histogramOperator,
    //                 time: projectTime,
    //                 extent: viewport.extent,
    //                 projection,
    //             })
    //             .subscribe((data) => {
    //                 this.layerHistogramData$.next(data as HistogramData);
    //                 this.layerHistogramDataLoading$.next(false);
    //             });
    //     });
    //     this.layerHistogramDataSubscription = sub;
    // }

    private createHistogramWorkflow(): Observable<WorkflowDict> {
        return this.projectService.getWorkflow(this.layer.workflowId).pipe(
            map((workflow) => ({
                type: 'Plot',
                operator: {
                    type: 'Histogram',
                    params: {
                        buckets: 20,
                        bounds: 'data',
                        interactive: true,
                    } as HistogramParams,
                    raster_sources: [workflow.operator],
                },
            })),
        );
    }
}
