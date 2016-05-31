import {
    Component, ChangeDetectionStrategy, OnInit,
} from '@angular/core';
import {HTTP_PROVIDERS} from '@angular/http';
import {
    COMMON_DIRECTIVES, Validators, FormBuilder, ControlGroup, Control,
} from '@angular/common';

import {MATERIAL_DIRECTIVES} from 'ng2-material';
import {MD_INPUT_DIRECTIVES} from '@angular2-material/input';

import {
    LayerMultiSelectComponent, OperatorBaseComponent, OperatorOutputNameComponent,
} from './operator.component';
import {HistogramComponent, HistogramData} from '../../plots/histogram.component';

import {LayerService} from '../../layers/layer.service';
import {RandomColorService} from '../../services/random-color.service';
import {MappingQueryService} from '../../services/mapping-query.service';
import {ProjectService} from '../../project/project.service';

import {VectorLayer, Layer} from '../../layers/layer.model';
import {Operator} from '../operator.model';
import {ResultTypes} from '../result-type.model';
import {NumericAttributeFilterType} from '../types/numeric-attribute-filter-type.model';
import {HistogramType} from '../types/histogram-type.model';
import {DataType, DataTypes} from '../datatype.model';
import {Unit} from '../unit.model';
import {SimplePointSymbology, Symbology} from '../../symbology/symbology.model';

/**
 * This component allows creating the numeric attribute filter operator.
 */
@Component({
    selector: 'wave-numeric-attribute-filter',
    template: `
    <form [ngFormModel]="configForm">
        <wave-multi-layer-selection
            [layers]="layers" [min]="1" [max]="1"
            [types]="ResultTypes.VECTOR_TYPES"
            (selectedLayers)="onSelectLayer($event[0])">
        </wave-multi-layer-selection>
        <md-card>
            <md-card-header>
                <md-card-header-text>
                    <span class="md-title">Configuration</span>
                    <span class="md-subheader">Specify the operator</span>
                </md-card-header-text>
            </md-card-header>
            <md-card-content>
                <div>
                    <label>Attribute</label>
                    <select ngControl="attributeName">
                        <option *ngFor="let attribute of attributes" [ngValue]="attribute">
                            {{attribute}}
                        </option>
                    </select>
                </div>
                <wave-histogram [height]="500" [width]="500" [selectable]="true"
                                *ngIf="data" [data]="data" interactable="true"
                                (minRange)="boundsMin = $event" (maxRange)="boundsMax = $event">
                </wave-histogram>
            </md-card-content>
        </md-card>
        <wave-operator-output-name ngControl="name"></wave-operator-output-name>
    </form>
    `,
    styles: [`
    label {
        display: block;
        font-size: 12px;
        color: rgba(0, 0, 0, 0.38);
    }
    `],
    directives: [
        COMMON_DIRECTIVES, MATERIAL_DIRECTIVES, MD_INPUT_DIRECTIVES,
        LayerMultiSelectComponent, HistogramComponent, OperatorOutputNameComponent,
    ],
    providers: [HTTP_PROVIDERS],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class NumericAttributeFilterOperatorComponent extends OperatorBaseComponent
                                                     implements OnInit {

    private configForm: ControlGroup;

    private attributes: Array<string> = [];

    private selectedLayer: Layer<Symbology>;
    private boundsMin: number;
    private boundsMax: number;

    private data: HistogramData;

    constructor(
        layerService: LayerService,
        private randomColorService: RandomColorService,
        private mappingQueryService: MappingQueryService,
        private projectService: ProjectService,
        private formBuilder: FormBuilder
    ) {
        super(layerService);

        const attributeNameControl = formBuilder.control('', Validators.required);

        this.configForm = formBuilder.group({
            attribute: [undefined, Validators.required],
            nodata: [false, Validators.required],
            attributeName: attributeNameControl,
            name: ['Filtered Values', Validators.required],
        });

        attributeNameControl.valueChanges.subscribe((attributeName: string) => {
            // console.log(attributeName, this.selectedLayer);

            const operator = new Operator({
                operatorType: new HistogramType({
                    attribute: attributeName,
                    range: 'data',
                }),
                resultType: ResultTypes.PLOT,
                projection: this.selectedLayer.operator.projection,
                attributes: [],
                dataTypes: new Map<string, DataType>(),
                units: new Map<string, Unit>(),
                pointSources: [this.selectedLayer.operator],
            });

            this.mappingQueryService.getPlotData(operator, this.projectService.getTime())
                                    .then(data => this.data = data as HistogramData);
        });
    }

    ngOnInit() {
        super.ngOnInit();
        this.dialog.setTitle('Numeric Attribute Filter');
    }

    onSelectLayer(layer: Layer<Symbology>) {
        this.selectedLayer = layer;

        this.attributes = layer.operator.attributes.filter((attribute: string) => {
            return DataTypes.ALL_NUMERICS.indexOf(layer.operator.dataTypes.get(attribute)) >= 0;
        }).toArray();

        if (this.attributes.length > 0) {
            (this.configForm.controls['attributeName'] as Control).updateValue(
                this.attributes[0],
                {
                    emitEvent: true,
                }
            );
        }
    }

    add() {
        const vectorOperator = this.selectedLayer.operator;

        const units = vectorOperator.units;
        const dataTypes = vectorOperator.dataTypes;
        const attributes = vectorOperator.attributes;

        const nodata = this.configForm.controls['nodata'].value;
        const attributeName = this.configForm.controls['attributeName'].value;
        const boundsMin = this.boundsMin;
        const boundsMax =  this.boundsMax;

        const name: string = this.configForm.controls['name'].value;

        const dict = {
            operatorType: new NumericAttributeFilterType({
                attributeName: attributeName,
                includeNoData: nodata,
                rangeMin: boundsMin,
                rangeMax: boundsMax,
            }),
            resultType: ResultTypes.POINTS,
            projection: vectorOperator.projection,
            attributes: attributes,
            dataTypes: dataTypes,
            units: units,
        };

        switch (vectorOperator.resultType) {
            case ResultTypes.POINTS:
                dict['pointSources'] = [vectorOperator];
                break;
            case ResultTypes.LINES:
                dict['lineSources'] = [vectorOperator];
                break;
            case ResultTypes.POLYGONS:
                dict['polygonSources'] = [vectorOperator];
                break;
            default:
                throw 'Incompatible Input Type';
        }

        const operator = new Operator(dict);

        this.layerService.addLayer(new VectorLayer({
            name: name,
            operator: operator,
            symbology: new SimplePointSymbology({
                fill_rgba: this.randomColorService.getRandomColor(),
            }),
            data$: this.mappingQueryService.getWFSDataStreamAsGeoJsonFeatureCollection(operator),
            prov$: this.mappingQueryService.getProvenanceStream(operator),
        }));

        this.dialog.close();
    }

}
