import {Component, Input, Output, EventEmitter, OnChanges, OnInit, SimpleChanges} from '@angular/core';

import {ComplexPointSymbology, ComplexVectorSymbology} from '../symbology.model';
import {MatSliderChange, MatSlideToggleChange} from '@angular/material';
import {ColorBreakpoint} from '../../../colors/color-breakpoint.model';
import {VectorLayer} from '../../layer.model';
import {DataTypes} from '../../../operators/datatype.model';
import {ColorizerData} from '../../../colors/colorizer-data.model';

interface Attribute {
    name: string,
    type: 'number' | 'text',
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
    @Output('symbologyChanged') symbologyChanged = new EventEmitter<ComplexPointSymbology | ComplexVectorSymbology>();

    _symbology: ComplexPointSymbology | ComplexVectorSymbology;

    @Input()
    set symbology(symbology: ComplexPointSymbology | ComplexVectorSymbology) {
        // console.log('SymbologyPointsComponent', 'set symbology');
        if (symbology && !symbology.equals(this._symbology)) {
            this._symbology = symbology; // TODO: figure out if this should clone;
            // console.log('SymbologyPointsComponent', 'set symbology', 'replaced');
        }
    }

    get symbology(): ComplexPointSymbology | ComplexVectorSymbology {
        return this._symbology;
    }

    colorizeByAttribute = false;
    attribute: Attribute;
    attributes: Array<Attribute>;

    constructor() {}

    ngOnChanges(changes: SimpleChanges) {
        // console.log('SymbologyPointsComponent', 'ngOnChanges', changes, this);

        for (let propName in changes) { // tslint:disable-line:forin
            switch (propName) {
                case 'layer':
                    this.updateSymbologyFromLayer();
                    break;
                case 'editRadius':
                default:
                // DO NOTHING
            }
        }
    }

    ngOnInit() {
        // console.log('SymbologyPointsComponent', 'ngOnInit', this);
    }

    setColorizerAttribute() {
        if (this.colorizeByAttribute && this.attribute) {
            this.symbology.setColorAttribute(this.attribute.name);
            this.symbology.colorizer.clear();
            this.symbology.colorizer.addBreakpoint({
                rgba: this.symbology.fillRGBA,
                value: (this.attribute.type === 'number') ? 0 : '',
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
        this.colorizeByAttribute = !!this.symbology.colorAttribute;
        this.gatherAttributes();
        this.attribute = this.attributes.find(x => x.name === this.symbology.colorAttribute);
    }

    gatherAttributes() {
        console.log('gatherAttributes', this.layer.operator.dataTypes);
        let attributes: Array<Attribute> = [];
        this.layer.operator.dataTypes.forEach((datatype, attribute) => {
            console.log('gatherAttributes', attribute, datatype);

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
        // console.log('SymbologyPointsComponent', 'updateFill', fill);
        if (fill && fill !== this.symbology.fillColorBreakpoint) {
            this.symbology.setFillColorBreakpoint(fill);
            this.update();
        }
    }

    updateStroke(stroke: ColorBreakpoint) {
        // console.log('SymbologyPointsComponent', 'updateStroke', stroke);
        if (stroke && stroke !== this.symbology.strokeColorBreakpoint) {
            this.symbology.setStrokeColorBreakpoint(stroke);
            this.update();
        }
    }

    updateColorizer(event: ColorizerData) {
        if (event && this.symbology) {
            // console.log('SymbologyPointsComponent', 'updateColorizer', event);
            this.symbology.setOrUpdateColorizer(event);
            this.update();
        }
    }
}
