import {ChangeDetectionStrategy, Component} from '@angular/core';
import {LegendComponent} from '../legend.component';
import {PointSymbology} from '../../symbology/symbology.model';

@Component({
    selector: 'wave-point-legend',
    templateUrl: 'point-legend.component.html',
    styleUrls: ['point-legend.component.scss'],
    // tslint:disable-next-line:no-inputs-metadata-property
    inputs: ['symbology'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PointLegendComponent<S extends PointSymbology> extends LegendComponent<S> {
}
