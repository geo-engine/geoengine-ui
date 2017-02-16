import {
    Component, ChangeDetectionStrategy, OnDestroy, AfterViewInit,
} from '@angular/core';

import {HistogramData} from '../../../plots/histogram.component';

import {LayerService} from '../../../layers/layer.service';
import {RandomColorService} from '../../../services/random-color.service';
import {MappingQueryService} from '../../../queries/mapping-query.service';

import {VectorLayer} from '../../../layers/layer.model';
import {ResultTypes} from '../../result-type.model';
import {DataTypes, DataType} from '../../datatype.model';
import {
    AbstractVectorSymbology, ClusteredPointSymbology, SimplePointSymbology
} from '../../../symbology/symbology.model';
import {FormGroup, FormBuilder, Validators, AbstractControl} from '@angular/forms';
import {Subscription, BehaviorSubject} from 'rxjs';
import {Operator} from '../../operator.model';
import {NumericAttributeFilterType} from '../../types/numeric-attribute-filter-type.model';
import {MdDialogRef} from '@angular/material';
import {HistogramType} from '../../types/histogram-type.model';
import {Unit} from '../../unit.model';
import {ProjectService} from '../../../project/project.service';

function minOverMax(control: AbstractControl): {[key: string]: boolean} {
    const min = control.get('min').value;
    const max = control.get('max').value;

    if (min && max && max < min) {
        return {minOverMax: true};
    }

    return null;
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

    data$: BehaviorSubject<HistogramData> = new BehaviorSubject(undefined);
    dataLoading$ = new BehaviorSubject(false);

    constructor(
        private layerService: LayerService,
        private randomColorService: RandomColorService,
        private mappingQueryService: MappingQueryService,
        private projectService: ProjectService,
        private formBuilder: FormBuilder,
        private dialogRef: MdDialogRef<NumericAttributeFilterOperatorComponent>
    ) {
        this.form = formBuilder.group({
            name: ['Filtered Values', Validators.required],
            pointLayers: [undefined, Validators.compose([
                Validators.required,
                Validators.minLength(1),
                Validators.maxLength(1)
            ])],
            attribute: [undefined, Validators.required],
            bounds: formBuilder.group({
                min: [undefined],
                max: [undefined]
            }, {
                validator: minOverMax
            }),
            noData: [false, Validators.required]
        });

        this.form.controls['attribute'].valueChanges.subscribe((attribute: string) => {
            const vectorLayer: VectorLayer<AbstractVectorSymbology> = this.form.controls['pointLayers'].value[0];

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
            }).then(
                data => this.data$.next(data as HistogramData)
            ).then(
                _ => this.dataLoading$.next(false)
            );
        });
    }

    ngAfterViewInit() {
        this.form.controls['pointLayers'].enable({emitEvent: true});
    }

    ngOnDestroy() {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
    }

    computeAttributes(layers: Array<VectorLayer<AbstractVectorSymbology>>): Array<string> {
        if (layers && layers.length > 0) {
            const layer = layers[0];
            return layer.operator.attributes.filter((attribute: string) => {
                return DataTypes.ALL_NUMERICS.indexOf(layer.operator.dataTypes.get(attribute)) >= 0;
            }).toArray();
        } else {
            return [];
        }
    }

    add() {
        const vectorLayer: VectorLayer<AbstractVectorSymbology> = this.form.controls['pointLayers'].value[0];
        const vectorOperator: Operator = vectorLayer.operator;

        const units = vectorOperator.units;
        const dataTypes = vectorOperator.dataTypes;
        const attributes = vectorOperator.attributes;

        const noData: boolean = this.form.controls['noData'].value;
        const attributeName: string = this.form.controls['attribute'].value;
        const boundsMin: number = this.form.controls['bounds'].value.min;
        const boundsMax: number =  this.form.controls['bounds'].value.max;

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
                throw 'Incompatible Input Type';
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
