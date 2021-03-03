import {Component, Input} from '@angular/core';

import {AbstractSymbology} from '../symbology/symbology.model';

/**
 * A simple legend component.
 */
@Component({
    selector: 'wave-legendary',
    templateUrl: 'legend.component.html',
})
export class LegendComponent<S extends AbstractSymbology> {
    @Input() symbology: S;
}
