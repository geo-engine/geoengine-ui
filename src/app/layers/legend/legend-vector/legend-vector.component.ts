import {ChangeDetectionStrategy, Component} from '@angular/core';
import {LegendComponent} from '../legend.component';
import {AbstractVectorSymbology} from '../../symbology/symbology.model';

@Component({
    selector: 'wave-legendary-vector',
    templateUrl: 'legend-vector-component.html',
    styleUrls: ['legend-vector.component.scss'],
    inputs: ['symbology'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LegendaryVectorComponent<S extends AbstractVectorSymbology> extends LegendComponent<S> {}
