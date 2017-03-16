import {Component, Input, Output, EventEmitter} from '@angular/core';

import {SimplePointSymbology, SimpleVectorSymbology} from './symbology.model';
import {CssStringToRgbaPipe} from '../pipes/css-string-to-rgba.pipe';

@Component({
    selector: 'wave-symbology-points',
    template: `
        <table>
            <tr>
                <td>
                    <span>Fill</span>
                </td>
                <td class="color_cell" [style.background-color]='symbology.fillRGBA | rgbaToCssStringPipe'>
                    {{symbology.fillRGBA}}
                </td>
            </tr>
            <tr>
                <td>
                    <span>Stroke</span>
                </td>
                <td class="color_cell" [style.background-color]='symbology.strokeRGBA | rgbaToCssStringPipe'>
                    {{symbology.strokeRGBA}}                    
                </td>
            </tr>
            <tr>
                <td>                    
                </td>
                <td>
                    <md-slider #sls thumbLabel min="0" max="10" step="1" value="1"></md-slider>
                    <span>{{sls.displayValue}} px</span>
                </td>
            </tr>
            <tr *ngIf="editRadius">
                <td>
                    <span>Radius</span>
                </td>
                <td>
                    <md-slider #slr thumbLabel min="0" max="10" step="1" value="1"></md-slider>
                    <span>{{slr.displayValue}} px</span>
                </td>
            </tr>
        </table>
        `,
    styles: [`
        table {
            width: 100%;
            font-size: 0.8em;
        }
    
        .color_cell {
            text-align: center;          
            min-width: 2rem;
            min-height: 2rem;
            color: black !important;
            text-shadow:
            -1px -1px 0 #fff,
            1px -1px 0 #fff,
            -1px 1px 0 #fff,
            1px 1px 0 #fff !important;
        }
        `],
})
export class SymbologyPointsComponent {

    static minStrokeWidth: number = 1;
    static minRadius: number = 1;

    @Input() editRadius: boolean = true;
    @Input() symbology: SimplePointSymbology;
    @Output('symbologyChanged') symbologyChanged = new EventEmitter<SimplePointSymbology>();

    private _cssStringToRgbaTransformer = new CssStringToRgbaPipe();

    update() {
        // console.log('wave-symbology-points', 'update', this.symbology);

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

@Component({
    selector: 'wave-symbology-vector',
    template: `
        <table>
            <tr *ngIf="symbology.describesArea()">
                <td>
                    <span>Fill</span>
                </td>
                <td class="color_cell" [style.background-color]='symbology.fillRGBA | rgbaToCssStringPipe'>
                    {{symbology.fillRGBA}}
                </td>
            </tr>
            <tr>
                <td>
                    <span>Stroke</span>
                </td>
                <td class="color_cell" [style.background-color]='symbology.strokeRGBA | rgbaToCssStringPipe'>
                    {{symbology.strokeRGBA}}                    
                </td>
            </tr>
            <tr>
                <td>                    
                </td>
                <td>
                    <md-slider #sls thumbLabel min="0" max="10" step="1" value="1"></md-slider>
                    <span>{{sls.displayValue}} px</span>
                </td>
            </tr>
        </table>
     `,
    styles: [`
        table {
            width: 100%;
            font-size: 0.8em;
        }
    
        .color_cell {
            text-align: center;          
            min-width: 2rem;
            min-height: 2rem;
            color: black !important;
            text-shadow:
            -1px -1px 0 #fff,
            1px -1px 0 #fff,
            -1px 1px 0 #fff,
            1px 1px 0 #fff !important;
        }
    `],
})
export class SymbologyVectorComponent {

    static minStrokeWidth: number = 1;

    @Input() symbology: SimpleVectorSymbology;
    @Output('symbologyChanged') symbologyChanged = new EventEmitter<SimpleVectorSymbology>();

    private _cssStringToRgbaTransformer = new CssStringToRgbaPipe();

    update() {
        // console.log('wave-symbology-points', 'update', this.symbology);

        // guard against negative values
        if (this.symbology.strokeWidth < SymbologyPointsComponent.minStrokeWidth) {
            this.symbology.strokeWidth = SymbologyPointsComponent.minStrokeWidth;
        }

        // return a clone (immutablility)
        this.symbologyChanged.emit(this.symbology.clone());
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


/* TODO: FIXME:
 [colorPicker]='symbology.fillRGBA | rgbaToCssStringPipe'
 (colorPickerChange)='updateFillRgba($event)'

 [colorPicker]='symbology.strokeRGBA | rgbaToCssStringPipe'
 (colorPickerChange)='updateStrokeRgba($event)'
 [cpOutputFormat]="'rgba'"


 [colorPicker]='symbology.strokeRGBA | rgbaToCssStringPipe'
 (colorPickerChange)='updateStrokeRgba($event)'
 [cpOutputFormat]="'rgba'"

 [colorPicker]='symbology.fillRGBA | rgbaToCssStringPipe'
 (colorPickerChange)='updateFillRgba($event)'
 */
