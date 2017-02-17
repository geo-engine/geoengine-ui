import {Component, ChangeDetectionStrategy, OnInit, OnDestroy} from '@angular/core';
import {FormGroup, FormArray, FormBuilder, Validators, FormControl} from "@angular/forms";

import {Subscription} from 'rxjs/Rx';

import Config from '../../app/config.model';

import {LayerService} from '../../layers/layer.service';
import {RandomColorService} from '../../services/random-color.service';
import {MappingQueryService} from '../../queries/mapping-query.service';
import {ProjectService} from '../../project/project.service';

import {VectorLayer, Layer} from '../../layers/layer.model';
import {
    Symbology, SimplePointSymbology, AbstractVectorSymbology, ClusteredPointSymbology,
} from '../../symbology/symbology.model';

import {Operator} from '../operator.model';
import {LetterNumberConverter} from './operator.component' //FIXME: WHAT?
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
            [types]="[ResultTypes.POINTS]"
            (selectedLayers)="onSelectVectorLayer($event[0])"
        ></wave-multi-layer-selection>
        <wave-multi-layer-selection
            [layers]="layers" [min]="1" [max]="9"
            [types]="[ResultTypes.RASTER]"
            (selectedLayers)="onSelectRasterLayers($event)"
        ></wave-multi-layer-selection>
        <md-card>
            <md-card-header>
                    <md-card-title class="md-title">Configuration</md-card-title>
                    <md-card-subtitle class="md-subheader">Specify the operator</md-card-subtitle>
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
                        <md-hint align="end" style="color: ${Config.COLORS.WARN}"
                            *ngIf="invalidAttributeName(theInput.value)"
                        >attribute name is duplicate!</md-hint>
                    </md-input>
                </div>
            </md-card-content>
        </md-card>
        <wave-operator-output-name ngControl="name"></wave-operator-output-name>
    </form>
    `,
    changeDetection: ChangeDetectionStrategy.Default,
})
export class RasterValueExtractionOperatorComponent
                                                    implements OnInit, OnDestroy {

    configForm: FormGroup;
    valueNamesControls: FormArray;
    valueNamesNameChanged: Array<boolean>;

    selectedVectorLayer: VectorLayer<AbstractVectorSymbology>;
    selectedRasterLayers: Array<Layer<Symbology>>;

    disallowedValueNames: Array<string>;

    LetterNumberConverter = LetterNumberConverter; // tslint:disable-line:variable-name

    // TODO: magic numbers
    private resolutionX = 1024;
    private resolutionY = 1024;

    private subscriptions: Array<Subscription> = [];

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

        this.valueNamesNameChanged = [];

        this.configForm = formBuilder.group({
            'valueNames': this.valueNamesControls,
            'name': ['Points With Raster Values', Validators.required],
        });
    }

    ngOnInit() {
        super.ngOnInit();
        this.dialog.setTitle('Extract a Raster Value and Add it to the Vector Layer');
    }

    ngOnDestroy() {
        for (const subscription of this.subscriptions) {
            subscription.unsubscribe();
        }
    }

    onSelectVectorLayer(layer: VectorLayer<AbstractVectorSymbology>) {
        this.selectedVectorLayer = layer;
        this.disallowedValueNames = layer.operator.attributes.toArray();

        this.checkForDisallowedAttributeNames(this.valueNamesControls.value);
    }

    onSelectRasterLayers(layers: Array<Layer<Symbology>>) {
        let discrepancy = layers.length - this.valueNamesControls.length;
        if (discrepancy > 0) {
            for (let i = this.valueNamesControls.length; i < layers.length; i++) {
                const control = this.formBuilder.control(
                    layers[i].name, Validators.required
                );
                this.valueNamesControls.push(control);
                this.valueNamesNameChanged.push(false);

                this.subscriptions.push(
                    control.valueChanges.subscribe(_ => this.valueNamesNameChanged[i] = true)
                );
            }
        } else if (discrepancy < 0) {
            for (let i = layers.length; i < this.valueNamesControls.length; i++) {
                this.valueNamesControls.removeAt(i);
                this.valueNamesNameChanged.splice(i, 1);
            }
        } else {
            for (let i = 0; i < this.valueNamesControls.length; i++) {
                if (!this.valueNamesNameChanged[i]) {
                    (this.valueNamesControls.at(i) as FormControl).setValue(layers[i].name);
                    this.valueNamesNameChanged[i] = false;
                }
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

        const clustered = this.selectedVectorLayer.clustered;
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
