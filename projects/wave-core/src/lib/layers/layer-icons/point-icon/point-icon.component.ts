import {Component, OnInit, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges} from '@angular/core';
import {StrokeDashStyle} from '../../symbology/symbology.model';
import {BLACK, Color, WHITE} from '../../../colors/color';

/**
 * A simple interface to specify the style of a point icon
 */
export interface PointIconStyle {
    strokeWidth: number;
    strokeDashStyle: StrokeDashStyle;
    strokeRGBA: Color;
    fillRGBA: Color;
}

/**
 * The point icon component
 */
@Component({
    selector: 'wave-point-icon',
    templateUrl: './point-icon.component.svg',
    styleUrls: ['./point-icon.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PointIconComponent implements OnInit, OnChanges {
    // the style to use for the icon
    @Input()
    iconStyle: PointIconStyle;
    strokeWidth = 2;
    strokeDashArray: Array<number> = [];
    strokeColor = BLACK.rgbaCssString();
    fillColor = WHITE.rgbaCssString();

    constructor() {}

    ngOnInit(): void {
        if (this.iconStyle) {
            this.updateStyle();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes) {
            this.updateStyle();
        }
    }

    private updateStyle() {
        this.strokeWidth = this.iconStyle.strokeWidth;
        this.strokeDashArray = this.iconStyle.strokeDashStyle ? this.iconStyle.strokeDashStyle : [];
        this.strokeColor = this.iconStyle.strokeRGBA.rgbaCssString();
        this.fillColor = this.iconStyle.fillRGBA.rgbaCssString();
    }
}
