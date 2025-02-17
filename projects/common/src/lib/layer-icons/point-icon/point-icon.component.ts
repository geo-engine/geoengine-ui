import {Component, ChangeDetectionStrategy, Input} from '@angular/core';
import {IconStyle} from '../../symbology/symbology.model';
import {BLACK, Color, WHITE} from '../../colors/color';

/**
 * A simple interface to specify the style of a point icon
 */
export interface PointIconStyle extends IconStyle {
    strokeWidth: number;
    // strokeDashStyle: StrokeDashStyle;
    strokeRGBA: Color;
    fillRGBA: Color;
}

/**
 * The point icon component
 */
@Component({
    selector: 'geoengine-point-icon',
    templateUrl: './point-icon.component.svg',
    styleUrls: ['./point-icon.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class PointIconComponent {
    // the style to use for the icon
    @Input()
    iconStyle: PointIconStyle = {
        strokeWidth: 2,
        // strokeDashArray: Array<number> = [];
        strokeRGBA: BLACK,
        fillRGBA: WHITE,
    };
}
