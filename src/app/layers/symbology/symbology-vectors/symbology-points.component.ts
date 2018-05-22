import {Component, Input, Output, EventEmitter, OnChanges, OnInit, SimpleChanges} from '@angular/core';

import {ComplexPointSymbology, Symbology} from '../symbology.model';
import {MatSliderChange, MatSlideToggleChange} from '@angular/material';
import {ColorBreakpoint} from '../../../colors/color-breakpoint.model';
import {Layer, VectorLayer} from '../../layer.model';
import {DataTypes} from '../../../operators/datatype.model';
import {ColorizerData} from '../../../colors/colorizer-data.model';
import {Observable} from 'rxjs/Observable';

interface Attribute {
    name: string,
    type: 'numeric' | 'textual',
}

@Component({
    selector: 'wave-symbology-points',
    templateUrl: `symbology-points.component.html`,
    styleUrls: [
        './symbology-shared.scss',
        './symbology-points.component.scss'
    ],
})
export class SymbologyPointsComponent implements OnChanges, OnInit{

    static minStrokeWidth = 0;
    static minRadius = 1;

    @Input() editRadius = true;
    @Input() editStrokeWidth = true;
    @Input() layer: VectorLayer<ComplexPointSymbology>;
    symbology: ComplexPointSymbology;
    @Output('symbologyChanged') symbologyChanged = new EventEmitter<ComplexPointSymbology>();

    colorizeByAttribute = false;
    attribute: Attribute;
    attributes: Array<Attribute>;

    constructor() {}

    ngOnChanges(changes: SimpleChanges) {
        console.log('SymbologyPointsComponent', 'ngOnChanges', changes, this);

        for (let propName in changes) { // tslint:disable-line:forin
            switch (propName) {
                case 'layer':
                    this.updateSymbologyFromLayer();
                    break;

                default:
                // DO NOTHING
            }
        }
    }

    ngOnInit() {
        console.log('SymbologyPointsComponent', 'ngOnInit', this);
    }

    setColorizerAttribute() {
        if (this.colorizeByAttribute && this.attribute !== undefined) {
            this.symbology.setColorAttribute(this.attribute.name);
            this.symbology.colorizer.clear();
            this.symbology.colorizer.addBreakpoint({
                rgba: this.symbology.fillRGBA,
                value: (this.attribute.type === 'numeric') ? 0 : '',
            });
        } else {
            this.symbology.unSetColorAttribute();
        }
    }

    updateColorizeByAttribute(event: MatSlideToggleChange) {
        this.colorizeByAttribute = event.checked;
        this.setColorizerAttribute();
    }

    updateSymbologyFromLayer() {
        this.symbology = this.layer.symbology;
        this.geatherAttributes();
    }

    geatherAttributes() {
        let attributes: Array<Attribute> = [];
        this.layer.operator.dataTypes.forEach((datatype, attribute) => {
            if (DataTypes.ALL_NUMERICS.indexOf(datatype) >= 0) {
                attributes.push({
                    name: attribute,
                    type: 'numeric',
                });
            } else {
                attributes.push({
                    name: attribute,
                    type: 'textual',
                });
            }
        });
        this.attributes = attributes;
    }

    update() {
        // guard against negative values
        if (this.symbology.radius < SymbologyPointsComponent.minRadius) {
            this.symbology.radius = SymbologyPointsComponent.minRadius;
        }
        if (this.symbology.strokeWidth < SymbologyPointsComponent.minStrokeWidth) {
            this.symbology.strokeWidth = SymbologyPointsComponent.minStrokeWidth;
        }

        // return a clone (immutablility)
        this.symbologyChanged.emit(this.symbology.clone());
    }

    updateStrokeWidth(event: MatSliderChange) {
        this.symbology.strokeWidth = event.value;
        this.update();
    }

    updateRadius(event: MatSliderChange) {
        this.symbology.radius = event.value;
        this.update();
    }

    updateFill(fill: ColorBreakpoint) {
        console.log('updateFill', fill);
        if (fill && fill !== this.symbology.fillColorBreakpoint) {
            this.symbology.setFillColorBreakpoint(fill);
            this.update();
        }
    }

    updateStroke(stroke: ColorBreakpoint) {
        console.log('updateStroke', stroke);
        if (stroke && stroke !== this.symbology.strokeColorBreakpoint) {
            this.symbology.setStrokeColorBreakpoint(stroke);
            this.update();
        }
    }

    updateColorizer(event: ColorizerData) {
        console.log('updateColorizer', event);
    }
}
