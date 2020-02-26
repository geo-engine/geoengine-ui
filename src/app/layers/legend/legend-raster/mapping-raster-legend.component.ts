import {ChangeDetectionStrategy, Component} from '@angular/core';
import {MappingColorizerRasterSymbology} from '../../symbology/symbology.model';
import {RasterLegendComponent} from './raster-legend.component';
import {Interpolation, interpolationToName, Unit} from '../../../operators/unit.model';

@Component({
    selector: 'wave-mapping-raster-legend',
    templateUrl: 'mapping-raster-legend.component.html',
    styleUrls: ['mapping-raster-legend.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MappingRasterLegendComponent<S extends MappingColorizerRasterSymbology>
    extends RasterLegendComponent<S> {

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
}
