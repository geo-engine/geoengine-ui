import {ChangeDetectionStrategy, Component} from '@angular/core';
import {LegendComponent} from '../legend.component';
import {SimplePointSymbology, ComplexPointSymbology} from '../../symbology/symbology.model';

@Component({
    selector: 'wave-legendary-points',
    templateUrl: 'legend-point.component.html',
    styleUrls: ['legend-point.component.scss'],
    inputs: ['symbology'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LegendaryPointComponent<S extends SimplePointSymbology> extends LegendComponent<S> {

    isComplexSymbology(): boolean {
        if (this.symbology instanceof ComplexPointSymbology) {
            return true;
        }
        return false;
    }
}
