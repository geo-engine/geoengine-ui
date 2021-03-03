import {Component, OnInit, ChangeDetectionStrategy, Input, SimpleChanges, OnChanges} from '@angular/core';
import {StrokeDashStyle} from '../../symbology/symbology.model';
import {BLACK, Color} from '../../../colors/color';

/**
 * A simple interface to specify the style of a line icon.
 */
export interface LineIconStyle {
    strokeWidth: number;
    strokeDashStyle: StrokeDashStyle;
    strokeRGBA: Color;
}

/**
 * The line icon component
 */
@Component({
    selector: 'wave-line-icon',
    templateUrl: './line-icon.component.svg',
    styleUrls: ['./line-icon.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LineIconComponent implements OnInit, OnChanges {
    // the style to use for the icon
    @Input()
    iconStyle: LineIconStyle;
    strokeWidth = 2;
    strokeDashArray: Array<number> = [];
    strokeColor = BLACK.rgbaCssString();

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
    }
}
