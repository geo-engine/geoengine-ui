import {Component, EventEmitter, Input, Output} from '@angular/core';
import {SymbologyPointsComponent} from './symbology-points.component';
import {CssStringToRgbaPipe} from '../../../util/pipes/css-string-to-rgba.pipe';
import {MatSliderChange} from '@angular/material';
import {SimpleVectorSymbology} from '../symbology.model';
import {Color, stringToRgbaStruct} from '../../../colors/color';

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

    updateFillRgba(rgbaString: string) {
        if (rgbaString) {
            this.symbology.fillRGBA = Color.fromRgbaLike(stringToRgbaStruct(rgbaString));
            this.update();
        }
    }

    updateStrokeRgba(rgbaString: string) {
        if (rgbaString) {
            this.symbology.strokeRGBA = Color.fromRgbaLike(stringToRgbaStruct(rgbaString));
            this.update();
        }
    }
}
