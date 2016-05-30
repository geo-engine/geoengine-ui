import {Component, ChangeDetectionStrategy, OnInit} from '@angular/core';
import {
    COMMON_DIRECTIVES, Validators, FormBuilder, ControlGroup, ControlArray,
} from '@angular/common';

import {MATERIAL_DIRECTIVES} from 'ng2-material';
import {MD_INPUT_DIRECTIVES} from '@angular2-material/input';

import {
    LayerMultiSelectComponent, ReprojectionSelectionComponent, OperatorBaseComponent,
    LetterNumberConverter, OperatorOutputNameComponent,
} from './operator.component';

import {LayerService} from '../../services/layer.service';
import {RandomColorService} from '../../services/random-color.service';
import {MappingQueryService} from '../../services/mapping-query.service';
import {ProjectService} from '../../services/project.service';

import {VectorLayer, Layer} from '../../models/layer.model';
import {Symbology, SimplePointSymbology} from '../../symbology/symbology.model';

import {Operator} from '../operator.model';
import {ResultTypes} from '../result-type.model';
import {RasterValueExtractionType} from '../types/raster-value-extraction-type.model';

/**
 * This component allows creating the expression operator.
 */
@Component({
    selector: 'wave-raster-value-extraction',
    template: `
    <form [ngFormModel]="configForm">
        <wave-multi-layer-selection
            [layers]="layers" [min]="1" [max]="1"
            [types]="[ResultTypes.POINTS, ResultTypes.LINES, ResultTypes.POLYGONS]"
            (selectedLayers)="onSelectVectorLayer($event[0])"
        ></wave-multi-layer-selection>
        <wave-multi-layer-selection
            [layers]="layers" [min]="1" [max]="9"
            [types]="[ResultTypes.RASTER]"
            (selectedLayers)="onSelectRasterLayers($event)"
        ></wave-multi-layer-selection>
        <md-card>
            <md-card-header>
                <md-card-header-text>
                    <span class="md-title">Configuration</span>
                    <span class="md-subheader">Specify the operator</span>
                </md-card-header-text>
            </md-card-header>
            <md-card-content>
                <div layout="row" ngControlGroup="valueNames">
                    <md-input
                        *ngFor="let control of valueNamesControls.controls; let i = index"
                        placeholder="Value Name for Raster {{LetterNumberConverter.toLetters(i+1)}}"
                        minLength="1"
                        [ngFormControl]="control"
                        #theInput
                    >
                        <md-hint align="end" style="color: #f44336"
                            *ngIf="invalidAttributeName(theInput.value)"
                        >attribute name is duplicate!</md-hint>
                    </md-input>
                </div>
            </md-card-content>
        </md-card>
        <wave-operator-output-name ngControl="name"></wave-operator-output-name>
    </form>
    `,
    directives: [
        COMMON_DIRECTIVES, MATERIAL_DIRECTIVES, MD_INPUT_DIRECTIVES,
        LayerMultiSelectComponent, ReprojectionSelectionComponent, OperatorOutputNameComponent,
    ],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class RasterValueExtractionOperatorComponent extends OperatorBaseComponent
                                                    implements OnInit {

    configForm: ControlGroup;
    valueNamesControls: ControlArray;

    selectedVectorLayer: Layer<Symbology>;
    selectedRasterLayers: Array<Layer<Symbology>>;

    disallowedValueNames: Array<string>;

    LetterNumberConverter = LetterNumberConverter; // tslint:disable-line:variable-name

    // TODO: magic numbers
    private resolutionX = 1024;
    private resolutionY = 1024;

    constructor(
        layerService: LayerService,
        private randomColorService: RandomColorService,
        private mappingQueryService: MappingQueryService,
        private projectService: ProjectService,
        private formBuilder: FormBuilder
    ) {
        super(layerService);

        this.valueNamesControls = formBuilder.array([]);
        this.valueNamesControls.valueChanges.subscribe(attributeNameArray => {
            this.checkForDisallowedAttributeNames(attributeNameArray);
        });

        this.configForm = formBuilder.group({
            'valueNames': this.valueNamesControls,
            'name': ['Points With Raster Values', Validators.required],
        });
    }

    ngOnInit() {
        super.ngOnInit();
        this.dialog.setTitle('Extract a Raster Value and Add it to the Vector Layer');
    }

    onSelectVectorLayer(layer: Layer<Symbology>) {
        this.selectedVectorLayer = layer;
        this.disallowedValueNames = layer.operator.attributes.toArray();

        this.checkForDisallowedAttributeNames(this.valueNamesControls.value);
    }

    onSelectRasterLayers(layers: Array<Layer<Symbology>>) {
        let discrepancy = layers.length - this.valueNamesControls.length;
        if (discrepancy > 0) {
            for (let i = this.valueNamesControls.length; i < layers.length; i++) {
                this.valueNamesControls.push(this.formBuilder.control(
                    layers[i].name, Validators.required
                ));
            }
        } else if (discrepancy < 0) {
            for (let i = layers.length; i < this.valueNamesControls.length; i++) {
                this.valueNamesControls.removeAt(i);
            }
        }

        this.selectedRasterLayers = layers;
    }

    add() {
        const vectorOperator = this.selectedVectorLayer.operator;
        const projection = vectorOperator.projection;
        const resultType = vectorOperator.resultType;

        const rasterOperators = this.selectedRasterLayers.map(
            layer => layer.operator.getProjectedOperator(projection)
        );

        const valueNames = this.valueNamesControls.controls.map(control => control.value);

        // ATTENTION: make the three mutable copies to loop just once over the rasters
        //            -> make them immutable to put them into the operator
        const units = vectorOperator.units.asMutable();
        const dataTypes = vectorOperator.dataTypes.asMutable();
        const attributes = vectorOperator.attributes.asMutable();

        for (let i = 0; i < rasterOperators.length; i++) {
            units.set(valueNames[i], rasterOperators[i].getUnit('value'));
            dataTypes.set(valueNames[i], rasterOperators[i].getDataType('value'));
            attributes.push(valueNames[i]);
        }

        const name: string = this.configForm.controls['name'].value;

        const operator = new Operator({
            operatorType: new RasterValueExtractionType({
                xResolution: this.resolutionX,
                yResolution: this.resolutionY,
                attributeNames: valueNames,
            }),
            resultType: resultType,
            projection: projection,
            attributes: attributes.asImmutable(),  // immutable!
            dataTypes: dataTypes.asImmutable(),  // immutable!
            units: units.asImmutable(), // immutable!
            pointSources: resultType === ResultTypes.POINTS ? [vectorOperator] : undefined,
            lineSources: resultType === ResultTypes.LINES ? [vectorOperator] : undefined,
            polygonSources: resultType === ResultTypes.POLYGONS ? [vectorOperator] : undefined,
            rasterSources: rasterOperators,
        });

        this.layerService.addLayer(new VectorLayer({
            name: name,
            operator: operator,
            symbology: new SimplePointSymbology({
                fill_rgba: this.randomColorService.getRandomColor(),
            }),
            data$: this.mappingQueryService.getWFSDataStreamAsGeoJsonFeatureCollection(
                operator,
                this.projectService.getTimeStream(),
                this.projectService.getMapProjectionStream()
            ),
            prov$: this.mappingQueryService.getProvenanceStream(
                operator,
                this.projectService.getTimeStream(),
                this.projectService.getMapProjectionStream()
            ),
        }));

        this.dialog.close();
    }

    invalidAttributeName(
        name: string,
        attributeArray: Array<string> = this.valueNamesControls.value
    ): boolean {
        const inDisallowedNames = this.disallowedValueNames.indexOf(name) >= 0;
        const duplicateName = attributeArray.indexOf(name) !== attributeArray.lastIndexOf(name);
        return inDisallowedNames || duplicateName;
    }

    private checkForDisallowedAttributeNames(attributeArray: Array<string>) {
        const nameCollision = attributeArray.map(
            name => this.invalidAttributeName(name, attributeArray)
        ).reduce(
            (oldValue, newValue) => oldValue || newValue, false
        );

        this.addDisabled.next(nameCollision);
    }

}
