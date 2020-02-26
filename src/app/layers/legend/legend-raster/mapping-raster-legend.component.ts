import {ChangeDetectionStrategy, Component, OnChanges, SimpleChanges} from '@angular/core';
import {MappingColorizerRasterSymbology} from '../../symbology/symbology.model';
import {RasterLegendComponent} from './raster-legend.component';
import {Interpolation, interpolationToName, Unit} from '../../../operators/unit.model';
import {ColorBreakpoint} from '../../../colors/color-breakpoint.model';

@Component({
    selector: 'wave-mapping-raster-legend',
    templateUrl: 'mapping-raster-legend.component.html',
    styleUrls: ['mapping-raster-legend.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MappingRasterLegendComponent<S extends MappingColorizerRasterSymbology>
    extends RasterLegendComponent<S> implements OnChanges {

    numberPipeParameters = '1.0-0';

    unitToString(unit: Unit): string {
        if (unit instanceof Unit && unit.unit !== Unit.defaultUnit.unit) {
            return unit.unit;
        } else {
            return '';
        }
    }

    interpolationToName(interpolation: Interpolation): string {
        return interpolationToName(interpolation);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.symbology) {
            const symbology = changes.symbology.currentValue as S;
            this.numberPipeParameters = MappingRasterLegendComponent.calculateNumberPipeParameters(symbology.colorizer.breakpoints);
        }
    }

    private static calculateNumberPipeParameters(breakpoints: Array<ColorBreakpoint>): string {
        const firstNumber = (breakpoints[0].value as number).toString(10);
        const lastNumber = (breakpoints[breakpoints.length - 1].value as number).toString(10);
        const decimalPlacesFirst = firstNumber.indexOf('.') >= 0 ? firstNumber.split('.')[1].length : 0;
        const decimalPlacesLast = lastNumber.indexOf('.') >= 0 ? lastNumber.split('.')[1].length : 0;
        const maximumDecimalPlaces = Math.max(decimalPlacesFirst, decimalPlacesLast) + 2;

        return `1.0-${maximumDecimalPlaces}`;
    }
}
