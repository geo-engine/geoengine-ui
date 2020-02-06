import {ChangeDetectionStrategy, Component} from '@angular/core';
import {LegendComponent} from '../legend.component';
import {AbstractVectorSymbology} from '../../symbology/symbology.model';

@Component({
    selector: 'wave-vector-legend',
    templateUrl: 'vector-legend-component.html',
    styleUrls: ['vector-legend.component.scss'],
    inputs: ['symbology'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class VectorLegendComponent<S extends AbstractVectorSymbology> extends LegendComponent<S> {
}
