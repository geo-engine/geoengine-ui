import {Component, Input, Output, EventEmitter} from '@angular/core';

import {RasterSymbology} from '../symbology.model';
import {MatSliderChange} from '@angular/material';

@Component({
    selector: 'wave-symbology-raster',
    templateUrl: 'symbology-raster.component.html',
    styleUrls: ['symbology-raster.component.scss']
})
export class SymbologyRasterComponent  {
    @Input() symbology: RasterSymbology;
    @Output('symbologyChanged') symbologyChanged: EventEmitter<RasterSymbology> =
        new EventEmitter<RasterSymbology>();

    updateOpacity(event: MatSliderChange) {
        this.symbology.opacity = (!event.value || event.value === 0) ? 0 : event.value / 100;
        this.update();
    }

    update() {
        this.symbologyChanged.emit(this.symbology.clone());
    }
}
