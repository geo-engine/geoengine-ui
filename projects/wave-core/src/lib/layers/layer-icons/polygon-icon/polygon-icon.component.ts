import {Component, OnInit, ChangeDetectionStrategy, Input, SimpleChanges, OnChanges} from '@angular/core';
import {StrokeDashStyle} from '../../symbology/symbology.model';
import {BLACK, Color, WHITE} from '../../../colors/color';

export interface PolygonIconStyle {
    strokeWidth: number;
    strokeDashStyle: StrokeDashStyle;
    strokeRGBA: Color;
    fillRGBA: Color;
}

@Component({
    selector: 'wave-polygon-icon',
    templateUrl: './polygon-icon.component.svg',
    styleUrls: ['./polygon-icon.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PolygonIconComponent implements OnInit, OnChanges {

    @Input()
    iconStyle: PolygonIconStyle;

    strokeWidth = 2;
    strokeDashArray: Array<number> = [];
    strokeColor = BLACK.rgbaCssString();
    fillColor = WHITE.rgbaCssString();

    constructor() {
    }

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
