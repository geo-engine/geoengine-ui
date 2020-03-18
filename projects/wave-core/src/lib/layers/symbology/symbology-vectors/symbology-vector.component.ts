import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';

import {ComplexPointSymbology, ComplexVectorSymbology, StrokeDashStyle} from '../symbology.model';
import {MatSlideToggleChange} from '@angular/material/slide-toggle';
import {MatSliderChange} from '@angular/material/slider';
import {ColorBreakpoint} from '../../../colors/color-breakpoint.model';
import {VectorLayer} from '../../layer.model';
import {DataTypes} from '../../../operators/datatype.model';
import {ColorizerData} from '../../../colors/colorizer-data.model';

interface Attribute {
    name: string;
    type: 'number' | 'text';
}

@Component({
    selector: 'wave-symbology-vector',
    templateUrl: `symbology-vector.component.html`,
    styleUrls: [
        './symbology-vector.component.scss'
    ],
})
export class SymbologyVectorComponent implements OnChanges, OnInit {

    static minStrokeWidth = 0;
    static minRadius = 1;

    @Input() editRadius = true;
    @Input() editFillColor = true;
    @Input() editStrokeWidth = true;
    @Input() editStrokeColor = true;
    @Input() editStrokeDash = true;
    @Input() editColorizeFillByAttribute = true;
    @Input() editColorizeStrokeByAttribute = true;


    @Input() layer: VectorLayer<ComplexPointSymbology> | VectorLayer<ComplexVectorSymbology>;
    @Output() symbologyChanged = new EventEmitter<ComplexPointSymbology | ComplexVectorSymbology>();

    symbology: ComplexPointSymbology | ComplexVectorSymbology;

    fillByAttribute = false;
    strokeByAttribute = false;
    fillColorAttribute: Attribute;
    strokeColorAttribute: Attribute;
    attributes: Array<Attribute>;

    constructor() {
    }

    ngOnChanges(changes: SimpleChanges) {
        for (const propName in changes) { // tslint:disable-line:forin
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
        this.updateSymbologyFromLayer();
    }

    setFillColorizerAttribute() {
        if (this.fillByAttribute && this.fillColorAttribute) {
            this.symbology.setFillColorAttribute(this.fillColorAttribute.name);
            this.symbology.fillColorizer.clear();
            this.symbology.fillColorizer.addBreakpoint({
                rgba: this.symbology.fillRGBA,
                value: (this.fillColorAttribute.type === 'number') ? 0 : '',
            });
        } else {
            this.symbology.unSetFillColorAttribute();
        }
    }

    updateFillColorizeByAttribute(event: MatSlideToggleChange) {
        this.fillByAttribute = event.checked;
        this.setFillColorizerAttribute();
    }

    setStrokeColorizerAttribute() {
        if (this.strokeByAttribute && this.strokeColorAttribute) {
            this.symbology.setStrokeColorAttribute(this.strokeColorAttribute.name);
            this.symbology.strokeColorizer.clear();
            this.symbology.strokeColorizer.addBreakpoint({
                rgba: this.symbology.strokeRGBA,
                value: (this.strokeColorAttribute.type === 'number') ? 0 : '',
            });
        } else {
            this.symbology.unSetStrokeColorAttribute();
        }
    }

    updateStrokeColorizeByAttribute(event: MatSlideToggleChange) {
        this.strokeByAttribute = event.checked;
        this.setStrokeColorizerAttribute();
    }

    updateSymbologyFromLayer() {
        if (!this.layer || !this.layer.symbology || this.layer.symbology.equals(this.symbology)) {
            return;
        }
        this.symbology = this.layer.symbology;
        this.fillByAttribute = !!this.symbology.fillColorAttribute;
        this.strokeByAttribute = !!this.symbology.strokeColorAttribute;
        this.gatherAttributes();
        this.fillColorAttribute = this.attributes.find(x => x.name === this.symbology.fillColorAttribute);
        this.strokeColorAttribute = this.attributes.find(x => x.name === this.symbology.strokeColorAttribute);
    }

    gatherAttributes() {
        const attributes: Array<Attribute> = [];
        this.layer.operator.dataTypes.forEach((datatype, attribute) => {

            if (DataTypes.ALL_NUMERICS.indexOf(datatype) >= 0) {
                attributes.push({
                    name: attribute,
                    type: 'number',
                });
            } else {
                attributes.push({
                    name: attribute,
                    type: 'text',
                });
            }
        });
        this.attributes = attributes;
    }

    update() {
        // return a clone (immutablility)
        this.symbologyChanged.emit(this.symbology.clone());
    }

    updateStrokeWidth(event: MatSliderChange) {
        // guard against negative values
        if (this.symbology.strokeWidth < SymbologyVectorComponent.minStrokeWidth) {
            this.symbology.strokeWidth = SymbologyVectorComponent.minStrokeWidth;
        }

        this.symbology.strokeWidth = event.value;
        this.update();
    }

    updateStrokeDash(sds: StrokeDashStyle) {
        if (!!sds && sds !== this.symbology.strokeDashStyle) {
            this.symbology.setStrokeDashStyle(sds);
            this.update();
        }
    }

    updateRadius(event: MatSliderChange) {

        if (!(this.symbology instanceof ComplexPointSymbology)) {
            console.error('SymbologyVectorComponent: cant change radius for non point symbology');
            return;
        }
        this.symbology.radius = event.value;
        if (this.symbology.radius < SymbologyVectorComponent.minRadius) {
            this.symbology.radius = SymbologyVectorComponent.minRadius;
        }
        this.update();
    }

    updateFill(fill: ColorBreakpoint) {
        if (fill && fill !== this.symbology.fillColorBreakpoint) {
            this.symbology.setFillColorBreakpoint(fill);
            this.update();
        }
    }

    updateStroke(stroke: ColorBreakpoint) {
        if (stroke && stroke !== this.symbology.strokeColorBreakpoint) {
            this.symbology.setStrokeColorBreakpoint(stroke);
            this.update();
        }
    }

    updateFillColorizer(event: ColorizerData) {
        if (event && this.symbology) {
            this.symbology.setOrUpdateFillColorizer(event);
            this.update();
        }
    }

    updateStrokeColorizer(event: ColorizerData) {
        if (event && this.symbology) {
            this.symbology.setOrUpdateStrokeColorizer(event);
            this.update();
        }
    }
}
