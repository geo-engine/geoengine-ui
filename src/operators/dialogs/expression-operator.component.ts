import {
    Component, OnInit, ChangeDetectionStrategy,
} from '@angular/core';
import {COMMON_DIRECTIVES, Validators, FormBuilder, ControlGroup, Control} from '@angular/common';

import {MATERIAL_DIRECTIVES} from 'ng2-material';
import {MD_INPUT_DIRECTIVES} from '@angular2-material/input';

import {
    LayerMultiSelectComponent, ReprojectionSelectionComponent, OperatorBaseComponent,
    LetterNumberConverter, OperatorOutputNameComponent,
} from './operator.component';

import {LayerService} from '../../layers/layer.service';
import {RandomColorService} from '../../services/random-color.service';
import {MappingQueryService} from '../../queries/mapping-query.service';
import {ProjectService} from '../../project/project.service';

import {RasterLayer} from '../../layers/layer.model';
import {RasterSymbology} from '../../symbology/symbology.model';

import {Operator} from '../operator.model';
import {ResultTypes} from '../result-type.model';

import {DataType, DataTypes} from '../datatype.model';
import {Unit} from '../unit.model';
import {ExpressionType} from '../types/expression-type.model';

/**
 * This component allows creating the expression operator.
 */
@Component({
    selector: 'wave-operator-expression',
    template: `
    <form [ngFormModel]="configForm">
        <wave-multi-layer-selection [layers]="layers" [min]="1" [max]="5"
                                    [types]="[ResultTypes.RASTER]"
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
                <md-input placeholder="Expression" ngControl="expression"></md-input>
                <table>
                    <tr>
                        <td>
                            <label>Output Data Type</label>
                            <select ngControl="dataType">
                                <option
                                    *ngFor="let dataType of outputDataTypes"
                                    [ngValue]="dataType[0]"
                                >{{dataType[0]}} {{dataType[1]}}</option>
                            </select>
                        </td>
                        <td>
                            <md-input type="number" placeholder="Minimum Value" ngControl="minValue"
                            ></md-input>
                        </td>
                        <td>
                            <md-input type="number" placeholder="Maximum Value" ngControl="maxValue"
                            ></md-input>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <label>Output Unit</label>
                            <select ngControl="unit">
                                <option
                                    *ngFor="let unit of outputUnits"
                                    [ngValue]="unit"
                                >{{unit}}</option>
                            </select>
                        </td>
                        <td>
                            <wave-reprojetion-selection
                                [layers]="layers"
                                ngControl="projection">
                            </wave-reprojetion-selection>
                        </td>
                    </tr>
                </table>
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
    table tr td:nth-child(2) {
        padding: 0 5px;
    }
    `],
    directives: [
        COMMON_DIRECTIVES, MATERIAL_DIRECTIVES, MD_INPUT_DIRECTIVES,
        LayerMultiSelectComponent, ReprojectionSelectionComponent, OperatorOutputNameComponent,
    ],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class ExpressionOperatorComponent extends OperatorBaseComponent
                                         implements OnInit {

    private configForm: ControlGroup;
    private selectedLayers: Array<RasterLayer<RasterSymbology>>;

    private outputDataTypes: Array<[DataType, string]> = DataTypes.ALL_NUMERICS.map(
            (datatype: DataType) => [datatype, '']
        ) as Array<[DataType, string]>;

    private outputUnits: Array<Unit>;

    constructor(
        layerService: LayerService,
        private randomColorService: RandomColorService,
        private mappingQueryService: MappingQueryService,
        private projectService: ProjectService,
        private formBuilder: FormBuilder
    ) {
        super(layerService);

        const firstRasterLayer = this.layerService.getLayers().filter(
            layer => layer.operator.resultType === ResultTypes.RASTER
        )[0];

        this.configForm = formBuilder.group({
            'expression': ['1 * A', Validators.compose([
                Validators.required,
                Validators.pattern('.*A.*'),
            ])],
            'dataType': [-1, Validators.required],
            'minValue': [0, Validators.compose([
                Validators.required,
            ])],
            'maxValue': [0, Validators.compose([
                Validators.required,
            ])],
            'unit': [-1, Validators.required],
            projection: [
                firstRasterLayer ? firstRasterLayer.operator.projection : undefined,
                Validators.required,
            ],
            'name': ['Expression', Validators.required],
        });

        this.configForm.controls['dataType'].valueChanges.subscribe(() => {
            const dataType: DataType = this.configForm.controls['dataType'].value;
            const minValueControl: Control = this.configForm.controls['minValue'] as Control;
            const maxValueControl: Control = this.configForm.controls['maxValue'] as Control;
            minValueControl.updateValue(dataType.getMin());
            maxValueControl.updateValue(dataType.getMax() - 1);
        });
    }

    ngOnInit() {
        super.ngOnInit();
        this.dialog.setTitle('Calculate Expression on Raster');
    }

    onSelectLayers(layers: Array<RasterLayer<RasterSymbology>>) {
        this.calculateDataTypeList(layers);
        this.calculateUnitList(layers);

        this.selectedLayers = layers;
    }

    add() {
        const name: string = this.configForm.controls['name'].value;
        const dataType: DataType = this.configForm.controls['dataType'].value;
        const expression: string = this.configForm.controls['expression'].value;
        const rasterLayers = this.selectedLayers;
        const projection = this.configForm.controls['projection'].value;
        const minValue = this.configForm.controls['minValue'].value;
        const maxValue = this.configForm.controls['maxValue'].value;

        const selectedUnit: Unit = this.configForm.controls['unit'].value;
        const unit = new Unit({
            measurement: selectedUnit.measurement,
            unit: selectedUnit.unit,
            interpolation: selectedUnit.interpolation,
            classes: selectedUnit.classes,
            min: minValue,
            max: maxValue,
        });

        const operator = new Operator({
            operatorType: new ExpressionType({
                expression: expression,
                datatype: dataType,
                unit: unit,
            }),
            resultType: ResultTypes.RASTER,
            projection: projection,
            attributes: ['value'],
            dataTypes: new Map<string, DataType>()
                        .set('value', dataType),
            units: new Map<string, Unit>()
                        .set('value', unit),
            rasterSources: rasterLayers.map(
                layer => layer.operator.getProjectedOperator(projection)
            ),
        });

        this.layerService.addLayer(new RasterLayer({
            name: name,
            operator: operator,
            symbology: new RasterSymbology({ unit: unit }),
            provenance: this.mappingQueryService.getProvenanceStream(operator),
        }));

        this.dialog.close();
    }

    private calculateUnitList(layers: Array<RasterLayer<RasterSymbology>>) {
        this.outputUnits = [];
        for (const layer of layers) {
            const unit = layer.operator.getUnit('value');
            if (this.outputUnits.indexOf(unit) === -1) {
                this.outputUnits.push(unit);
            }
        }

        if (this.outputUnits.indexOf(Unit.defaultUnit) === -1) {
            this.outputUnits.push(Unit.defaultUnit);
        }

        const dataTypeControl: Control = this.configForm.controls['unit'] as Control;
        if (dataTypeControl.value === -1) {
            const dataType = this.outputUnits[0];
            dataTypeControl.updateValue(dataType);
        }
    }

    private calculateDataTypeList(layers: Array<RasterLayer<RasterSymbology>>) {
        let firstItemWithRefs: DataType = undefined;
        for (let i = 0; i < this.outputDataTypes.length; i++) {
            const dataType = this.outputDataTypes[i][0];
            const refs: Array<string> = [];
            for (let l = 0; l < layers.length; l++) {
                if (dataType === layers[l].operator.getDataType('value')) {
                    refs.push(LetterNumberConverter.toLetters(l + 1));
                }
                if (refs.length > 0) {
                    this.outputDataTypes[i][1] =
                        `(like ${refs.length > 1 ? 'layers' : 'layer'} ${refs.join(',')})`;
                    if (firstItemWithRefs === undefined) {
                        firstItemWithRefs = dataType;
                    }
                } else {
                    this.outputDataTypes[i][1] = '';
                }
            }
        }

        const dataTypeControl: Control = this.configForm.controls['dataType'] as Control;
        if (dataTypeControl.value === -1) {
            dataTypeControl.updateValue(firstItemWithRefs);
            const minValueControl: Control = this.configForm.controls['minValue'] as Control;
            const maxValueControl: Control = this.configForm.controls['maxValue'] as Control;
            minValueControl.updateValue(firstItemWithRefs.getMin());
            maxValueControl.updateValue(firstItemWithRefs.getMax() - 1);
        }
    }

}
