import {Component, OnInit, ChangeDetectionStrategy, Input} from '@angular/core';
import {BLACK, Color, WHITE} from '../../../colors/color';
import {IconStyle} from '../../symbology/symbology.model';

/**
 * A simple interface to specify the style of a polygon icon
 */
export interface PolygonIconStyle extends IconStyle {
    strokeWidth: number;
    // strokeDashStyle: StrokeDashStyle;
    strokeRGBA: Color;
    fillRGBA: Color;
}

/**
 * The polygon icon component
 */
@Component({
    selector: 'wave-polygon-icon',
    templateUrl: './polygon-icon.component.svg',
    styleUrls: ['./polygon-icon.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PolygonIconComponent implements OnInit {
    // the style to use for the icon
    @Input()
    iconStyle: PolygonIconStyle = {
        strokeWidth: 2,
        // strokeDashArray: Array<number> = [];
        strokeRGBA: BLACK,
        fillRGBA: WHITE,
    };

    constructor() {}

    ngOnInit(): void {}
}
