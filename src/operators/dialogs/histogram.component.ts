import {Component, ChangeDetectionStrategy, OnInit} from '@angular/core';

import {
    OperatorBaseComponent,
} from './operator.component';

import {LayerService} from '../../layers/layer.service';
import {RandomColorService} from '../../services/random-color.service';
import {MappingQueryService} from '../../queries/mapping-query.service';
import {ProjectService} from '../../project/project.service';
import {PlotService} from '../../plots/plot.service';
import {LayoutService, Browser} from '../../app/layout.service';

import {Layer} from '../../layers/layer.model';
import {Symbology} from '../../symbology/symbology.model';
import {Plot} from '../../plots/plot.model';
import {Operator} from '../operator.model';
import {ResultTypes} from '../result-type.model';
import {DataType, DataTypes} from '../datatype.model';
import {Unit} from '../unit.model';
import {HistogramType} from '../types/histogram-type.model';
import {FormGroup, FormBuilder, Validators, FormControl} from "@angular/forms";

/**
 * This component allows creating the histogram operator.
 */
@Component({
    selector: 'wave-operator-histogram',
    template: `
    <form [ngFormModel]="configForm">
        <wave-multi-layer-selection [layers]="layers" [min]="1" [max]="1"
                                    [types]="ResultTypes.INPUT_TYPES"
                                    (selectedLayers)="onSelectLayer($event[0])">
        </wave-multi-layer-selection>
        <md-card>
            <md-card-header>
                    <md-card-title>Configuration</md-card-title>
                    <md-card-subtitle>Specify the operator</md-card-subtitle>
            </md-card-header>
            <md-card-content layout="column">
                <div *ngIf="selectedLayer?.operator?.resultType !== ResultTypes.RASTER">
                    <label>Attribute</label>
                    <select
                        ngControl="attributeName"
                        [size]="layoutService.getBrowser() === Browser.FIREFOX ? 2 : 1"
                    >
                        <option *ngFor="let attribute of attributes" [ngValue]="attribute">
                            {{attribute}}
                        </option>
                    </select>
                </div>
                <div>
                    <label>Range Type</label>
                    <select
                        ngControl="rangeType"
                        [size]="layoutService.getBrowser() === Browser.FIREFOX ? 2 : 1"
                    >
                        <option *ngFor="let rangeType of rangeTypes" [ngValue]="rangeType">
                            {{rangeType}}
                        </option>
                    </select>
                </div>
                <div *ngIf="customRange" layout="row" class="custom-range">
                    <md-input type="number" placeholder="Min" ngControl="rangeMin"></md-input>
                    <md-input type="number" placeholder="Max" ngControl="rangeMax"></md-input>
                </div>
                <md-checkbox type="checkbox" ngControl="autoBuckets" #autoB>
                    Choose number of buckets automatically
                </md-checkbox>
                <md-input
                    *ngIf="!autoB.checked"
                    type="number"
                    class="choose-buckets"
                    placeholder="Number of Buckets"
                    ngControl="buckets"
                ></md-input>
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
    .custom-range md-input {
        width: 40%;
        margin-right: 10%;
    }
    md-input.choose-buckets {
        width: 50%;
    }
    md-card-content > div, md-card-content > md-checkbox, md-card-content > md-input {
        margin: 8px 0;
    }
    `],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class HistogramOperatorComponent extends OperatorBaseComponent implements OnInit {
    Browser = Browser; // tslint:disable-line:variable-name

    private selectedLayer: Layer<Symbology>;

    private customRange = false;

    private configForm: FormGroup;

    private rangeTypes = ['Custom', 'Unit', 'Data'];
    private attributes: Array<string>;

    constructor(
        layerService: LayerService,
        private randomColorService: RandomColorService,
        private mappingQueryService: MappingQueryService,
        private projectService: ProjectService,
        private plotService: PlotService,
        private layoutService: LayoutService,
        private formBuilder: FormBuilder
    ) {
        super(layerService);

        this.configForm = formBuilder.group({
            'attributeName': [undefined, Validators.required],
            'rangeType': [this.rangeTypes[2], Validators.required],
            'rangeMin': [0, Validators.required],
            'rangeMax': [0, Validators.required],
            'autoBuckets': [true, Validators.required],
            'buckets': [20, Validators.required],
            'name': ['Histogram', Validators.required],
        });

        this.configForm.controls['rangeType'].valueChanges.subscribe((rangeType: string) => {
            this.customRange = rangeType === this.rangeTypes[0];
        });
    }

    ngOnInit() {
        super.ngOnInit();
        this.dialog.setTitle('Histogram Plot');
    }

    onSelectLayer(layer: Layer<Symbology>) {
        this.selectedLayer = layer;

        this.attributes = layer.operator.dataTypes
                                        .filter((datatype: DataType, name: string) => {
                                            return DataTypes.ALL_NUMERICS.indexOf(datatype) >= 0;
                                        })
                                        .map((datatype: DataType, name: string) => name)
                                        .toArray();

        if (this.attributes.length > 0) {
            (this.configForm.controls['attributeName'] as FormControl).setValue(this.attributes[0]);
        }
    }

    add() {
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

        // TODO: fix forms...
        let a = (!!this.configForm.controls['autoBuckets'].value && this.configForm.controls['autoBuckets'].value.checked === undefined);
        let b = (!!this.configForm.controls['autoBuckets'].value && this.configForm.controls['autoBuckets'].value.checked !== undefined && this.configForm.controls['autoBuckets'].value.checked);
        if (!(a || b)) {
            //console.log(this.form);
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
            data: this.mappingQueryService.getPlotDataStream(operator),
        }));

        this.dialog.close();
    }
}
