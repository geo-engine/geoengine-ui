import {
    Component,
    Input,
    Output,
    EventEmitter,
    ChangeDetectionStrategy,
    OnChanges,
    SimpleChanges,
    OnDestroy, AfterViewInit, OnInit
} from '@angular/core';

import {MappingRasterSymbology} from '../symbology.model';
import {ColorizerData} from '../../../colors/colorizer-data.model';
import {ColorBreakpoint} from '../../../colors/color-breakpoint.model';
import {RasterLayer} from '../../layer.model';
import {BehaviorSubject, combineLatest as observableCombineLatest, ReplaySubject, Subscription} from 'rxjs';
import {HistogramData} from '../../../plots/histogram/histogram.component';
import {ProjectService} from '../../../project/project.service';
import {Operator} from '../../../operators/operator.model';
import {HistogramType} from '../../../operators/types/histogram-type.model';
import {DataType} from '../../../operators/datatype.model';
import {Unit} from '../../../operators/unit.model';
import {debounceTime, filter, map, startWith} from 'rxjs/operators';
import {ResultTypes} from '../../../operators/result-type.model';
import {MappingQueryService} from '../../../queries/mapping-query.service';
import {MapService} from '../../../map/map.service';
import {Config} from '../../../config.service';
import {MatSliderChange} from '@angular/material/slider';
import {MatSlideToggleChange} from '@angular/material/slide-toggle';

@Component({
    selector: 'wave-symbology-raster-mapping-colorizer',
    templateUrl: 'symbology-raster-mapping-colorizer.component.html',
    styleUrls: ['symbology-raster-mapping-colorizer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SymbologyRasterMappingColorizerComponent implements OnChanges, OnDestroy, AfterViewInit, OnInit {

    @Input() layer: RasterLayer<MappingRasterSymbology>;
    @Output() symbologyChanged: EventEmitter<MappingRasterSymbology> = new EventEmitter<MappingRasterSymbology>();

    symbology: MappingRasterSymbology;

    layerMinValue: number | undefined = undefined;
    layerMaxValue: number | undefined = undefined;
    layerHistogramData$: ReplaySubject<HistogramData> = new ReplaySubject(1);
    layerHistogramDataLoading$ = new BehaviorSubject(false);
    layerHistogramAutoReloadEnabled = true;
    private layerHistogramDataSubscription: Subscription = undefined;

    constructor(
        public projectService: ProjectService,
        public mappingQueryService: MappingQueryService,
        public mapService: MapService,
        public config: Config
    ) {
    }

    updateLayerMinValue(min: number) {
        if (this.layerMinValue !== min) {
            this.layerMinValue = min;
        }
    }

    updateLayerMaxValue(max: number) {
        if (this.layerMaxValue !== max) {
            this.layerMaxValue = max;
        }
    }

    updateOpacity(event: MatSliderChange) {
        this.symbology.opacity = (event.value === undefined || event.value === 0) ? 0 : event.value / 100;
        this.update();
    }

    updateOverflowColor(event: ColorBreakpoint) {
        if (event && !event.equals(this.symbology.overflowColor)) {
            this.symbology.overflowColor = event;
            this.update();
        }
    }

    updateNoDataColor(event: ColorBreakpoint) {
        if (event && !event.equals(this.symbology.noDataColor)) {
            this.symbology.noDataColor = event;
            this.update();
        }
    }

    updateColorizer(event: ColorizerData) {
        if (event && !event.equals(this.symbology.colorizer)) {
            this.symbology.colorizer = event;
            this.update();
        }
    }

    get colorizerMinValue(): number | undefined {
        return this.symbology.colorizer.firstBreakpoint.value as number;
    }

    get colorizerMaxValue(): number | undefined {
        return this.symbology.colorizer.lastBreakpoint.value as number;
    }

    updateSymbologyFromLayer() {
        if (!this.layer || !this.layer.symbology || this.layer.symbology.equals(this.symbology)) {
            return;
        }
        this.symbology = this.layer.symbology;
    }

    updateLayerMinMaxFromColorizer() {
        this.updateLayerMaxValue(this.colorizerMinValue);
        this.updateLayerMaxValue(this.colorizerMaxValue);
    }

    update() {
        this.symbologyChanged.emit(this.symbology.clone());
    }

    ngOnChanges(changes: SimpleChanges): void {
        for (const propName in changes) { // tslint:disable-line:forin
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

    ngOnDestroy() {
        this.layerHistogramDataSubscription.unsubscribe();
    }

    updateHistogramAutoReload(event: MatSlideToggleChange) {
        this.layerHistogramAutoReloadEnabled = event.checked;
    }

    reinitializeLayerHistogramDataSubscription() {
        if (this.layerHistogramDataSubscription) {
            this.layerHistogramDataSubscription.unsubscribe();
        }

        this.layerHistogramData$.next(undefined);
        this.layerHistogramDataLoading$.next(true);

        const sub = observableCombineLatest(
            observableCombineLatest(
                this.projectService.getTimeStream(),
                this.projectService.getProjectionStream(),
                this.mapService.getViewportSizeStream()
            ).pipe(
                filter(_ => this.layerHistogramAutoReloadEnabled),
                debounceTime(this.config.DELAYS.DEBOUNCE)
            ),
            this.projectService.getLayerChangesStream(this.layer).pipe(
                startWith({operator: true}),
                filter(c => c.operator !== undefined),
                map(_ => this.buildHistogramOperator())
            )
        ).subscribe(([[projectTime, projection, viewport], histogramOperator]) => {
            this.layerHistogramData$.next(undefined);
            this.layerHistogramDataLoading$.next(true);

            this.mappingQueryService.getPlotData({
                operator: histogramOperator,
                time: projectTime,
                extent: viewport.extent,
                projection,
            }).subscribe(data => {
                this.layerHistogramData$.next(data as HistogramData);
                this.layerHistogramDataLoading$.next(false);
            });
        });
        this.layerHistogramDataSubscription = sub;
    }

    private buildHistogramOperator(): Operator {
        return new Operator({
            operatorType: new HistogramType({
                attribute: 'value',
                range: 'data',
            }),
            resultType: ResultTypes.PLOT,
            projection: this.layer.operator.projection,
            attributes: [],
            dataTypes: new Map<string, DataType>(),
            units: new Map<string, Unit>(),
            rasterSources: [this.layer.operator],
        });
    }
}
