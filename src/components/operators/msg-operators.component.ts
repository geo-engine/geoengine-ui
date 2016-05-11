import {Component, Input, Output, EventEmitter,
        OnChanges, SimpleChange, OnInit, ChangeDetectionStrategy} from "angular2/core";

import {MdPatternValidator, MdMinValueValidator, MdNumberRequiredValidator, MdMaxValueValidator,
        MATERIAL_DIRECTIVES} from "ng2-material/all";
import {MdDialogRef, MdDialogConfig} from "ng2-material/components/dialog/dialog";

import {FORM_DIRECTIVES, Validators, FormBuilder, ControlGroup, Control} from "angular2/common";

import {LayerMultiSelectComponent, ReprojectionSelectionComponent,
        OperatorBaseComponent, toLetters, OperatorContainerComponent} from "./operator.component";

import {Layer} from "../../models/layer.model";
import {Plot} from "../../models/plot.model";
import {Operator} from "../../models/operator.model";
import {ResultTypes} from "../../models/result-type.model";
import {DataType, DataTypes} from "../../models/datatype.model";
import {Unit} from "../../models/unit.model";
import {Projection, Projections} from "../../models/projection.model";
import {MsgRadianceType, MsgReflectanceType, MeteosatSatelliteName} from "../../models/operator-type.model";
import {Symbology, MappingColorizerRasterSymbology, RasterSymbology} from "../../models/symbology.model";
import {MappingColorizerService} from "../../services/mapping-colorizer.service";

/**
 * This component allows creating the MSG radiance operator.
 */
@Component({
    selector: "wave-msg-radiance-operator",
    template: `
    <wave-operator-container title="Convert raw data to radiances"
                            (add)="addLayer()" (cancel)="dialog.close()">
        <form [ngFormModel]="configForm">
            <wave-multi-layer-selection [layers]="layers" [min]="1" [max]="1" initialAmount="1"
                                        [types]="[ResultTypes.RASTER]"
                                        (selectedLayers)="rasterSources = $event">
            </wave-multi-layer-selection>
            <md-card>
                <md-card-header>
                    <md-card-header-text>
                        <span class="md-title">Configuration</span>
                        <span class="md-subheader">Specify the operator</span>
                    </md-card-header-text>
                </md-card-header>
                <md-card-content>

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
    directives: [FORM_DIRECTIVES, MATERIAL_DIRECTIVES, OperatorContainerComponent, LayerMultiSelectComponent],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class MsgRadianceOperatorComponent extends OperatorBaseComponent {

    private configForm: ControlGroup;
    private rasterSources: Array<Layer>;


    constructor(private dialog: MdDialogRef, private formBuilder: FormBuilder) {
        super();

        this.configForm = formBuilder.group({
            // "resultType": [ResultTypes.RASTER, Validators.required],
            "name": ["Radiance (MSG)", Validators.required],
        });

    }

    private addLayer() {
        const outputName: string = this.configForm.controls["name"].value;
        const rasterSource: Operator = this.rasterSources[0].operator;

        const operator = new Operator({
            operatorType: new MsgRadianceType({}),
            resultType: ResultTypes.RASTER,
            projection: rasterSource.projection,
            attributes: [], // TODO: user input?
            dataTypes: new Map<string, DataType>(), // TODO: user input?
            units: new Map<string, Unit>(), // TODO: user input?
            rasterSources: [rasterSource],
        });

        this.mappingColorizerService.getColorizer(operator).then(x => { // TODO: move to layer?
            let layer = new Layer({
                name: outputName,
                operator: operator,
                symbology: new MappingColorizerRasterSymbology(x),
            });
            this.layerService.addLayer(layer);
        }).catch(ex => {
            console.log("_mappingColorizerService.getColorizer", ex);
            let layer = new Layer({
                name: outputName,
                operator: operator,
                symbology: new RasterSymbology({}),
            });
            this.layerService.addLayer(layer);
        });

        this.dialog.close();
    }

}


/**
 * This component allows creating the MSG reflectance operator.
 */
@Component({
    selector: "wave-msg-reflectance-operator",
    template: `
    <wave-operator-container title="Convert MSG radiance to reflectance"
                            (add)="addLayer()" (cancel)="dialog.close()">
        <form [ngFormModel]="configForm">
            <wave-multi-layer-selection [layers]="layers" [min]="1" [max]="1" initialAmount="1"
                                        [types]="[ResultTypes.RASTER]"
                                        (selectedLayers)="rasterSources = $event">
            </wave-multi-layer-selection>
            <md-card>
                <md-card-header>
                    <md-card-header-text>
                        <span class="md-title">Configuration</span>
                        <span class="md-subheader">Specify the operator</span>
                    </md-card-header-text>
                </md-card-header>
                <md-card-content>
                    <div flex-xs="100" flex="50">
                      <md-checkbox aria-label="isHrv checkbox" [(checked)]="isHrv">
                        channel is HRV
                      </md-checkbox>
                    </div>
                    <div flex-xs="100" flex="50">
                      <md-checkbox aria-label="solarCorrection checkbox" [(checked)]="solarCorrection">
                        apply solar correction
                      </md-checkbox>
                    </div>
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
    directives: [FORM_DIRECTIVES, MATERIAL_DIRECTIVES, OperatorContainerComponent, LayerMultiSelectComponent],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class MsgReflectanceOperatorComponent extends OperatorBaseComponent {

    private configForm: ControlGroup;
    private rasterSources: Array<Layer>;

    // private forceSatellite: boolean = false;
    // private forceSatellteName: MeteosatSatelliteName;
    private isHrv: boolean = false;
    private solarCorrection: boolean = true;

    constructor(private dialog: MdDialogRef, private formBuilder: FormBuilder) {
        super();

        this.configForm = formBuilder.group({
            // "resultType": [ResultTypes.RASTER, Validators.required],
            "name": ["Reflectance (MSG)", Validators.required],
        });

    }

    private addLayer() {
        const outputName: string = this.configForm.controls["name"].value;
        const rasterSource: Operator = this.rasterSources[0].operator;

        const operator = new Operator({
            operatorType: new MsgReflectanceType({
                isHrv: this.isHrv,
                solarCorrection: this.solarCorrection,
                // forceSatelliteName: this.forceSatellteName,
            }),
            resultType: ResultTypes.RASTER,
            projection: rasterSource.projection,
            attributes: [], // TODO: user input?
            dataTypes: new Map<string, DataType>(), // TODO: user input?
            units: new Map<string, Unit>(), // TODO: user input?
            rasterSources: [rasterSource],
        });

        this.mappingColorizerService.getColorizer(operator).then(x => { // TODO: move to layer?
            let layer = new Layer({
                name: outputName,
                operator: operator,
                symbology: new MappingColorizerRasterSymbology(x),
            });
            this.layerService.addLayer(layer);
        }).catch(ex => {
            console.log("_mappingColorizerService.getColorizer", ex);
            let layer = new Layer({
                name: outputName,
                operator: operator,
                symbology: new RasterSymbology({}),
            });
            this.layerService.addLayer(layer);
        });

        this.dialog.close();
    }

}
