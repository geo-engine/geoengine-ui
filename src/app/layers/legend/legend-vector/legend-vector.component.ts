import {ChangeDetectionStrategy, Component} from '@angular/core';
import {LegendComponent} from '../legend.component';
import {SimpleVectorSymbology} from '../../symbology/symbology.model';

@Component({
    selector: 'wave-legendary-vector',
    templateUrl: 'legend-vector-component.html',
    inputs: ['symbology'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LegendaryVectorComponent<S extends SimpleVectorSymbology>
    extends LegendComponent<S> {}
