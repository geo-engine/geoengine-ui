import {ChangeDetectionStrategy, Component} from '@angular/core';
import {LegendComponent} from '../legend.component';
import {ComplexPointSymbology} from '../../symbology/symbology.model';

@Component({
    selector: 'wave-point-legend',
    templateUrl: 'point-legend.component.html',
    styleUrls: ['point-legend.component.scss'],
    inputs: ['symbology'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PointLegendComponent<S extends ComplexPointSymbology> extends LegendComponent<S> {
}
