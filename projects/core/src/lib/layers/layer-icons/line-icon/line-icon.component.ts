import {Component, OnInit, ChangeDetectionStrategy, Input} from '@angular/core';
import {BLACK, Color} from '../../../colors/color';
import {IconStyle} from '../../symbology/symbology.model';

/**
 * A simple interface to specify the style of a line icon.
 */
export interface LineIconStyle extends IconStyle {
    strokeWidth: number;
    // strokeDashStyle: StrokeDashStyle;
    strokeRGBA: Color;
}

/**
 * The line icon component
 */
@Component({
    selector: 'ge-line-icon',
    templateUrl: './line-icon.component.svg',
    styleUrls: ['./line-icon.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LineIconComponent implements OnInit {
    // the style to use for the icon
    @Input()
    iconStyle: LineIconStyle = {
        strokeWidth: 2,
        // strokeDashArray: Array<number> = [];
        strokeRGBA: BLACK,
    };

    constructor() {}

    ngOnInit(): void {}
}
