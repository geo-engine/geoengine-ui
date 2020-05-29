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

/**
 * A simple interface to group attribute names with types
 */
interface Attribute {
    name: string;
    type: 'number' | 'text';
}

/**
 * The symbology editor component for vector layers
 */
@Component({
    selector: 'wave-symbology-vector',
    templateUrl: `symbology-vector.component.html`,
    styleUrls: [
        './symbology-vector.component.scss'
    ],
})
export class SymbologyVectorComponent implements OnChanges, OnInit {

    // the min valid stroke width
    static minStrokeWidth = 0;

    /**
     * The vector layer for which the symbology is currently edited
     */
    @Input() layer: VectorLayer<PointSymbology> | VectorLayer<VectorSymbology>;
    /**
     * The event emitter propagating the changed symbology
     */
    @Output() symbologyChanged = new EventEmitter<PointSymbology | VectorSymbology>();

    // bounds for radius and text
    readonly minRadius = MIN_ALLOWED_POINT_RADIUS;
    readonly maxRadius = MAX_ALLOWED_POINT_RADIUS;
    readonly maxTextChars = MAX_ALLOWED_TEXT_LENGTH;

    /**
     * The working copy of the symbology
     */
    symbology: VectorSymbology | PointSymbology;

    // enable / disable symbology features and stores for the selected attributes
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

    /**
     * set the symbology fill colorizer attribute from the local (selected) variables
     */
    setFillColorizerAttribute() {
        if (this.fillByAttribute && this.fillColorAttribute) {
            this.symbology.setFillColorAndAttribute(this.fillColorAttribute.name);
            this.symbology.fillColorizer.clear();
            this.symbology.fillColorizer.addBreakpoint({
                rgba: this.symbology.fillRGBA,
                value: (this.fillColorAttribute.type === 'number') ? 0 : '',
            });
        } else {
            this.symbology.clearFillColorAndAttribute();
        }
    }

    /**
     * set the radius attribute to the default for clustered points
     */
    setRadiusAttributeForClustering() {
        const symbology = this.symbology as PointSymbology;
        this.radiusByAttribute = false;
        symbology.radiusFactor = 1.0;
        symbology.clustered = true;
        symbology.radiusAttribute = DEFAULT_POINT_CLUSTER_RADIUS_ATTRIBUTE;
        this.update();
    }

    /**
     * set the text attribute to the default for clustered points
     */
    setTextAttributeForClustering() {
        this.textByAttribute = false;
        this.symbology.textAttribute = DEFAULT_POINT_CLUSTER_TEXT_ATTRIBUTE;
        this.update();
    }

    /**
     * update the fill colorizer attribute using the slide toggle value
     */
    updateFillColorizeByAttribute(event: MatSlideToggleChange) {
        this.fillByAttribute = event.checked;
        this.setFillColorizerAttribute();
        this.update();
    }

    /**
     * set the stroke color attribute using the local (selected) variables
     */
    setStrokeColorizerAttribute() {
        if (this.strokeByAttribute && this.strokeColorAttribute) {
            this.symbology.setStrokeColorAndAttribute(this.strokeColorAttribute.name);
            this.symbology.strokeColorizer.clear();
            this.symbology.strokeColorizer.addBreakpoint({
                rgba: this.symbology.strokeRGBA,
                value: (this.strokeColorAttribute.type === 'number') ? 0 : '',
            });
        } else {
            this.symbology.clearStrokeColorAndAttribute();
        }
    }

    /**
     * update the stroke color attribute using the slide togle value
     */
    updateStrokeColorizeByAttribute(event: MatSlideToggleChange) {
        this.strokeByAttribute = event.checked;
        this.setStrokeColorizerAttribute();
        this.update();
    }

    /**
     * set the radius attribute using the local (selected) variables
     */
    setRadiusAttribute() {
        if (this.symbology instanceof PointSymbology) {
            if (this.radiusByAttribute && this.radiusAttribute) {
                this.symbology.setRadiusAttributeAndFactor(this.radiusAttribute.name);
            } else {
                this.symbology.clearRadiusAttribute();

            }
            this.update();
        }
    }

    /**
     * update the stroke color attribute using the slide togle value
     */
    updateRadiusByAttribute(event: MatSlideToggleChange) {
        this.radiusByAttribute = event.checked;
        this.setRadiusAttribute();
    }

    /**
     * set the text attribute using the (selected) local variables
     */
    setTextAttribute() {
        if (this.textByAttribute && this.textAttribute) {
            this.symbology.textAttribute = this.textAttribute.name;
        } else {
            this.symbology.clearTextAttribute();
        }
        this.update();
    }

    /**
     * update the text attribute using the slide togle value
     */
    updateTextByAttribute(event: MatSlideToggleChange) {
        this.textByAttribute = event.checked;
        this.setTextAttribute();
    }

    private updateSymbologyFromLayer() {
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

    private gatherAttributes() {
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

    /**
     * emmit the current working symbology
     */
    update() {
        // return a clone (immutablility)
        this.symbologyChanged.emit(this.symbology.clone());
    }

    /**
     * update the stroke width unsing the slider value
     */
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
            this.symbology.strokeDashStyle = sds;
            this.update();
        }
    }

    /**
     * update the stroke dash unsing the slider value
     */
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

    /**
     * update the fill with a color breakpoint
     */
    updateFill(fill: ColorBreakpoint) {
        if (fill && fill !== this.symbology.fillColorBreakpoint) {
            this.symbology.fillColorBreakpoint = fill;
            this.update();
        }
    }

    /**
     * update the stroke with a color breakpoint
     */
    updateStroke(stroke: ColorBreakpoint) {
        if (stroke && stroke !== this.symbology.strokeColorBreakpoint) {
            this.symbology.strokeColorBreakpoint = stroke;
            this.update();
        }
    }

    /**
     * update the fill colorizer with colorizer data
     */
    updateFillColorizer(event: ColorizerData) {
        if (event && this.symbology) {
            this.symbology.setOrUpdateFillColorizer(event);
            this.update();
        }
    }

    /**
     * update the stroke colorizer with colorizer data
     */
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
