import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {SymbologyType, VectorSymbology} from '../../symbology/symbology.model';
import {TRANSPARENT} from '../../../colors/color';

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
export class VectorLegendComponent<S extends VectorSymbology> implements OnChanges {
    readonly ST = SymbologyType;

    @Input()
    showDefaultStyle = true;

    @Input()
    symbology: S;
    fillColorAttribute: string | undefined;
    fillStyles: Array<IconValue> = [];
    strokeColorAttribute: string | undefined;
    strokeStyles: Array<IconValue> = [];

    constructor() {
        this.updateStyles();
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.updateStyles();
    }

    private updateStyles() {
        this.fillColorAttribute = this.symbology && this.symbology.fillColorAttribute ? this.symbology.fillColorAttribute : undefined;
        this.fillStyles = VectorLegendComponent.fillColorIconValue(this.symbology);
        this.strokeColorAttribute = this.symbology && this.symbology.strokeColorAttribute ? this.symbology.strokeColorAttribute : undefined;
        this.strokeStyles = VectorLegendComponent.strokeColorIconValue(this.symbology);
    }

    static fillColorIconValue(vectorSymbology: VectorSymbology): Array<IconValue> {
        if (!vectorSymbology || !vectorSymbology.fillColorizer || !vectorSymbology.fillColorizer.breakpoints) {
            return [];
        }

        return vectorSymbology.fillColorizer.breakpoints.map((b) => {
            return {
                icon: {
                    strokeWidth: vectorSymbology.strokeWidth,
                    strokeDashStyle: vectorSymbology.strokeDashStyle ? vectorSymbology.strokeDashStyle : [],
                    strokeRGBA: TRANSPARENT,
                    fillRGBA: b.rgba,
                },
                value: b.value,
            };
        });
    }

    static strokeColorIconValue(vectorSymbology: VectorSymbology): Array<IconValue> {
        if (!vectorSymbology || !vectorSymbology.strokeColorizer || !vectorSymbology.strokeColorizer.breakpoints) {
            return [];
        }

        return vectorSymbology.strokeColorizer.breakpoints.map((b) => {
            return {
                icon: {
                    strokeWidth: vectorSymbology.strokeWidth,
                    strokeDashStyle: vectorSymbology.strokeDashStyle ? vectorSymbology.strokeDashStyle : [],
                    strokeRGBA: b.rgba,
                    fillRGBA: TRANSPARENT,
                },
                value: b.value,
            };
        });
    }
}
