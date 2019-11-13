import {Component, Input, Output, EventEmitter, OnChanges, OnInit, SimpleChanges} from '@angular/core';

import {ComplexPointSymbology, ComplexVectorSymbology} from '../symbology.model';
import {MatSliderChange, MatSlideToggleChange} from '@angular/material';
import {ColorBreakpoint} from '../../../colors/color-breakpoint.model';
import {VectorLayer} from '../../layer.model';
import {DataTypes} from '../../../operators/datatype.model';
import {ColorizerData} from '../../../colors/colorizer-data.model';
import {StrokeDashStyle} from '../stroke-dash-select/stroke-dash-select.component';

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
    @Input() editFillColor = true;
    @Input() editStrokeWidth = true;
    @Input() editStrokeColor = true;
    @Input() editStrokeDash = true;
    @Input() editColorizeFillByAttribute = true;
    @Input() editColorizeStrokeByAttribute = true;


    @Input() layer: VectorLayer<ComplexPointSymbology> | VectorLayer<ComplexVectorSymbology>;
    @Output() symbologyChanged = new EventEmitter<ComplexPointSymbology | ComplexVectorSymbology>();

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

    fillByAttribute = false;
    strokeByAttribute = false;
    fillAttribute: Attribute;
    strokeAttribute: Attribute;
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

    setFillColorizerAttribute() {
        if (this.fillByAttribute && this.fillAttribute) {
            this.symbology.setFillColorAttribute(this.fillAttribute.name);
            this.symbology.fillColorizer.clear();
            this.symbology.fillColorizer.addBreakpoint({
                rgba: this.symbology.fillRGBA,
                value: (this.fillAttribute.type === 'number') ? 0 : '',
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
        if (this.strokeByAttribute && this.strokeAttribute) {
            this.symbology.setStrokeColorAttribute(this.strokeAttribute.name);
            this.symbology.strokeColorizer.clear();
            this.symbology.strokeColorizer.addBreakpoint({
                rgba: this.symbology.strokeRGBA,
                value: (this.strokeAttribute.type === 'number') ? 0 : '',
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
        this.symbology = this.layer.symbology;
        this.fillByAttribute = !!this.symbology.fillAttribute;
        this.strokeByAttribute = !!this.symbology.strokeAttribute;
        this.gatherAttributes();
        this.fillAttribute = this.attributes.find(x => x.name === this.symbology.fillAttribute);
        this.strokeAttribute = this.attributes.find(x => x.name === this.symbology.strokeAttribute);
    }

    gatherAttributes() {
        // console.log('gatherAttributes', this.layer.operator.dataTypes);
        let attributes: Array<Attribute> = [];
        this.layer.operator.dataTypes.forEach((datatype, attribute) => {
            // console.log('gatherAttributes', attribute, datatype);

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
        // console.log('SymbologyVectorComponent:', 'updateStrokeDash() 1', sds, );

        if (!!sds && sds !== this.symbology.strokeLineDash) {
            // console.log('SymbologyVectorComponent:', 'updateStrokeDash() 2', sds, this.symbology.strokeLineDash);

            this.symbology.setStrokeLineDash(sds);
            this.update();
        }
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

    updateFillColorizer(event: ColorizerData) {
        if (event && this.symbology) {
            // console.log('SymbologyPointsComponent', 'updateColorizer', event);
            this.symbology.setOrUpdateFilllColorizer(event);
            this.update();
        }
    }

    updateStrokeColorizer(event: ColorizerData) {
        if (event && this.symbology) {
            // console.log('SymbologyPointsComponent', 'updateColorizer', event);
            this.symbology.setOrUpdateStrokeColorizer(event);
            this.update();
        }
    }
}
