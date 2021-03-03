import {BehaviorSubject, Observable, Subscription, combineLatest} from 'rxjs';
import {first, map} from 'rxjs/operators';
import {AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy} from '@angular/core';
import {HistogramData} from '../../../plots/histogram/histogram.component';
import {RandomColorService} from '../../../util/services/random-color.service';
import {MappingQueryService} from '../../../queries/mapping-query.service';
import {VectorLayer} from '../../../layers/layer.model';
import {ResultTypes} from '../../result-type.model';
import {DataType, DataTypes} from '../../datatype.model';
import {AbstractVectorSymbology} from '../../../layers/symbology/symbology.model';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Operator} from '../../operator.model';
import {NumericAttributeFilterType} from '../../types/numeric-attribute-filter-type.model';
import {HistogramType} from '../../types/histogram-type.model';
import {Unit} from '../../unit.model';
import {ProjectService} from '../../../project/project.service';
import {LayoutService} from '../../../layout.service';
import {WaveValidators} from '../../../util/form.validators';
import {MapService} from '../../../map/map.service';

/**
 * This component allows creating the numeric attribute filter operator.
 */
@Component({
    selector: 'wave-numeric-attribute-filter',
    templateUrl: './numeric-attribute-filter.component.html',
    styleUrls: ['./numeric-attribute-filter.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumericAttributeFilterOperatorComponent implements AfterViewInit, OnDestroy {
    readonly ResultTypes = ResultTypes;

    readonly form: FormGroup;
    readonly attributes$: Observable<Array<string>>;
    readonly data$: BehaviorSubject<HistogramData> = new BehaviorSubject(undefined);
    readonly dataLoading$ = new BehaviorSubject(false);
    readonly attributeUnit$ = new BehaviorSubject('');

    histogramWidth: number;
    histogramHeight: number;

    private subscriptions: Array<Subscription> = [];

    constructor(
        private randomColorService: RandomColorService,
        private mappingQueryService: MappingQueryService,
        private projectService: ProjectService,
        private mapService: MapService,
        private formBuilder: FormBuilder,
        private elementRef: ElementRef,
    ) {
        this.form = formBuilder.group({
            name: ['Filtered Values', [Validators.required, WaveValidators.notOnlyWhitespace]],
            inputLayer: [undefined, Validators.required],
            attribute: [undefined, Validators.required],
            bounds: formBuilder.group(
                {
                    min: [undefined],
                    max: [undefined],
                },
                {
                    validator: WaveValidators.minAndMax('min', 'max'),
                },
            ),
            noData: [false, Validators.required],
        });

        this.subscriptions.push(
            this.form.controls['attribute'].valueChanges.subscribe((attribute: string) => {
                if (!attribute) {
                    this.data$.next(undefined);
                    return;
                }

                const vectorLayer: VectorLayer<AbstractVectorSymbology> = this.form.controls['inputLayer'].value;

                const operator = new Operator({
                    operatorType: new HistogramType({
                        attribute: attribute,
                        range: 'data',
                    }),
                    resultType: ResultTypes.PLOT,
                    projection: vectorLayer.operator.projection,
                    attributes: [],
                    dataTypes: new Map<string, DataType>(),
                    units: new Map<string, Unit>(),
                    pointSources: vectorLayer.operator.resultType === ResultTypes.POINTS ? [vectorLayer.operator] : [],
                    lineSources: vectorLayer.operator.resultType === ResultTypes.LINES ? [vectorLayer.operator] : [],
                    polygonSources: vectorLayer.operator.resultType === ResultTypes.POLYGONS ? [vectorLayer.operator] : [],
                });

                this.dataLoading$.next(true);

                combineLatest([
                    this.projectService.getTimeStream().pipe(first()),
                    this.projectService.getProjectionStream().pipe(first()),
                ]).subscribe(([projectTime, projection]) => {
                    this.mappingQueryService
                        .getPlotData({
                            operator: operator,
                            time: projectTime,
                            extent: this.mapService.getViewportSize().extent,
                            projection: projection,
                        })
                        .subscribe((data) => {
                            this.data$.next(data as HistogramData);
                            this.dataLoading$.next(false);
                        });
                });
            }),
        );

        this.attributes$ = this.form.controls['inputLayer'].valueChanges.pipe(
            map((layer) => {
                // side effect!!!
                this.form.controls['attribute'].setValue(undefined);

                if (layer) {
                    this.form.controls['attribute'].enable({onlySelf: true});
                    return layer.operator.attributes
                        .filter((attribute: string) => {
                            return DataTypes.ALL_NUMERICS.indexOf(layer.operator.dataTypes.get(attribute)) >= 0;
                        })
                        .toArray();
                } else {
                    this.form.controls['attribute'].disable({onlySelf: true});
                    return [];
                }
            }),
        );

        this.subscriptions.push(
            this.form.controls['attribute'].valueChanges
                .pipe(
                    map((attribute: string) => {
                        if (!attribute) {
                            return '';
                        }

                        const operator = this.form.controls['inputLayer'].value.operator as Operator;
                        const unit = operator.getUnit(attribute);

                        if (!unit || unit.unit === Unit.defaultUnit.unit || unit.measurement === Unit.defaultUnit.measurement) {
                            return '';
                        } else {
                            return unit.unit;
                        }
                    }),
                )
                .subscribe((unit) => this.attributeUnit$.next(unit)),
        );
    }

    ngAfterViewInit() {
        // calculate size for histogram
        const formStyle = getComputedStyle(this.elementRef.nativeElement.querySelector('form'));
        const formWidth = parseInt(formStyle.width, 10) - 2 * LayoutService.remInPx - LayoutService.scrollbarWidthPx();
        const formHeight = parseInt(formStyle.height, 10) - 2 * LayoutService.remInPx;

        this.histogramWidth = formWidth;
        this.histogramHeight = Math.max(formHeight / 3, formWidth / 3);

        // initially get attributes
        setTimeout(() => this.form.controls['inputLayer'].enable({emitEvent: true}));
    }

    ngOnDestroy() {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }

    add(_event: any) {
        const vectorLayer: VectorLayer<AbstractVectorSymbology> = this.form.controls['inputLayer'].value;
        const vectorOperator: Operator = vectorLayer.operator;

        const units = vectorOperator.units;
        const dataTypes = vectorOperator.dataTypes;
        const attributes = vectorOperator.attributes;

        const noData: boolean = this.form.controls['noData'].value;
        const attributeName: string = this.form.controls['attribute'].value;
        const boundsMin: number = this.form.controls['bounds'].value.min;
        const boundsMax: number = this.form.controls['bounds'].value.max;

        const name: string = this.form.controls['name'].value;

        const dict = {
            operatorType: new NumericAttributeFilterType({
                attributeName: attributeName,
                includeNoData: noData,
                rangeMin: boundsMin === null ? undefined : boundsMin,
                rangeMax: boundsMax === null ? undefined : boundsMax,
            }),
            resultType: vectorOperator.resultType,
            projection: vectorOperator.projection,
            attributes: attributes,
            dataTypes: dataTypes,
            units: units,
            pointSources: [],
            lineSources: [],
            polygonSources: [],
        };

        switch (vectorOperator.resultType) {
            case ResultTypes.POINTS:
                dict.pointSources.push(vectorOperator);
                break;
            case ResultTypes.LINES:
                dict.lineSources.push(vectorOperator);
                break;
            case ResultTypes.POLYGONS:
                dict.polygonSources.push(vectorOperator);
                break;
            default:
                throw Error('Incompatible Input Type');
        }

        const operator = new Operator(dict);

        const symbology = (vectorLayer.symbology.clone() as any) as AbstractVectorSymbology;
        symbology.fillRGBA = this.randomColorService.getRandomColorRgba();

        const clustered = vectorLayer.clustered;

        const layer = new VectorLayer({
            name: name,
            operator: operator,
            symbology,
            clustered,
        });

        this.projectService.addLayer(layer);
    }
}
