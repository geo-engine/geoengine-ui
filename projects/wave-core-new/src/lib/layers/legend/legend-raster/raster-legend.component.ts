import {ChangeDetectionStrategy, Component} from '@angular/core';
import {LegendComponent} from '../legend.component';
import {AbstractRasterSymbology} from '../../symbology/symbology.model';

@Component({
    selector: 'wave-legend-raster',
    template: `
        <span>This is a generic raster layer</span>
    `,
    styleUrls: [],
    // tslint:disable-next-line:no-inputs-metadata-property
    inputs: ['symbology'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RasterLegendComponent<S extends AbstractRasterSymbology> extends LegendComponent<S> {
}
