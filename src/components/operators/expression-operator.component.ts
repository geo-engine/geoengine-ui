import {Component, Input, Output, EventEmitter,
        OnChanges, SimpleChange, OnInit, ChangeDetectionStrategy} from "angular2/core";

import {MdPatternValidator, MdMinValueValidator, MdNumberRequiredValidator, MdMaxValueValidator,
        MATERIAL_DIRECTIVES} from "ng2-material/all";
import {MdDialogRef, MdDialogConfig} from "ng2-material/components/dialog/dialog";

import {FORM_DIRECTIVES, Validators, FormBuilder, ControlGroup, Control} from "angular2/common";

import {DialogHeaderComponent} from "../dialogs/header.component";

import {LayerMultiSelectComponent, ReprojectionSelectionComponent,
        OperatorBaseComponent, toLetters, OperatorContentComponent} from "./operator.component";

import {LayerService} from "../../services/layer.service";

import {Layer} from "../../models/layer.model";
import {Operator, ResultType, ComplexOperatorParam} from "../../models/operator.model";
import {DataType, DataTypes} from "../../models/datatype.model";
import {Unit} from "../../models/unit.model";
import {Projection} from "../../models/projection.model";

/**
 * This component allows creating the expression operator.
 */
@Component({
    selector: "wave-operator-expression",
    template: `
    <wave-operator-content title="Calculate Expression on Raster"
                            (add)="addLayer()" (cancel)="dialog.close()">
        <form [ngFormModel]="configForm">
            <wave-multi-layer-selection [layers]="layers" [min]="1" [max]="5"
                                        [type]="LAYER_IS_RASTER"
                                        (selectedLayers)="onSelectLayers($event)">
            </wave-multi-layer-selection>
            <md-card>
                <md-card-header>
                    <md-card-header-text>
                        <span class="md-title">Configuration</span>
                        <span class="md-subheader">Specify the operator</span>
                    </md-card-header-text>
                </md-card-header>
                <md-card-content>
                    <p>Use A to reference the existing pixel of the first raster,
                    B for the second one, etc.</p>
                    <md-input-container class="md-block">
                        <label for="expression">
                            Expression
                        </label>
                        <input md-input ngControl="expression" [(value)]="expression">
                        <div md-messages="expression">
                            <div md-message="required">This is required.</div>
                            <div md-message="pattern">
                                You need to specify at least Raster A here.
                            </div>
                        </div>
                    </md-input-container>
                    <div layout="row">
                        <md-input-container class="md-block md-input-has-value">
                            <label for="dataType">Output Data Type</label>
                            <select ngControl="dataType">
                                <option *ngFor="#dataType of outputDataTypes"
                                        [ngValue]="dataType[0]">
                                    {{dataType[0]}} {{dataType[1]}}
                                </option>
                            </select>
                            <input md-input type="hidden" value="0"><!-- HACK -->
                        </md-input-container>
                        <md-input-container class="md-block">
                            <label for="minValue">
                                Minimum Value
                            </label>
                            <input md-input type="number" ngControl="minValue" [(value)]="minValue">
                            <div md-messages="expression">
                                <div md-message="required">There must be a minimum value.</div>
                            </div>
                        </md-input-container>
                        <md-input-container class="md-block">
                            <label for="maxValue">
                                Maximum Value
                            </label>
                            <input md-input type="number" ngControl="maxValue" [(value)]="maxValue">
                            <div md-messages="expression">
                                <div md-message="required">There must be a maximum value.</div>
                            </div>
                        </md-input-container>
                    </div>
                    <div layout="row">
                        <md-input-container class="md-block md-input-has-value">
                            <label for="unit">Output Unit</label>
                            <select ngControl="unit">
                                <option *ngFor="#unit of outputUnits" [ngValue]="unit">
                                    {{unit}}
                                </option>
                            </select>
                            <input md-input type="hidden" value="0"><!-- HACK -->
                        </md-input-container>
                        <wave-reprojetion-selection [layers]="layers"
                                                    (valueChange)="onSelectProjection($event)">
                        </wave-reprojetion-selection>
                    </div>
                    <md-input-container class="md-block">
                        <label for="name">
                            Output Layer Name
                        </label>
                        <input md-input ngControl="name" [(value)]="name">
                        <div md-messages="name">
                            <div md-message="required">You must specify a layer name.</div>
                        </div>
                    </md-input-container>
                </md-card-content>
            </md-card>
        </form>
    </wave-operator-content>
    `,
    directives: [MATERIAL_DIRECTIVES, LayerMultiSelectComponent, ReprojectionSelectionComponent,
                 OperatorContentComponent],
    changeDetection: ChangeDetectionStrategy.Default
})
export class ExpressionOperatorComponent extends OperatorBaseComponent
                                         implements OnInit, OnChanges {

    private configForm: ControlGroup;
    private selectedLayers: Array<Layer>;
    private projection: Projection;

    private outputDataTypes: Array<[DataType, string]> =
        <Array<[DataType, string]>> DataTypes.ALL_NUMERICS.map(datatype => [datatype, ""]);

    private outputUnits: Array<Unit>;

    constructor(private dialog: MdDialogRef, private formBuilder: FormBuilder) {
        super();
        console.log("ExpressionOperatorComponent", "constructor", this.layerService);

        this.configForm = formBuilder.group({
            "expression": ["1 * A", Validators.compose([
                Validators.required,
                Validators.pattern(".*A.*")
            ])],
            "dataType": [-1, Validators.required],
            "minValue": [0, Validators.compose([
                Validators.required
            ])],
            "maxValue": [0, Validators.compose([
                Validators.required
            ])],
            "unit": [-1, Validators.required],
            "name": ["Expression", Validators.required],
        });

        this.configForm.controls["dataType"].valueChanges.subscribe(() => {
            let dataType: DataType = this.configForm.controls["dataType"].value;
            let minValueControl: Control = <Control> this.configForm.controls["minValue"];
            let maxValueControl: Control = <Control> this.configForm.controls["maxValue"];
            minValueControl.updateValue(dataType.getMin());
            maxValueControl.updateValue(dataType.getMax() - 1);
        });
    }

    ngOnInit() {
        super.ngOnInit();
    }

    ngOnChanges(changes: {[propertyName: string]: SimpleChange}) {
        super.ngOnChanges(changes);
    }

    private onSelectProjection(projection: Projection) {
        this.projection = projection;
    }

    private onSelectLayers(layers: Array<Layer>) {
        this.calculateDataTypeList(layers);
        this.calculateUnitList(layers);

        this.selectedLayers = layers;
    }

    private calculateUnitList(layers: Array<Layer>) {
        this.outputUnits = [];
        for (let layer of layers) {
            let unit = layer.operator.getUnit("value");
            if (this.outputUnits.indexOf(unit) === -1) {
                this.outputUnits.push(unit);
            }
        }

        if (this.outputUnits.indexOf(Unit.defaultUnit) === -1) {
            this.outputUnits.push(Unit.defaultUnit);
        }

        let dataTypeControl: Control = <Control> this.configForm.controls["unit"];
        if (dataTypeControl.value === -1) {
            let dataType = this.outputUnits[0];
            dataTypeControl.updateValue(dataType);
        }
    }

    private calculateDataTypeList(layers: Array<Layer>) {
        let firstItemWithRefs: DataType = undefined;
        for (let i = 0; i < this.outputDataTypes.length; i++) {
            let dataType = this.outputDataTypes[i][0];
            let refs: Array<string> = [];
            for (let l = 0; l < layers.length; l++) {
                if (dataType === layers[l].operator.getDataType("value")) {
                    refs.push(toLetters(l + 1));
                }
                if (refs.length > 0) {
                    this.outputDataTypes[i][1] = `(like ${refs.length > 1 ? "layers" : "layer"} ${refs.join(",")})`;
                    if (firstItemWithRefs === undefined) {
                        firstItemWithRefs = dataType;
                    }
                } else {
                    this.outputDataTypes[i][1] = "";
                }
            }
        }

        let dataTypeControl: Control = <Control> this.configForm.controls["dataType"];
        if (dataTypeControl.value === -1) {
            dataTypeControl.updateValue(firstItemWithRefs);
            let minValueControl: Control = <Control> this.configForm.controls["minValue"];
            let maxValueControl: Control = <Control> this.configForm.controls["maxValue"];
            minValueControl.updateValue(firstItemWithRefs.getMin());
            maxValueControl.updateValue(firstItemWithRefs.getMax() - 1);
        }
    }

    private addLayer() {
        let name: string = this.configForm.controls["name"].value;
        let dataType: DataType = this.configForm.controls["dataType"].value;
        let expression: string = this.configForm.controls["expression"].value;
        let rasterLayers = this.selectedLayers;
        let projection = this.projection;
        let minValue = this.configForm.controls["minValue"].value;
        let maxValue = this.configForm.controls["maxValue"].value;

        let selectedUnit: Unit = this.configForm.controls["unit"].value;
        let unit = new Unit({
            measurement: selectedUnit.measurement,
            unit: selectedUnit.unit,
            interpolation: selectedUnit.interpolation,
            classes: selectedUnit.classes,
            min: minValue,
            max: maxValue,
        });

        let operator = new Operator({
            operatorType: "expression",
            resultType: ResultType.RASTER,
            parameters: new Map<string, string | number | ComplexOperatorParam>()
                        .set("expression", expression)
                        .set("datatype", dataType.getCode())
                        .set("unit", unit.toMappingDict()),
            projection: projection,
            attributes: ["value"],
            dataTypes: new Map<string, DataType>()
                        .set("value", dataType),
            units: new Map<string, Unit>()
                        .set("value", unit),
            rasterSources: rasterLayers.map(layer => layer.operator),
        });

        this.layerService.addLayer(new Layer({
            name: name,
            operator: operator,
        }));

        this.dialog.close();
    }

}
