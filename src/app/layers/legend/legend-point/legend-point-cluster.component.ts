import {ChangeDetectionStrategy, Component} from '@angular/core';
import {LegendComponent} from '../legend.component';
import {ClusteredPointSymbology} from '../../symbology/symbology.model';

@Component({
    selector: 'wave-legendary-clustered-points',
    templateUrl: 'legend-point-cluster.component.html',
    styleUrls: ['legend-point-cluster.component.scss'],
    inputs: ['symbology'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LegendaryClusteredPointComponent<S extends ClusteredPointSymbology>
    extends LegendComponent<S> {}
