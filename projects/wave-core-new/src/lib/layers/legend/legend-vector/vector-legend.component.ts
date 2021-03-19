import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {Symbology, SymbologyType} from '../../symbology/symbology.model';

import {PolygonIconStyle} from '../../layer-icons/polygon-icon/polygon-icon.component';
import {PointIconStyle} from '../../layer-icons/point-icon/point-icon.component';
import {LineIconStyle} from '../../layer-icons/line-icon/line-icon.component';

interface IconValue {
    icon: PointIconStyle | LineIconStyle | PolygonIconStyle;
    value: string | number;
}

@Component({
    selector: 'wave-vector-legend',
    templateUrl: 'vector-legend-component.html',
    styleUrls: ['vector-legend.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VectorLegendComponent {
    readonly ST = SymbologyType;
    @Input()
    showDefaultStyle = true;

    @Input()
    symbology: Symbology;
    fillColorAttribute: string | undefined;
    fillStyles: Array<IconValue> = [];
    strokeColorAttribute: string | undefined;
    strokeStyles: Array<IconValue> = [];

    constructor() {}
}
