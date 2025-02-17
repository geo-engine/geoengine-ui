import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';

import {
    BLACK,
    ClusteredPointSymbology,
    Color,
    ColorBreakpoint,
    ColorParam,
    DerivedColor,
    DerivedNumber,
    LineIconStyle,
    LineSymbology,
    NumberParam,
    PointIconStyle,
    PointSymbology,
    PolygonIconStyle,
    PolygonSymbology,
    SymbologyType,
    VectorLayer,
    VectorSymbology,
    WHITE,
} from '@geoengine/common';

@Component({
    selector: 'geoengine-vector-legend',
    templateUrl: 'vector-legend-component.html',
    styleUrls: ['vector-legend.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class VectorLegendComponent implements OnInit {
    readonly ST = SymbologyType;
    @Input()
    showDefaultStyle = true;

    @Input() layer!: VectorLayer;

    symbology?: VectorSymbology;

    fillColors?: ColorParam;
    strokeColor?: ColorParam;
    strokeWidth?: NumberParam;
    radius?: NumberParam;

    strokeWidthFactor = 1;
    radiusFactor = 1;

    colorBreakPoints?: ColorBreakpoint[];
    strokeColorBreakpoints?: ColorBreakpoint[];

    colorAttributeName = '';
    strokeWidthAttributeName = '';
    strokeColorAttributeName = '';
    radiusAttributeName = '';

    ngOnInit(): void {
        this.symbology = this.layer.symbology;

        if (this.symbology instanceof PointSymbology) {
            this.fillColors = this.symbology.fillColor;
            this.strokeColor = this.symbology.stroke.color;
            this.strokeWidth = this.symbology.stroke.width;
            this.radius = this.symbology.radius;
        } else if (this.symbology instanceof ClusteredPointSymbology) {
            this.fillColors = this.symbology.fillColor;
            this.strokeColor = this.symbology.stroke.color;
            this.strokeWidth = this.symbology.stroke.width;
            this.radius = this.symbology.radius;
        } else if (this.symbology instanceof PolygonSymbology) {
            this.fillColors = this.symbology.fillColor;
            this.strokeColor = this.symbology.stroke.color;
            this.strokeWidth = this.symbology.stroke.width;
        } else if (this.symbology instanceof LineSymbology) {
            this.strokeColor = this.symbology.stroke.color;
            this.strokeWidth = this.symbology.stroke.width;
        }

        if (this.fillColors instanceof DerivedColor) {
            this.colorBreakPoints = this.fillColors.colorizer.getBreakpoints();
            this.colorAttributeName = this.fillColors.attribute;
        }

        if (this.strokeWidth instanceof DerivedNumber) {
            this.strokeWidthFactor = this.strokeWidth.factor;
            this.strokeWidthAttributeName = this.strokeWidth.attribute;
        }

        if (this.strokeColor instanceof DerivedColor) {
            this.strokeColorBreakpoints = this.strokeColor.colorizer.getBreakpoints();
            this.strokeColorAttributeName = this.strokeColor.attribute;
        }

        if (this.radius instanceof DerivedNumber) {
            this.radiusAttributeName = this.radius.attribute;
            this.radiusFactor = this.radius.factor;
        }
    }

    getPointIconStyle(params: {strokeWidth?: number; strokeColor?: Color; fillColor?: Color | null}): PointIconStyle {
        const iconStyle: PointIconStyle = {
            strokeWidth: params.strokeWidth ?? 0,
            strokeRGBA: params.strokeColor ?? BLACK,
            fillRGBA: params.fillColor ?? WHITE,
        };
        return iconStyle;
    }

    getPolygonIconStyle(params: {strokeWidth?: number; strokeColor?: Color; fillColor?: Color | null}): PolygonIconStyle {
        const iconStyle: PolygonIconStyle = {
            strokeWidth: params.strokeWidth ?? 0,
            strokeRGBA: params.strokeColor ?? BLACK,
            fillRGBA: params.fillColor ?? WHITE,
        };
        return iconStyle;
    }

    getLineIconStyle(params: {strokeWidth?: number; strokeColor?: Color | null}): LineIconStyle {
        const iconStyle: LineIconStyle = {
            strokeWidth: params.strokeWidth ?? 0,
            strokeRGBA: params.strokeColor ?? BLACK,
        };
        return iconStyle;
    }
}
