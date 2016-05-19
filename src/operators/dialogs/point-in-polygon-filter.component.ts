import {Component, ChangeDetectionStrategy} from 'angular2/core';

import {MATERIAL_DIRECTIVES} from 'ng2-material/all';
import {MdDialogRef} from 'ng2-material/components/dialog/dialog';

import {FORM_DIRECTIVES, Validators, FormBuilder, ControlGroup} from 'angular2/common';

import {OperatorBaseComponent, LayerMultiSelectComponent, OperatorContainerComponent}
    from './operator.component';

import {Layer} from '../../models/layer.model';
import {Operator} from '../operator.model';
import {ResultTypes} from '../result-type.model';
import {PointInPolygonFilterType} from '../types/point-in-polygon-filter-type.model';
import {SimplePointSymbology} from '../../models/symbology.model';

/**
 * This component allows creating the point in polygon filter operator.
 */
@Component({
    selector: 'wave-point-in-polygon-filter',
    template: `
    <wave-operator-container title="Point in Polygon Filter"
                             (add)="addLayer()" (cancel)="dialog.close()">
        <form [ngFormModel]="configForm">
            <wave-multi-layer-selection
                [layers]="layers" [min]="1" [max]="1"
                [types]="[ResultTypes.POINTS]"
                (selectedLayers)="pointLayer = $event[0]">
            </wave-multi-layer-selection>
            <wave-multi-layer-selection
                [layers]="layers" [min]="1" [max]="1"
                [types]="[ResultTypes.POLYGONS]"
                (selectedLayers)="polygonLayer = $event[0]">
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
        LayerMultiSelectComponent, OperatorContainerComponent,
    ],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class PointInPolygonFilterOperatorComponent extends OperatorBaseComponent {

        private configForm: ControlGroup;
        private pointLayer: Layer<any>;
        private polygonLayer: Layer<any>;

    constructor(private dialog: MdDialogRef, private formBuilder: FormBuilder) {
        super();

        this.configForm = formBuilder.group({
            name: ['Filtered Values', Validators.required],
        });
    }

    addLayer() {
        const pointOperator = this.pointLayer.operator;
        const polygonOperator = this.polygonLayer.operator;

        const name: string = this.configForm.controls['name'].value;

        const operator = new Operator({
            operatorType: new PointInPolygonFilterType({}),
            resultType: ResultTypes.POINTS,
            projection: pointOperator.projection,
            attributes: pointOperator.attributes,
            dataTypes: pointOperator.dataTypes,
            units: pointOperator.units,
            pointSources: [pointOperator],
            polygonSources: [polygonOperator],
        });

        this.layerService.addLayer(new Layer({
            name: name,
            operator: operator,
            symbology: new SimplePointSymbology({
                fill_rgba: this.randomColorService.getRandomColor(),
            }),
        }));

        this.dialog.close();
    }

}
