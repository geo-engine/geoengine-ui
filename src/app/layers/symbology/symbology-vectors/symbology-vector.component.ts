import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';

import {ComplexPointSymbology, ComplexVectorSymbology, SymbologyType} from '../symbology.model';
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
    @Input() editStrokeWidth = true;
    @Input() layer: VectorLayer<ComplexPointSymbology> | VectorLayer<ComplexVectorSymbology>;
    @Output() symbologyChanged = new EventEmitter<ComplexPointSymbology | ComplexVectorSymbology>();

    symbology: ComplexPointSymbology | ComplexVectorSymbology;
    colorizeByAttribute: boolean;
    colorAttribute: Attribute;
    radiusAttribute: Attribute;
    radiusByAttribute: boolean;
    attributes: Array<Attribute>;

    constructor() {
    }

    ngOnChanges(changes: SimpleChanges) {
        for (let propName in changes) { // tslint:disable-line:forin
            switch (propName) {
                case 'layer':
                    this.updateSymbologyFromLayer();
                    break;
                case 'editRadius':
                case 'editStrokeWidth':
                default:
                // DO NOTHING
            }
        }
    }

    ngOnInit() {
        this.updateSymbologyFromLayer();
    }

    setColorizerAttribute() {
        if (this.colorizeByAttribute && this.colorAttribute) {
            this.symbology.setColorAttribute(this.colorAttribute.name);
            this.symbology.colorizer.clear();
            this.symbology.colorizer.addBreakpoint({
                rgba: this.symbology.fillRGBA,
                value: (this.colorAttribute.type === 'number') ? 0 : '',
            });
        } else {
            this.symbology.unSetColorAttribute();
        }
    }

    updateColorizeByAttribute(event: MatSlideToggleChange) {
        this.colorizeByAttribute = event.checked;
        this.setColorizerAttribute();
    }

    setRadiusAttribute() {
        console.log('setRadiusAttribute');
        if (this.symbology instanceof ComplexPointSymbology) {
            console.log('setRadiusAttribute', 'instanceof');
            if (this.radiusByAttribute && this.radiusAttribute) {
                this.symbology.setRadiusAttribute(this.radiusAttribute.name);
                console.log('setRadiusAttribute', 'radiusAttribute', this.radiusAttribute.name);
            } else {
                this.symbology.unSetRadiusAttribute();
            }
            this.update();
        }
    }

    updateRadiusByAttribute(event: MatSlideToggleChange) {
        this.radiusByAttribute = event.checked;
        this.setRadiusAttribute();
    }

    updateSymbologyFromLayer() {
        if (!this.layer || !this.layer.symbology || this.layer.symbology.equals(this.symbology)) {
            return;
        }
        this.symbology = this.layer.symbology;
        this.colorizeByAttribute = !!this.symbology.colorAttribute;
        this.gatherAttributes();
        this.colorAttribute = this.attributes.find(x => x.name === this.symbology.colorAttribute);
    }

    gatherAttributes() {
        let attributes: Array<Attribute> = [];
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

    updateRadius(event: MatSliderChange) {

        if (this.symbology instanceof ComplexPointSymbology && this.editRadius) {
            this.symbology.radius = event.value;

            if (this.symbology.radius < SymbologyVectorComponent.minRadius) {
                this.symbology.radius = SymbologyVectorComponent.minRadius;
            }
        } else {
            console.error('SymbologyVectorComponent: cant change radius for non point symbology');
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

    updateColorizer(event: ColorizerData) {
        if (event && this.symbology) {
            this.symbology.setOrUpdateColorizer(event);
            this.update();
        }
    }

    get isPointSymbology(): boolean {
        return this.symbology.getSymbologyType() === SymbologyType.COMPLEX_POINT;
    }
}
