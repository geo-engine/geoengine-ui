import {ChangeDetectionStrategy, Component} from '@angular/core';
import {LegendComponent} from '../legend.component';
import {ComplexPointSymbology} from '../../symbology/symbology.model';

@Component({
    selector: 'wave-legendary-points',
    templateUrl: 'legend-point.component.html',
    styleUrls: ['legend-point.component.scss'],
    inputs: ['symbology'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LegendaryPointComponent<S extends ComplexPointSymbology> extends LegendComponent<S> {}
