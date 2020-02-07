import {ChangeDetectionStrategy, Component} from '@angular/core';
import {MappingColorizerRasterSymbology} from '../../symbology/symbology.model';
import {RasterLegendComponent} from './raster-legend.component';

@Component({
    selector: 'wave-mapping-raster-legend',
    templateUrl: 'mapping-raster-legend.component.html',
    styleUrls: ['mapping-raster-legend.component.scss'],
    inputs: ['symbology', 'symbologyData'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MappingRasterLegendComponent<S extends MappingColorizerRasterSymbology>
    extends RasterLegendComponent<S> {
}
