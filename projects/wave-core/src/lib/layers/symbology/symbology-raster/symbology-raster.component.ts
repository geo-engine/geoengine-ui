import {Component, Input, Output, EventEmitter} from '@angular/core';

import {RasterSymbology} from '../symbology.model';
import {MatSliderChange} from '@angular/material/slider';
import {Layer} from '../../layer.model';

@Component({
    selector: 'wave-symbology-raster',
    templateUrl: 'symbology-raster.component.html',
    styleUrls: ['symbology-raster.component.scss']
})
export class SymbologyRasterComponent {
    @Input() layer: Layer<RasterSymbology>;
    @Output() symbologyChanged: EventEmitter<RasterSymbology> = new EventEmitter<RasterSymbology>();

    updateOpacity(event: MatSliderChange) {
        this.layer.symbology.opacity = (event.value === undefined || event.value === 0) ? 0 : event.value / 100;
        this.update();
    }

    update() {
        this.symbologyChanged.emit(this.layer.symbology.clone());
    }
}
