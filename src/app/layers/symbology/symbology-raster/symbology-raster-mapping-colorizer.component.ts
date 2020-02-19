import {Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, SimpleChanges, OnInit} from '@angular/core';

import {MappingColorizerRasterSymbology} from '../symbology.model';
import {MatSliderChange} from '@angular/material';
import {ColorizerData} from '../../../colors/colorizer-data.model';
import {ColorBreakpoint} from '../../../colors/color-breakpoint.model';
import {RasterLayer} from '../../layer.model';

@Component({
    selector: 'wave-symbology-raster-mapping-colorizer',
    templateUrl: 'symbology-raster-mapping-colorizer.component.html',
    styleUrls: ['symbology-raster-mapping-colorizer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SymbologyRasterMappingColorizerComponent implements OnChanges, OnInit {

    @Input() layer: RasterLayer<MappingColorizerRasterSymbology>;
    @Output() symbologyChanged: EventEmitter<MappingColorizerRasterSymbology> = new EventEmitter<MappingColorizerRasterSymbology>();

    symbology: MappingColorizerRasterSymbology;

    constructor() {
    }

    updateOpacity(event: MatSliderChange) {
        this.symbology.opacity = (event.value === undefined || event.value === 0) ? 0 : event.value / 100;
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
        if (event && !event.equals(this.symbology.colorizer)) {
            this.symbology.colorizer = event;
            this.update();
        }
    }

    get colorizerMinValue(): number | undefined {
        return this.symbology.colorizer.firstBreakpoint.value as number;
    }

    get colorizerMaxValue(): number | undefined {
        return this.symbology.colorizer.lastBreakpoint.value as number;
    }

    updateSymbologyFromLayer() {
        if (!this.layer || !this.layer.symbology || this.layer.symbology.equals(this.symbology)) {
            return;
        }
        this.symbology = this.layer.symbology;
    }

    update() {
        this.symbologyChanged.emit(this.symbology.clone());
    }

    ngOnChanges(changes: SimpleChanges): void {
        // this.changeDetectorRef.markForCheck(); // TODO: only markForCheck if there is a change!
        for (let propName in changes) { // tslint:disable-line:forin
            switch (propName) {
                case 'layer':
                    this.updateSymbologyFromLayer();
                    break;
                default: // DO NOTHING
                // console.log('SymbologyRasterMappingColorizerComponent', 'ngOnChanges', 'default: ', propName)

            }
        }
    }

    ngOnInit(): void {
        this.updateSymbologyFromLayer();
    }
}
