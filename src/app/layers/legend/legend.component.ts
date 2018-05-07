import {Component, Input} from '@angular/core';

import {
    Symbology
} from '../symbology/symbology.model';

@Component({
    selector: 'wave-legendary',
    templateUrl: 'legend.component.html',
})
export class LegendComponent<S extends Symbology> {
    @Input() symbology: S;
}

