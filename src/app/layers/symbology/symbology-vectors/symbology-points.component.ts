import {Component, Input, Output, EventEmitter} from '@angular/core';

import {SimplePointSymbology} from '../symbology.model';
import {CssStringToRgbaPipe} from '../../../util/pipes/css-string-to-rgba.pipe';
import {MatSliderChange} from '@angular/material';
import {LayerService} from '../../layer.service';

@Component({
    selector: 'wave-symbology-points',
    templateUrl: `symbology-points.component.html`,
    styleUrls: [
        './symbology-shared.scss',
        './symbology-points.component.scss'
    ],
})
export class SymbologyPointsComponent {

    static minStrokeWidth = 0;
    static minRadius = 1;

    @Input() editRadius = true;
    @Input() editStrokeWidth = true;
    @Input() symbology: SimplePointSymbology;
    @Output('symbologyChanged') symbologyChanged = new EventEmitter<SimplePointSymbology>();

    private _cssStringToRgbaTransformer = new CssStringToRgbaPipe();

    constructor() {}

    update() {
        // guard against negative values
        if (this.symbology.radius < SymbologyPointsComponent.minRadius) {
            this.symbology.radius = SymbologyPointsComponent.minRadius;
        }
        if (this.symbology.strokeWidth < SymbologyPointsComponent.minStrokeWidth) {
            this.symbology.strokeWidth = SymbologyPointsComponent.minStrokeWidth;
        }

        // return a clone (immutablility)
        this.symbologyChanged.emit(this.symbology.clone());
    }

    updateStrokeWidth(event: MatSliderChange) {
        this.symbology.strokeWidth = event.value;
        this.update();
    }

    updateRadius(event: MatSliderChange) {
        this.symbology.radius = event.value;
        this.update();
    }

    updateFillRgba(rgba: string) {
        if (rgba) {
            this.symbology.fillRGBA = this._cssStringToRgbaTransformer.transform(rgba);
            this.update();
        }
    }

    updateStrokeRgba(rgba: string) {
        if (rgba) {
            this.symbology.strokeRGBA = this._cssStringToRgbaTransformer.transform(rgba);
            this.update();
        }
    }
}
