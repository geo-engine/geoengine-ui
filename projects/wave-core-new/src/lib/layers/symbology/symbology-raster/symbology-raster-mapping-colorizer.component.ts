import {
    Component,
    Input,
    Output,
    EventEmitter,
    ChangeDetectionStrategy,
    OnChanges,
    SimpleChanges,
    OnDestroy,
    AfterViewInit,
    OnInit,
} from '@angular/core';

import {MappingRasterSymbology} from '../symbology.model';
import {ColorizerData} from '../../../colors/colorizer-data.model';
import {ColorBreakpoint} from '../../../colors/color-breakpoint.model';
import {RasterLayer} from '../../layer.model';
import {BehaviorSubject, combineLatest, ReplaySubject, Subscription} from 'rxjs';
import {ProjectService} from '../../../project/project.service';
import {debounceTime, filter, map, startWith} from 'rxjs/operators';
import {MapService} from '../../../map/map.service';
import {Config} from '../../../config.service';
import {MatSliderChange} from '@angular/material/slider';
import {MatSlideToggleChange} from '@angular/material/slide-toggle';

// TODO: use correct types
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface HistogramData {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Operator {}

/**
 * The symbology editor component for raster data, which is colorized by the mapping backend
 */
@Component({
    selector: 'wave-symbology-raster-mapping-colorizer',
    templateUrl: 'symbology-raster-mapping-colorizer.component.html',
    styleUrls: ['symbology-raster-mapping-colorizer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SymbologyRasterMappingColorizerComponent implements OnChanges, OnDestroy, AfterViewInit, OnInit {
    @Input() layer: RasterLayer;
    @Output() symbologyChanged: EventEmitter<MappingRasterSymbology> = new EventEmitter<MappingRasterSymbology>();

    symbology: MappingRasterSymbology;

    // The min value used for color table generation
    layerMinValue: number | undefined = undefined;
    // The max value used for color table generation
    layerMaxValue: number | undefined = undefined;
    // A subject with the histogram data of the current layer view
    layerHistogramData$: ReplaySubject<HistogramData> = new ReplaySubject(1);
    // Subject indicating if the histogram is still processing
    layerHistogramDataLoading$ = new BehaviorSubject(false);
    // Histogram auto reload enabled / disabled
    layerHistogramAutoReloadEnabled = true;
    private layerHistogramDataSubscription: Subscription = undefined;

    constructor(
        public projectService: ProjectService,
        // public mappingQueryService: MappingQueryService,
        public mapService: MapService,
        public config: Config,
    ) {}

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
     * Set the opacity value from a slider change event
     */
    updateOpacity(event: MatSliderChange): void {
        this.symbology.opacity = event.value === undefined || event.value === 0 ? 0 : event.value / 100;
        this.update();
    }

    /**
     * Set the overflow color
     */
    updateOverflowColor(colorBreakpoint: ColorBreakpoint): void {
        if (colorBreakpoint) {
            this.symbology.overflowColor = colorBreakpoint;
            this.update();
        }
    }

    /**
     * Set the no data color
     */
    updateNoDataColor(colorBreakpoint: ColorBreakpoint): void {
        if (colorBreakpoint) {
            this.symbology.noDataColor = colorBreakpoint;
            this.update();
        }
    }

    /**
     * Set the symbology colorizer
     */
    updateColorizer(colorizerData: ColorizerData): void {
        if (colorizerData) {
            this.symbology.colorizer = colorizerData;
            this.update();
        }
    }

    /**
     * Access the current colorizer min value. May be undefined.
     */
    get colorizerMinValue(): number | undefined {
        return this.symbology.colorizer.firstBreakpoint.value as number;
    }

    /**
     * Access the current colorizer max value. May be undefined.
     */
    get colorizerMaxValue(): number | undefined {
        return this.symbology.colorizer.lastBreakpoint.value as number;
    }

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
        this.updateLayerMaxValue(this.colorizerMinValue);
        this.updateLayerMaxValue(this.colorizerMaxValue);
    }

    /**
     * Update the histogram auto reload setting.
     *
     * @param event contains a checked: boolean value.
     */
    updateHistogramAutoReload(event: MatSlideToggleChange): void {
        this.layerHistogramAutoReloadEnabled = event.checked;
    }

    ngOnChanges(changes: SimpleChanges): void {
        // eslint-disable-next-line guard-for-in
        for (const propName in changes) {
            switch (propName) {
                case 'layer': {
                    if (changes['layer'].firstChange) {
                        break;
                    }
                    this.updateSymbologyFromLayer();
                    this.updateLayerMinMaxFromColorizer();
                    //                    this.updateLayerHistogramOperator();
                    this.reinitializeLayerHistogramDataSubscription();

                    break;
                }
                default: // DO NOTHING
            }
        }
    }

    ngOnInit(): void {
        this.updateSymbologyFromLayer();
        this.updateLayerMinMaxFromColorizer();
    }

    ngAfterViewInit(): void {
        // this.updateLayerHistogramOperator();
        this.reinitializeLayerHistogramDataSubscription();
    }

    ngOnDestroy(): void {
        this.layerHistogramDataSubscription.unsubscribe();
    }

    private update(): void {
        this.symbologyChanged.emit(this.symbology.clone());
    }

    private reinitializeLayerHistogramDataSubscription(): void {
        if (this.layerHistogramDataSubscription) {
            this.layerHistogramDataSubscription.unsubscribe();
        }

        this.layerHistogramData$.next(undefined);
        this.layerHistogramDataLoading$.next(true);

        const sub = combineLatest([
            combineLatest([
                this.projectService.getTimeStream(),
                this.projectService.getSpatialReferenceStream(),
                this.mapService.getViewportSizeStream(),
            ]).pipe(
                filter((_) => this.layerHistogramAutoReloadEnabled),
                debounceTime(this.config.DELAYS.DEBOUNCE),
            ),
            this.projectService.getLayerChangesStream(this.layer).pipe(
                startWith({operator: true}),
                // filter(c => c.operator !== undefined), // TODO: refactor
                map((_) => this.buildHistogramOperator()),
            ),
        ]).subscribe(([[_projectTime, _projection, _viewport], _histogramOperator]) => {
            this.layerHistogramData$.next(undefined);
            this.layerHistogramDataLoading$.next(true);

            // TODO: use plot
            // this.mappingQueryService.getPlotData({
            //     operator: histogramOperator,
            //     time: projectTime,
            //     extent: viewport.extent,
            //     projection,
            // }).subscribe(data => {
            //     this.layerHistogramData$.next(data as HistogramData);
            //     this.layerHistogramDataLoading$.next(false);
            // });
        });
        this.layerHistogramDataSubscription = sub;
    }

    private buildHistogramOperator(): Operator {
        // TODO: build operator
        // return new Operator({
        //     operatorType: new HistogramType({
        //         attribute: 'value',
        //         range: 'data',
        //     }),
        //     resultType: ResultTypes.PLOT,
        //     projection: this.layer.operator.projection,
        //     attributes: [],
        //     dataTypes: new Map<string, DataType>(),
        //     units: new Map<string, Unit>(),
        //     rasterSources: [this.layer.operator],
        // });

        return {};
    }
}
