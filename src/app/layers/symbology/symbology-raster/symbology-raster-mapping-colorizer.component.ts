import {Component, Input, Output, EventEmitter, ChangeDetectionStrategy} from '@angular/core';

import {MappingColorizerRasterSymbology} from '../symbology.model';
import {MatSliderChange} from '@angular/material';
import {ColorizerData} from '../../../colors/colorizer-data.model';
import {ColorBreakpoint} from '../../../colors/color-breakpoint.model';

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

    constructor() {}

    updateOpacity(event: MatSliderChange) {
        console.log("updateOpacity");
        this.symbology.opacity = (!event.value || event.value === 0) ? 0 : event.value / 100;
        this.update();
    }

    updateOverflowColor(event: ColorBreakpoint) {
        if (event && !event.equals(this.symbology.overflowColor)) {
            console.log("updateOverflowColor");
            this.symbology.overflowColor = event;
            this.update();
        }
    }

    updateNoDataColor(event: ColorBreakpoint) {
        if (event && !event.equals(this.symbology.noDataColor)) {
            console.log("updateNoDataColor");
            this.symbology.noDataColor = event;
            this.update();
        }
    }

    updateColorizer(event: ColorizerData) {
        console.log("updateColorizer", event, this.symbology.colorizer, !event.equals(this.symbology.colorizer));
        if (event && !event.equals(this.symbology.colorizer)) {
            this.symbology.colorizer = event;
            this.update();
        }
    }

    update() {
        this.symbologyChanged.emit(this.symbology.clone());
    }
}
