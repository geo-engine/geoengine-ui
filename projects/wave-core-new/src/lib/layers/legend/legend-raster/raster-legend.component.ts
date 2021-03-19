import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {Measurement} from '../../measurement';
import {RasterSymbology} from '../../symbology/symbology.model';
import {LegendComponent} from '../legend.component';

@Component({
    selector: 'wave-legend-raster',
    template: ` <span>This is a generic raster layer</span> `,
    styleUrls: [],
    // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
    inputs: ['symbology'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RasterLegendComponent extends LegendComponent {}
