import {Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, SimpleChanges} from '@angular/core';

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
export class SymbologyRasterMappingColorizerComponent implements OnChanges {

    _symbology: MappingColorizerRasterSymbology;

    @Input()
    set symbology(symbology: MappingColorizerRasterSymbology) {
        // console.log('SymbologyRasterMappingColorizerComponent', 'set symbology');
        if (symbology && !symbology.equals(this._symbology)) {
            this._symbology = symbology; // TODO: figure out if this should clone;
            // console.log('SymbologyRasterMappingColorizerComponent', 'set symbology', 'replaced');
        }
    }

    get symbology(): MappingColorizerRasterSymbology {
        return this._symbology;
    }

    @Output('symbologyChanged') symbologyChanged: EventEmitter<MappingColorizerRasterSymbology> =
        new EventEmitter<MappingColorizerRasterSymbology>();

    constructor() {}

    updateOpacity(event: MatSliderChange) {
        // console.log("updateOpacity");
        this.symbology.opacity = (!event.value || event.value === 0) ? 0 : event.value / 100;
        this.update();
    }

    updateOverflowColor(event: ColorBreakpoint) {
        if (event && !event.equals(this.symbology.overflowColor)) {
            // console.log("updateOverflowColor");
            this.symbology.overflowColor = event;
            this.update();
        }
    }

    updateNoDataColor(event: ColorBreakpoint) {
        if (event && !event.equals(this.symbology.noDataColor)) {
            // console.log("updateNoDataColor");
            this.symbology.noDataColor = event;
            this.update();
        }
    }

    updateColorizer(event: ColorizerData) {
        // console.log("updateColorizer", event, this.symbology.colorizer, !event.equals(this.symbology.colorizer));
        if (event && !event.equals(this.symbology.colorizer)) {
            this.symbology.colorizer = event;
            this.update();
        }
    }

    update() {
        this.symbologyChanged.emit(this.symbology.clone());
    }

    ngOnChanges(changes: SimpleChanges): void {
        // this.changeDetectorRef.markForCheck(); // TODO: only markForCheck if there is a change!
        for (let propName in changes) { // tslint:disable-line:forin
            switch (propName) {

                default: // DO NOTHING
                    // console.log('SymbologyRasterMappingColorizerComponent', 'ngOnChanges', 'default: ', propName)

            }
        }
    }
}
