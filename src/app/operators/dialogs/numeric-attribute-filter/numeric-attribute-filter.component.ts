import {
    Component, ChangeDetectionStrategy, OnDestroy, AfterViewInit,
} from '@angular/core';

import {HistogramData} from '../../../plots/histogram.component';

import {LayerService} from '../../../../layers/layer.service';
import {RandomColorService} from '../../../../services/random-color.service';
import {MappingQueryService} from '../../../../queries/mapping-query.service';

import {VectorLayer} from '../../../../layers/layer.model';
import {ResultTypes} from '../../result-type.model';
import {DataTypes, DataType} from '../../datatype.model';
import {
    AbstractVectorSymbology, ClusteredPointSymbology, SimplePointSymbology
} from '../../../../symbology/symbology.model';
import {FormGroup, FormBuilder, Validators, AbstractControl} from '@angular/forms';
import {Subscription, BehaviorSubject, Observable} from 'rxjs/Rx';
import {Operator} from '../../operator.model';
import {NumericAttributeFilterType} from '../../types/numeric-attribute-filter-type.model';
import {MdDialogRef} from '@angular/material';
import {HistogramType} from '../../types/histogram-type.model';
import {Unit} from '../../unit.model';
import {ProjectService} from '../../../project/project.service';

function minMax(control: AbstractControl): {[key: string]: boolean} {
    const min = control.get('min').value;
    const max = control.get('max').value;

    const errors: {
        minOverMax?: boolean,
        noFilter?: boolean,
    } = {};

    if (min && max && max < min) {
        errors.minOverMax = true;
    }

    if (!min && !max) {
        errors.noFilter = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
}


/**
 * This component allows creating the numeric attribute filter operator.
 */
@Component({
    selector: 'wave-numeric-attribute-filter',
    templateUrl: 'numeric-attribute-filter.component.html',
    styleUrls: ['numeric-attribute-filter.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumericAttributeFilterOperatorComponent implements AfterViewInit, OnDestroy {
    ResultTypes = ResultTypes;

    form: FormGroup;

    private subscriptions: Array<Subscription> = [];

    attributes$: Observable<Array<string>>;

    data$: BehaviorSubject<HistogramData> = new BehaviorSubject(undefined);
    dataLoading$ = new BehaviorSubject(false);

    constructor(private layerService: LayerService,
                private randomColorService: RandomColorService,
                private mappingQueryService: MappingQueryService,
                private projectService: ProjectService,
                private formBuilder: FormBuilder,
                private dialogRef: MdDialogRef<NumericAttributeFilterOperatorComponent>) {
        this.form = formBuilder.group({
            name: ['Filtered Values', Validators.required],
            pointLayer: [undefined, Validators.required],
            attribute: [undefined, Validators.required],
            bounds: formBuilder.group({
                min: [undefined],
                max: [undefined]
            }, {
                validator: minMax
            }),
            noData: [false, Validators.required]
        });

        this.subscriptions.push(this.form.controls['attribute'].valueChanges.subscribe((attribute: string) => {
            if (!attribute) {
                this.data$.next(undefined);
                return;
            }

            const vectorLayer: VectorLayer<AbstractVectorSymbology> = this.form.controls['pointLayer'].value;

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
                pointSources: [vectorLayer.operator],
            });

            this.dataLoading$.next(true);
            this.mappingQueryService.getPlotData({
                operator: operator,
                time: this.projectService.getTime(),
            }).subscribe(data => {
                this.data$.next(data as HistogramData);
                this.dataLoading$.next(false);
            });
        }));

        this.attributes$ = this.form.controls['pointLayer'].valueChanges.map(layer => {
            // side effect!!!
            this.form.controls['attribute'].setValue(undefined);

            if (layer) {
                return layer.operator.attributes.filter((attribute: string) => {
                    return DataTypes.ALL_NUMERICS.indexOf(layer.operator.dataTypes.get(attribute)) >= 0;
                }).toArray();
            } else {
                return [];
            }
        });
    }

    ngAfterViewInit() {
        // initially get attributes
        setTimeout(() => this.form.controls['pointLayer'].enable({emitEvent: true}), 0);
    }

    ngOnDestroy() {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
    }

    add() {
        const vectorLayer: VectorLayer<AbstractVectorSymbology> = this.form.controls['pointLayer'].value;
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
                rangeMin: boundsMin,
                rangeMax: boundsMax,
            }),
            resultType: ResultTypes.POINTS,
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

        const clustered = vectorLayer.clustered;
        this.layerService.addLayer(new VectorLayer({
            name: name,
            operator: operator,
            symbology: clustered ?
                new ClusteredPointSymbology({
                    fillRGBA: this.randomColorService.getRandomColor(),
                }) :
                new SimplePointSymbology({
                    fillRGBA: this.randomColorService.getRandomColor(),
                }),
            data: this.mappingQueryService.getWFSDataStreamAsGeoJsonFeatureCollection({
                operator, clustered,
            }),
            provenance: this.mappingQueryService.getProvenanceStream(operator),
            clustered: clustered,
        }));

        this.dialogRef.close();
    }

}
