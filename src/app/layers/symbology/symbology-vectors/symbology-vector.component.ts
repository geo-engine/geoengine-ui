import {Component, EventEmitter, Input, Output} from '@angular/core';
import {SymbologyPointsComponent} from './symbology-points.component';
import {CssStringToRgbaPipe} from '../../../util/pipes/css-string-to-rgba.pipe';
import {MatSliderChange} from '@angular/material';
import {SimpleVectorSymbology} from '../symbology.model';

@Component({
    selector: 'wave-symbology-vector',
    templateUrl: 'symbology-vector.component.html',
    styleUrls: [
        './symbology-shared.scss',
        './symbology-vector.component.scss'
    ]
})
export class SymbologyVectorComponent {

    static minStrokeWidth = 0;

    @Input() symbology: SimpleVectorSymbology;
    @Output('symbologyChanged') symbologyChanged = new EventEmitter<SimpleVectorSymbology>();

    private _cssStringToRgbaTransformer = new CssStringToRgbaPipe();

    update() {
        // console.log('wave-symbology-vectors', 'update', this.symbology);

        // guard against negative values
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
