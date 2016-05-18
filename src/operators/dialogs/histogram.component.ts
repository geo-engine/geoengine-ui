import {Component, ChangeDetectionStrategy} from 'angular2/core';

import {MATERIAL_DIRECTIVES} from 'ng2-material/all';
import {MdDialogRef} from 'ng2-material/components/dialog/dialog';

import {FORM_DIRECTIVES, Validators, FormBuilder, ControlGroup, Control} from 'angular2/common';

import {OperatorBaseComponent, LayerMultiSelectComponent, OperatorContainerComponent}
    from './operator.component';

import {Layer} from '../../models/layer.model';
import {Plot} from '../../plots/plot.model';
import {Operator} from '../operator.model';
import {ResultTypes} from '../result-type.model';
import {DataType, DataTypes} from '../datatype.model';
import {Unit} from '../unit.model';
import {HistogramType} from '../types/histogram-type.model';

/**
 * This component allows creating the histogram operator.
 */
@Component({
    selector: 'wave-operator-histogram',
    template: `
    <wave-operator-container title="Histogram Plot" (add)="addPlot()" (cancel)="dialog.close()">
        <form [ngFormModel]="configForm">
            <wave-multi-layer-selection [layers]="layers" [min]="1" [max]="1"
                                        [types]="ResultTypes.INPUT_TYPES"
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
                    <md-input-container class="md-block md-input-has-value"
                        *ngIf="selectedLayer?.operator?.resultType !== ResultTypes.RASTER">
                        <label>Attribute</label>
                        <select ngControl="attributeName">
                            <option *ngFor="#attribute of attributes" [ngValue]="attribute">
                                {{attribute}}
                            </option>
                        </select>
                        <input md-input type="hidden" value="0"><!-- HACK -->
                    </md-input-container>
                    <md-input-container class="md-block md-input-has-value">
                        <label>Range Type</label>
                        <select ngControl="rangeType">
                            <option *ngFor="#rangeType of rangeTypes" [ngValue]="rangeType">
                                {{rangeType}}
                            </option>
                        </select>
                        <input md-input type="hidden" value="0"><!-- HACK -->
                    </md-input-container>
                    <div *ngIf="customRange" layout="row">
                        <md-input-container class="md-block">
                            <label for="rangeMin">Min</label>
                            <input md-input type="number" ngControl="rangeMin">
                            <div md-messages="rangeMin">
                                <div md-message="required">You must specify a number.</div>
                            </div>
                        </md-input-container>
                        <md-input-container class="md-block">
                            <label for="rangeMax">Max</label>
                            <input md-input type="number" ngControl="rangeMax">
                            <div md-messages="rangeMax">
                                <div md-message="required">You must specify a number.</div>
                            </div>
                        </md-input-container>
                    </div>
                    <md-checkbox [(checked)]="autoBuckets">
                        Choose number of buckets automatically
                    </md-checkbox>
                    <md-input-container class="md-block" *ngIf="!autoBuckets">
                        <label for="buckets">Number of Buckets</label>
                        <input md-input type="number" ngControl="buckets">
                        <div md-messages="buckets">
                            <div md-message="required">You must specify a number.</div>
                        </div>
                    </md-input-container>
                    <md-input-container class="md-block">
                        <label for="name">Output Plot Name</label>
                        <input md-input ngControl="name" [(value)]="name">
                        <div md-messages="name">
                            <div md-message="required">You must specify a plot name.</div>
                        </div>
                    </md-input-container>
                </md-card-content>
            </md-card>
        </form>
    </wave-operator-container>
    `,
    directives: [
        FORM_DIRECTIVES, MATERIAL_DIRECTIVES,
        OperatorContainerComponent, LayerMultiSelectComponent,
    ],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class HistogramOperatorComponent extends OperatorBaseComponent {
    private selectedLayer: Layer;

    private autoBuckets = true;
    private customRange = false;

    private configForm: ControlGroup;

    private rangeTypes = ['Custom', 'Unit', 'Data'];
    private attributes: Array<string>;

    constructor(private dialog: MdDialogRef, private formBuilder: FormBuilder) {
        super();

        this.configForm = formBuilder.group({
            'attributeName': [undefined, Validators.required],
            'rangeType': [this.rangeTypes[2], Validators.required],
            'rangeMin': [0, Validators.required],
            'rangeMax': [0, Validators.required],
            'buckets': [20, Validators.required],
            'name': ['Histogram', Validators.required],
        });

        this.configForm.controls['rangeType'].valueChanges.subscribe((rangeType: string) => {
            this.customRange = rangeType === this.rangeTypes[0];
        });
    }

    onSelectLayer(layer: Layer) {
        this.selectedLayer = layer;

        this.attributes = layer.operator.dataTypes
                                        .filter((datatype: DataType, name: string) => {
                                            return DataTypes.ALL_NUMERICS.indexOf(datatype) >= 0;
                                        })
                                        .map((datatype: DataType, name: string) => name)
                                        .toArray();

        if (this.attributes.length > 0) {
            (this.configForm.controls['attributeName'] as Control).updateValue(this.attributes[0]);
        }
    }

    addPlot() {
        const inputOperator = this.selectedLayer.operator;

        const attributeName = this.configForm.controls['attributeName'].value;
        let range: { min: number, max: number } | string;
        if (this.configForm.controls['rangeType'].value === this.rangeTypes[0]) {
            range = {
                min: parseFloat(this.configForm.controls['rangeMin'].value),
                max: parseFloat(this.configForm.controls['rangeMax'].value),
            };
        } else {
            range = this.configForm.controls['rangeType'].value.toLowerCase();
        }
        let buckets: number = undefined;
        if (!this.autoBuckets) {
            buckets = parseInt(this.configForm.controls['buckets'].value, 10);
        }

        const outputName: string = this.configForm.controls['name'].value;

        const operator = new Operator({
            operatorType: new HistogramType({
                attribute: attributeName,
                range: range,
                buckets: buckets,
            }),
            resultType: ResultTypes.PLOT,
            projection: inputOperator.projection,
            attributes: [],
            dataTypes: new Map<string, DataType>(),
            units: new Map<string, Unit>(),
            rasterSources:
                inputOperator.resultType === ResultTypes.RASTER ? [inputOperator] : [],
            pointSources:
                inputOperator.resultType === ResultTypes.POINTS ? [inputOperator] : [],
            lineSources:
                inputOperator.resultType === ResultTypes.LINES ? [inputOperator] : [],
            polygonSources:
                inputOperator.resultType === ResultTypes.POLYGONS ? [inputOperator] : [],
        });

        this.plotService.addPlot(new Plot({
            name: outputName,
            operator: operator,
            data$: this.mappingQueryService.getPlotDataStream(
                operator, this.projectService.getTimeStream()
            ),
        }));

        this.dialog.close();
    }
}
