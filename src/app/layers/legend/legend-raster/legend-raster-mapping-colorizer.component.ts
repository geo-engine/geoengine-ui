import {ChangeDetectionStrategy, Component} from '@angular/core';
import {MappingColorizer, MappingColorizerRasterSymbology} from '../../symbology/symbology.model';
import {LegendaryRasterComponent} from './legend-raster.component';

@Component({
    selector: 'wave-legendary-mapping-colorizer-raster',
    templateUrl: 'legend-raster-mapping-colorizer.component.html',
    styleUrls: ['legend-raster-mapping-colorizer.component.scss'],
    inputs: ['symbology', 'symbologyData'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LegendaryMappingColorizerRasterComponent<S extends MappingColorizerRasterSymbology>
    extends LegendaryRasterComponent<S> {

    symbologyData: MappingColorizer;
}
