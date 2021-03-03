import {Component, Input, Output, EventEmitter} from '@angular/core';

import {AbstractRasterSymbology} from '../symbology.model';
import {MatSliderChange} from '@angular/material/slider';
import {RasterLayer} from '../../layer.model';

/**
 * A simple raster symbology component.
 */
@Component({
    selector: 'wave-symbology-raster',
    templateUrl: 'symbology-raster.component.html',
    styleUrls: ['symbology-raster.component.scss'],
})
export class SymbologyRasterComponent {
    @Input() layer: RasterLayer;
    @Output() symbologyChanged: EventEmitter<AbstractRasterSymbology> = new EventEmitter<AbstractRasterSymbology>();

    updateOpacity(event: MatSliderChange) {
        this.layer.symbology.opacity = event.value === undefined || event.value === 0 ? 0 : event.value / 100;
        this.update();
    }

    update() {
        this.symbologyChanged.emit(this.layer.symbology.clone());
    }
}
