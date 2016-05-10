import {Component, Input, Output, EventEmitter,
        OnChanges, SimpleChange, OnInit, ChangeDetectionStrategy} from "angular2/core";
import {Http, HTTP_PROVIDERS} from "angular2/http";
import {FORM_DIRECTIVES, Validators, FormBuilder,
        ControlGroup, Control, ControlArray} from "angular2/common";

import {MdPatternValidator, MdMinValueValidator, MdNumberRequiredValidator, MdMaxValueValidator,
        MATERIAL_DIRECTIVES} from "ng2-material/all";
import {MdDialogRef, MdDialogConfig} from "ng2-material/components/dialog/dialog";

import {LayerMultiSelectComponent, ReprojectionSelectionComponent, OperatorContainerComponent,
        OperatorBaseComponent, toLetters, OperatorButtonsComponent} from "./operator.component";
import {HistogramComponent, HistogramData} from "../plots/histogram.component";

import {LayerService} from "../../services/layer.service";

import {Layer} from "../../models/layer.model";
import {Operator} from "../../models/operator.model";
import {ResultTypes} from "../../models/result-type.model";
import {NumericAttributeFilterType, HistogramType} from "../../models/operator-type.model";
import {DataType, DataTypes} from "../../models/datatype.model";
import {Unit} from "../../models/unit.model";
import {Projection} from "../../models/projection.model";
import {SimplePointSymbology} from "../../models/symbology.model";



/**
 * This component allows creating the expression operator.
 */
@Component({
    selector: "wave-numeric-attribute-filter",
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
                            <option *ngFor="#attribute of attributes" [ngValue]="attribute">
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
    directives: [MATERIAL_DIRECTIVES, LayerMultiSelectComponent, HistogramComponent,
                 OperatorContainerComponent],
    providers: [HTTP_PROVIDERS],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class NumericAttributeFilterOperatorComponent extends OperatorBaseComponent {

    private configForm: ControlGroup;

    private attributes: Array<string> = [];

    private selectedLayer: Layer;
    private boundsMin: number;
    private boundsMax: number;

    private data: HistogramData;

    constructor(private dialog: MdDialogRef, private formBuilder: FormBuilder,
                private http: Http) {
        super();

        const attributeNameControl = formBuilder.control("", Validators.required);

        this.configForm = formBuilder.group({
            attribute: [undefined, Validators.required],
            nodata: [false, Validators.required],
            attributeName: attributeNameControl,
            name: ["Filtered Values", Validators.required],
        });

        attributeNameControl.valueChanges.subscribe((attributeName: string) => {
            console.log(attributeName, this.selectedLayer);

            const operator = new Operator({
                operatorType: new HistogramType({
                    attribute: attributeName,
                    range: "data",
                }),
                resultType: ResultTypes.PLOT,
                projection: this.selectedLayer.operator.projection,
                attributes: [],
                dataTypes: new Map<string, DataType>(),
                units: new Map<string, Unit>(),
                pointSources: [this.selectedLayer.operator],
            });

            this.mappingQueryService.getPlotData(operator, this.projectService.getTime())
                                    .then(data => this.data = <HistogramData> data);
            // this.http.get(
            //     `http://pc12316:10080/cgi-bin/mapping?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&TRANSPARENT=true&TILED=true&FORMAT=application/json&LAYERS=%7B%22type%22%3A%22histogram_from_features%22%2C%22params%22%3A%7B%22name%22%3A%22srtm%230%22%2C%22numberOfBuckets%22%3A20%7D%2C%22sources%22%3A%7B%22points%22%3A%5B%7B%22type%22%3A%22raster_metadata_to_points%22%2C%22params%22%3A%7B%22names%22%3A%5B%22srtm%230%22%5D%2C%22xResolution%22%3A1024%2C%22yResolution%22%3A1024%7D%2C%22sources%22%3A%7B%22raster%22%3A%5B%7B%22type%22%3A%22source%22%2C%22params%22%3A%7B%22sourcename%22%3A%22srtm%22%2C%22channel%22%3A0%7D%7D%5D%2C%22points%22%3A%5B%7B%22type%22%3A%22gfbiopointsource%22%2C%22params%22%3A%7B%22datasource%22%3A%22GBIF%22%2C%22query%22%3A%22%7B%5C%22globalAttributes%5C%22%3A%7B%5C%22speciesName%5C%22%3A%5C%22Puma%20concolor%5C%22%7D%2C%5C%22localAttributes%5C%22%3A%7B%7D%7D%22%7D%7D%5D%7D%7D%5D%7D%7D&DEBUG=1&COLORS=hsv&CRS=EPSG:4326&BBOX=-90,-180,90,180&WIDTH=1000&HEIGHT=1000&_=1462193142288`
            // ).toPromise().then(response => {
            //     this.data = response.json();
            // });

            // this.data = {
            //     type: "histogram",
            //     metadata: {min: 2, max: 4608, nodata: 15, numberOfBuckets: 20},
            //     data: [612, 582, 102, 161, 78, 72, 78, 66, 72, 77, 37, 19, 14, 4, 0, 1, 0, 0, 0, 2]
            // };
        });
    }

    ngOnInit() {
        super.ngOnInit();
    }

    ngOnChanges(changes: {[propertyName: string]: SimpleChange}) {
        super.ngOnChanges(changes);
    }

    private onSelectLayer(layer: Layer) {
        this.selectedLayer = layer;

        this.attributes = layer.operator.attributes.filter(attribute => {
            return DataTypes.ALL_NUMERICS.indexOf(layer.operator.dataTypes.get(attribute)) >= 0;
        }).toArray();

        if (this.attributes.length > 0) {
            (<Control> this.configForm.controls["attributeName"]).updateValue(
                this.attributes[0],
                {
                    emitEvent: true,
                }
            );
        }
    }

    private addLayer() {
        const vectorOperator = this.selectedLayer.operator;

        const units = vectorOperator.units;
        const dataTypes = vectorOperator.dataTypes;
        const attributes = vectorOperator.attributes;

        const nodata = this.configForm.controls["nodata"].value;
        const attributeName = this.configForm.controls["attributeName"].value;
        const boundsMin = this.boundsMin;
        const boundsMax =  this.boundsMax;

        const name: string = this.configForm.controls["name"].value;

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
                dict["pointSources"] = [vectorOperator];
                break;
            case ResultTypes.LINES:
                dict["lineSources"] = [vectorOperator];
                break;
            case ResultTypes.POLYGONS:
                dict["polygonSources"] = [vectorOperator];
                break;
        }

        const operator = new Operator(dict);

        this.layerService.addLayer(new Layer({
            name: name,
            operator: operator,
            symbology: new SimplePointSymbology({}),
        }));

        this.dialog.close();
    }

}
