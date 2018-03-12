import {Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy} from '@angular/core';

import {MappingColorizerRasterSymbology, MappingRasterColorizer} from '../symbology.model';
import {MatSliderChange} from '@angular/material';
import {FormBuilder, FormGroup} from '@angular/forms';


@Component({
    selector: 'wave-symbology-raster-mapping-colorizer',
    templateUrl: 'symbology-raster-mapping-colorizer.component.html',
    styleUrls: ['symbology-raster-mapping-colorizer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SymbologyRasterMappingColorizerComponent {

    @Input() symbology: MappingColorizerRasterSymbology;

    @Output('symbologyChanged') symbologyChanged: EventEmitter<MappingColorizerRasterSymbology> =
        new EventEmitter<MappingColorizerRasterSymbology>();

    constructor(private formBuilder: FormBuilder) {}

    updateOpacity(event: MatSliderChange) {
        this.symbology.opacity = (!event.value || event.value === 0) ? 0 : event.value / 100;
        this.update();
    }

    updateColorizer(event: MappingRasterColorizer) {
        this.symbology.colorizer = event;
        this.update();
    }

    update() {
        this.symbologyChanged.emit(this.symbology.clone());
    }
}
