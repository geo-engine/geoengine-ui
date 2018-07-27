import {ChangeDetectionStrategy, Component} from '@angular/core';
import {LegendComponent} from '../legend.component';
import {SimpleVectorSymbology, ComplexVectorSymbology} from '../../symbology/symbology.model';

@Component({
    selector: 'wave-legendary-vector',
    templateUrl: 'legend-vector-component.html',
    styleUrls: ['legend-vector.component.scss'],
    inputs: ['symbology'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LegendaryVectorComponent<S extends SimpleVectorSymbology> extends LegendComponent<S> {

    isComplexSymbology(): boolean {
        if (this.symbology instanceof ComplexVectorSymbology) {
            return true;
        }
        return false;
    }

}
