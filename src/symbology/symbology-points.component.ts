import {Component, Input, Output, EventEmitter} from '@angular/core';

import {SimplePointSymbology, SimpleVectorSymbology} from './symbology.model';
import {CssStringToRgbaPipe} from '../pipes/css-string-to-rgba.pipe';

@Component({
    selector: 'wave-symbology-points',
    template: `
        <form class='md-block'>
        <table>
            <tr>
                <td>
                    <label>Fill color</label>
                </td>
                <td>
                    <input mdInput
                        class='cc'
                        [style.background-color]='symbology.fillRGBA | rgbaToCssStringPipe'
                        [ngModel]='symbology.fillRGBA | rgbaToCssStringPipe'
                        (ngModelChange)='updateFillRgba($event)'>
                </td>
            </tr>
            <tr>
                <td>
                    <label>Stroke color</label>
                </td>
                <td>
                    <input mdInput
                        class='cc'
                        [style.background-color]='symbology.strokeRGBA | rgbaToCssStringPipe'
                        [ngModel]='symbology.strokeRGBA | rgbaToCssStringPipe'
                        (ngModelChange)='updateStrokeRgba($event)'>
                    
                </td>
            </tr>
            <tr>
                <td>
                    <label>Stroke width</label>
                </td>
                <td>
                    <input mdInput type='number' min='0'
                        [(ngModel)]='symbology.strokeWidth'
                        (ngModelChange)='update()'>
                    
                </td>
            </tr>
            <tr>
                <td><label>Radius</label></td>
                <td>
                    <input mdInput type='number' min='0'
                        [(ngModel)]='symbology.radius'
                        (ngModelChange)='update()'>
                    
                </td>
            </tr>
        </table>
        </form>
        `,
    styles: [`
        form {
            padding-top: 16px;
        }
        md-input >>> input {
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

    // @Input() layer: Layer;
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
    <form>
        <table>
            <template [ngIf]='symbology.describesArea()'>
            <tr>
                <td>
                    <label>Fill color</label>
                </td>
                <td>
                    <input md-input
                        class='cc'
                        [style.background-color]='symbology.fillRGBA | rgbaToCssStringPipe'
                        [ngModel]='symbology.fillRGBA | rgbaToCssStringPipe'
                        (ngModelChange)='updateFillRgba($event)'>
                    
                </td>
            </tr>
            </template>
            <tr>
                <td>
                    <label>Stroke color</label>
                </td>
                <td>
                    <input md-input
                        class='cc'
                        [style.background-color]='symbology.strokeRGBA | rgbaToCssStringPipe'
                        [ngModel]='symbology.strokeRGBA | rgbaToCssStringPipe'
                        (ngModelChange)='updateStrokeRgba($event)'>
                    
                </td>
            </tr>
            <tr>
                <td>
                    <label>Stroke width</label>
                </td>
                <td>
                    <input mdInput type='number' min='0'
                        [(ngModel)]='symbology.strokeWidth'
                        (ngModelChange)='update()'>
                    
                </td>
            </tr>
        </table>
    </form>
     `,
    styles: [`
        .mat-input >>> input {
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
