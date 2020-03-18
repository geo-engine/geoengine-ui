import {ChangeDetectionStrategy, Component} from '@angular/core';
import {LegendComponent} from '../legend.component';
import {RasterSymbology} from '../../symbology/symbology.model';

@Component({
    selector: 'wave-legend-raster',
    template: `
        <span>This is a generic raster layer</span>
    `,
    styleUrls: [],
    inputs: ['symbology'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RasterLegendComponent<S extends RasterSymbology> extends LegendComponent<S> {
}
