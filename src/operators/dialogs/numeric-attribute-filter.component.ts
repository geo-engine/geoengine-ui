import {
    Component, ChangeDetectionStrategy,
} from '@angular/core';
import {Http, HTTP_PROVIDERS} from '@angular/http';
import {
    FORM_DIRECTIVES, Validators, FormBuilder, ControlGroup, Control,
} from '@angular/common';

import {MATERIAL_DIRECTIVES} from 'ng2-material';
// import {MdDialogRef} from 'ng2-material/components/dialog/dialog';

import {
    LayerMultiSelectComponent, OperatorContainerComponent, OperatorBaseComponent,
} from './operator.component';
import {HistogramComponent, HistogramData} from '../../plots/histogram.component';

import {VectorLayer, Layer} from '../../models/layer.model';
import {Operator} from '../operator.model';
import {ResultTypes} from '../result-type.model';
import {NumericAttributeFilterType} from '../types/numeric-attribute-filter-type.model';
import {HistogramType} from '../types/histogram-type.model';
import {DataType, DataTypes} from '../datatype.model';
import {Unit} from '../unit.model';
import {SimplePointSymbology, Symbology} from '../../symbology/symbology.model';

/**
 * This component allows creating the expression operator.
 */
@Component({
    selector: 'wave-numeric-attribute-filter',
    template: `
    <wave-operator-container title="Numeric Attribute Filter"
                             (add)="addLayer()" (cancel)="dialog.close()">
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
                    <md-input-container class="md-block md-input-has-value">
                        <label>Attribute</label>
                        <select ngControl="attributeName">
                            <option *ngFor="let attribute of attributes" [ngValue]="attribute">
                                {{attribute}}
                            </option>
                        </select>
                        <input md-input type="hidden" value="0"><!-- HACK -->
                    </md-input-container>
                    <wave-histogram [height]="500" [width]="500" [selectable]="true"
                                    *ngIf="data" [data]="data" interactable="true"
                                    (minRange)="boundsMin = $event" (maxRange)="boundsMax = $event">
                    </wave-histogram>
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
    </wave-operator-container>
    `,
    directives: [
        FORM_DIRECTIVES, MATERIAL_DIRECTIVES,
        LayerMultiSelectComponent, HistogramComponent, OperatorContainerComponent,
    ],
    providers: [HTTP_PROVIDERS],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class NumericAttributeFilterOperatorComponent extends OperatorBaseComponent {

    private configForm: ControlGroup;

    private attributes: Array<string> = [];

    private selectedLayer: Layer<Symbology>;
    private boundsMin: number;
    private boundsMax: number;

    private data: HistogramData;

    constructor(private dialog: MdDialogRef, private formBuilder: FormBuilder,
                private http: Http) {
        super();

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
    }

    private onSelectLayer(layer: Layer<Symbology>) {
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

    addLayer() {
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
            data$: this.mappingQueryService.getWFSDataStreamAsGeoJsonFeatureCollection(
                operator,
                this.projectService.getTimeStream(),
                this.projectService.getMapProjectionStream()
            ),
            prov$: this.mappingQueryService.getProvenanceStream(operator,
                this.projectService.getTimeStream(),
                this.projectService.getMapProjectionStream()
            ),
        }));

        this.dialog.close();
    }

}
