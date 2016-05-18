import {Component, ChangeDetectionStrategy} from 'angular2/core';

import {MATERIAL_DIRECTIVES} from 'ng2-material/all';
import {MdDialogRef} from 'ng2-material/components/dialog/dialog';

import {FORM_DIRECTIVES, Validators, FormBuilder, ControlGroup} from 'angular2/common';

import {
    LayerMultiSelectComponent, OperatorBaseComponent, OperatorContainerComponent,
} from './operator.component';
import {CodeEditorComponent} from '../../components/code-editor.component';

import {Layer} from '../../models/layer.model';
import {Plot} from '../../plots/plot.model';
import {Symbology, SimplePointSymbology, RasterSymbology} from '../../models/symbology.model';
import {Operator} from '../operator.model';
import {ResultTypes} from '../result-type.model';
import {DataType} from '../datatype.model';
import {Unit} from '../unit.model';
import {Projections} from '../projection.model';
import {RScriptType} from '../types/r-script-type.model';

/**
 * This component allows creating the R operator.
 */
@Component({
    selector: 'wave-r-operator',
    template: `
    <wave-operator-container title="Execute R Script (experimental)"
                            (add)="addLayer()" (cancel)="dialog.close()">
        <form [ngFormModel]="configForm">
            <wave-multi-layer-selection [layers]="layers" [min]="0" [max]="5" initialAmount="0"
                                        [types]="[ResultTypes.RASTER]"
                                        (selectedLayers)="rasterSources = $event">
            </wave-multi-layer-selection>
            <wave-multi-layer-selection [layers]="layers" [min]="0" [max]="5" initialAmount="0"
                                        [types]="[ResultTypes.POINTS]"
                                        (selectedLayers)="pointSources = $event">
            </wave-multi-layer-selection>
            <md-card>
                <md-card-header>
                    <md-card-header-text>
                        <span class="md-title">Configuration</span>
                        <span class="md-subheader">Specify the operator</span>
                    </md-card-header-text>
                </md-card-header>
                <md-card-content>
                    <p>Help?</p>
                    <wave-code-editor language="r" [(code)]="code"></wave-code-editor>
                    <md-input-container class="md-block md-input-has-value">
                        <label for="dataType">Result Type</label>
                        <select ngControl="resultType">
                            <option *ngFor="#resultType of [ResultTypes.RASTER, ResultTypes.POINTS,
                                                            ResultTypes.PLOT, ResultTypes.TEXT]"
                                    [ngValue]="resultType">
                                {{resultType}}
                            </option>
                        </select>
                        <input md-input type="hidden" value="0"><!-- HACK -->
                    </md-input-container>
                    <md-input-container class="md-block">
                        <label for="name">
                            Output Name
                        </label>
                        <input md-input ngControl="name" [(value)]="name">
                        <div md-messages="name">
                            <div md-message="required">You must specify an output name.</div>
                        </div>
                    </md-input-container>
                </md-card-content>
            </md-card>
        </form>
    </wave-operator-container>
    `,
    styles: [`
    wave-code-editor {
        min-width: 400px;
    }
    `],
    directives: [FORM_DIRECTIVES, MATERIAL_DIRECTIVES,
                 OperatorContainerComponent, LayerMultiSelectComponent, CodeEditorComponent],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class ROperatorComponent extends OperatorBaseComponent {

    private configForm: ControlGroup;
    private code: string;
    private rasterSources: Array<Layer> = [];
    private pointSources: Array<Layer> = [];

    constructor(private dialog: MdDialogRef, private formBuilder: FormBuilder) {
        super();

        this.configForm = formBuilder.group({
            'resultType': [ResultTypes.TEXT, Validators.required],
            'name': ['R Output', Validators.required],
        });

        this.code = `print("Hello world");\na <- 1:5;\nprint(a);`;
    }

    addLayer() {
        const getAnySource = (index: number) => {
            const allSources = [...this.rasterSources, ...this.pointSources];
            return allSources[index];
        };

        const outputName: string = this.configForm.controls['name'].value;
        const resultType: DataType = this.configForm.controls['resultType'].value;
        const code = this.code;

        const rasterSources: Array<Operator> = this.rasterSources.map(layer => layer.operator);
        const pointSources: Array<Operator> = this.pointSources.map(layer => layer.operator);

        // TODO: user input?
        const projection = getAnySource(0) === undefined ?
            Projections.WGS_84 : getAnySource(0).operator.projection;

        const operator = new Operator({
            operatorType: new RScriptType({
                code: code,
                resultType: resultType,
            }),
            resultType: resultType,
            projection: projection,
            attributes: [], // TODO: user input?
            dataTypes: new Map<string, DataType>(), // TODO: user input?
            units: new Map<string, Unit>(), // TODO: user input?
            rasterSources: rasterSources,
            pointSources: pointSources,
        });

        if (ResultTypes.LAYER_TYPES.indexOf(resultType) >= 0) {
            // LAYER

            let symbology: Symbology;
            switch (resultType) {
                case ResultTypes.POINTS:
                    symbology = new SimplePointSymbology({
                        fill_rgba: this.randomColorService.getRandomColor(),
                    });
                    break;
                case ResultTypes.POINTS:
                    symbology = new RasterSymbology({});
                    break;
                default:
                    throw 'Unknown Symbology Error';
            }

            this.layerService.addLayer(new Layer({
                name: outputName,
                operator: operator,
                symbology: symbology,
            }));
        } else {
            // PLOT
            const plot = new Plot({
                name: outputName,
                operator: operator,
                data$: this.mappingQueryService.getPlotDataStream(
                    operator, this.projectService.getTimeStream()
                ),
            });
            this.plotService.addPlot(plot);
        }

        this.dialog.close();
    }

}
