import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';

import {
    PointSymbology,
    VectorSymbology,
    StrokeDashStyle,
    SymbologyType,
    DEFAULT_POINT_CLUSTER_RADIUS_ATTRIBUTE,
    MAX_ALLOWED_POINT_RADIUS, MIN_ALLOWED_POINT_RADIUS, DEFAULT_POINT_CLUSTER_TEXT_ATTRIBUTE, MAX_ALLOWED_TEXT_LENGTH
} from '../symbology.model';
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

    @Input() layer: VectorLayer<PointSymbology> | VectorLayer<VectorSymbology>;
    @Output() symbologyChanged = new EventEmitter<PointSymbology | VectorSymbology>();

    readonly minRadius = MIN_ALLOWED_POINT_RADIUS;
    readonly maxRadius = MAX_ALLOWED_POINT_RADIUS;
    readonly maxTextChars = MAX_ALLOWED_TEXT_LENGTH;

    symbology: VectorSymbology | PointSymbology;

    fillByAttribute = false;
    strokeByAttribute = false;
    fillColorAttribute: Attribute;
    strokeColorAttribute: Attribute;
    radiusAttribute: Attribute;
    radiusByAttribute: boolean;
    textByAttribute: boolean;
    textAttribute: Attribute;
    attributes: Array<Attribute>;
    numericAttributes: Array<Attribute>;

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

    setRadiusAttributeForClustering() {
        const symbology = this.symbology as PointSymbology;
        this.radiusByAttribute = false;
        symbology.radiusFactor = 1.0;
        symbology.clustered = true;
        symbology.radiusAttribute = DEFAULT_POINT_CLUSTER_RADIUS_ATTRIBUTE;
        this.update();
    }

    setTextAttributeForClustering() {
        this.textByAttribute = false;
        this.symbology.textAttribute = DEFAULT_POINT_CLUSTER_TEXT_ATTRIBUTE;
        this.update();
    }

    updateFillColorizeByAttribute(event: MatSlideToggleChange) {
        this.fillByAttribute = event.checked;
        this.setFillColorizerAttribute();
        this.update();
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
        this.update();
    }

    setRadiusAttribute() {
        if (this.symbology instanceof PointSymbology) {
            if (this.radiusByAttribute && this.radiusAttribute) {
                this.symbology.setRadiusAttribute(this.radiusAttribute.name);
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

    setTextAttribute() {
        if (this.textByAttribute && this.textAttribute) {
            this.symbology.setTextAttribute(this.textAttribute.name);
        } else {
            this.symbology.unSetTextAttribute();
        }
        this.update();
    }

    updateTextByAttribute(event: MatSlideToggleChange) {
        this.textByAttribute = event.checked;
        this.setTextAttribute();
    }

    updateSymbologyFromLayer() {
        if (!this.layer || !this.layer.symbology || this.layer.symbology.equals(this.symbology)) {
            return;
        }
        const symbology = this.layer.symbology;
        this.symbology = symbology;
        this.fillByAttribute = !!symbology.fillColorAttribute;
        this.strokeByAttribute = !!symbology.strokeColorAttribute;
        this.gatherAttributes();
        this.fillColorAttribute = this.attributes.find(x => x.name === symbology.fillColorAttribute);
        this.fillByAttribute = !!this.fillColorAttribute;
        this.strokeColorAttribute = this.attributes.find(x => x.name === symbology.strokeColorAttribute);
        this.strokeByAttribute = !!this.strokeColorAttribute;
        if (symbology instanceof PointSymbology) {
            this.radiusAttribute = this.attributes.find(x => x.name === symbology.radiusAttribute);
            this.radiusByAttribute = !!this.radiusAttribute;
        }
        this.textAttribute = this.attributes.find(x => x.name === symbology.textAttribute);
        this.textByAttribute = !!this.textAttribute;
    }

    gatherAttributes() {
        const attributes: Array<Attribute> = [];
        const numericAttributes: Array<Attribute> = [];
        this.layer.operator.dataTypes.forEach((datatype, attribute) => {

            if (DataTypes.ALL_NUMERICS.indexOf(datatype) >= 0) {
                numericAttributes.push({
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
        this.numericAttributes = numericAttributes;
        this.attributes = [...numericAttributes, ...attributes];
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

        if (!(this.symbology instanceof PointSymbology)) {
            throw new Error('SymbologyVectorComponent: cant change radius for non point symbology');
        }
        this.symbology.radius = event.value;
        if (this.symbology.radius < this.minRadius) {
            this.symbology.radius = this.minRadius;
        }
        if (this.symbology.radius > this.maxRadius) {
            this.symbology.radius = this.maxRadius;
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

    get fillColorAttributePlaceholder(): string {
        return (this.fillByAttribute) ? 'Default Fill Color' : 'Fill Color';
    }

    get strokeColorAttributePlaceholder(): string {
        return (this.strokeByAttribute) ? 'Default Stroke Color' : 'Stroke Color';
    }

    get radiusAttributePlaceholder(): string {
        return (this.radiusByAttribute || this.isClusteredPointSymbology) ? 'Default Radius' : 'Radius';
    }

    get isClusteredPointSymbology(): boolean {
        if (this.symbology instanceof PointSymbology) {
            return this.symbology.clustered;
        }
        return false;
    }

    get isPointSymbology(): boolean {
        return this.symbology.getSymbologyType() === SymbologyType.COMPLEX_POINT;
    }
}
