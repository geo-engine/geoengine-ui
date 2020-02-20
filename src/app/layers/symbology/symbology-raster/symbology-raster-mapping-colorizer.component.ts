import {
    Component,
    Input,
    Output,
    EventEmitter,
    ChangeDetectionStrategy,
    OnChanges,
    SimpleChanges,
    OnInit,
    AfterViewInit, OnDestroy, ElementRef
} from '@angular/core';

import {AbstractVectorSymbology, MappingColorizerRasterSymbology} from '../symbology.model';
import {MatSliderChange} from '@angular/material';
import {ColorizerData} from '../../../colors/colorizer-data.model';
import {ColorBreakpoint} from '../../../colors/color-breakpoint.model';
import {RasterLayer, VectorLayer} from '../../layer.model';
import {BehaviorSubject, combineLatest as observableCombineLatest, Subscription} from 'rxjs';
import {HistogramData} from '../../../plots/histogram/histogram.component';
import {LayoutService} from '../../../layout.service';
import {ProjectService} from '../../../project/project.service';
import {Operator} from '../../../operators/operator.model';
import {HistogramType} from '../../../operators/types/histogram-type.model';
import {DataType} from '../../../operators/datatype.model';
import {Unit} from '../../../operators/unit.model';
import {first} from 'rxjs/operators';
import {ResultTypes} from '../../../operators/result-type.model';
import {MappingQueryService} from '../../../queries/mapping-query.service';
import {MapService} from '../../../map/map.service';

@Component({
    selector: 'wave-symbology-raster-mapping-colorizer',
    templateUrl: 'symbology-raster-mapping-colorizer.component.html',
    styleUrls: ['symbology-raster-mapping-colorizer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SymbologyRasterMappingColorizerComponent implements OnChanges, OnInit, AfterViewInit, OnDestroy {

    @Input() layer: RasterLayer<MappingColorizerRasterSymbology>;
    @Output() symbologyChanged: EventEmitter<MappingColorizerRasterSymbology> = new EventEmitter<MappingColorizerRasterSymbology>();

    symbology: MappingColorizerRasterSymbology;

    layerMinValue: number | undefined = undefined;
    layerMaxValue: number | undefined = undefined;
    layerHistogramData$: BehaviorSubject<HistogramData> = new BehaviorSubject(undefined);
    layerHistogramDataLoading$ = new BehaviorSubject(false);
    layerHistogramWidth: number;
    layerHistogramHeight: number;
    private subscriptions: Array<Subscription> = [];

    constructor(
        public projectService: ProjectService,
        public elementRef: ElementRef,
        public mappingQueryService: MappingQueryService,
        public mapService: MapService
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
        // this.changeDetectorRef.markForCheck(); // TODO: only markForCheck if there is a change!
        for (let propName in changes) { // tslint:disable-line:forin
            switch (propName) {
                case 'layer':
                    this.updateSymbologyFromLayer();
                    this.updateLayerMinMaxFromColorizer();
                    this.updateLayerHistogram();
                    break;
                default: // DO NOTHING
            }
        }
    }

    ngOnInit(): void {
        this.updateSymbologyFromLayer();
        this.updateLayerMinMaxFromColorizer();
        this.updateLayerHistogram();
    }

    ngAfterViewInit() {
        // calculate size for histogram
        const panelStyle = getComputedStyle(this.elementRef.nativeElement.querySelector('mat-expansion-panel'));
        const panelWidth = parseInt(panelStyle.width, 10) - 2 * LayoutService.remInPx();
        const paneleight = parseInt(panelStyle.height, 10) - 2 * LayoutService.remInPx();
        this.layerHistogramWidth = panelWidth;
        this.layerHistogramHeight = Math.max(paneleight / 3, panelWidth / 3);
    }

    ngOnDestroy() {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
    }

    updateLayerHistogram() {
        this.layerHistogramData$.next(undefined);

        const histogramOperator = new Operator({
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

        this.layerHistogramDataLoading$.next(true);
        const sub = observableCombineLatest(this.projectService.getTimeStream().pipe(
            first()),
            this.projectService.getProjectionStream().pipe(
                first()
            )
        )
            .subscribe(([projectTime, projection]) => {
                this.mappingQueryService.getPlotData({
                    operator: histogramOperator,
                    time: projectTime,
                    extent: this.mapService.getViewportSize().extent,
                    projection: projection,
                }).subscribe(data => {
                    this.layerHistogramData$.next(data as HistogramData);
                    this.layerHistogramDataLoading$.next(false);
                });
            });


        this.subscriptions.push(sub);
    }
}
