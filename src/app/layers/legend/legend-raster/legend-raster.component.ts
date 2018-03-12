import {ChangeDetectionStrategy, Component} from '@angular/core';
import {LegendComponent} from '../legend.component';
import {RasterSymbology} from '../../symbology/symbology.model';

@Component({
    selector: 'wave-legendary-raster',
    template: `
        <span>This is a generic raster layer</span>
        `,
    styleUrls: [],
    inputs: ['symbology'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LegendaryRasterComponent<S extends RasterSymbology> extends LegendComponent<S> {}
