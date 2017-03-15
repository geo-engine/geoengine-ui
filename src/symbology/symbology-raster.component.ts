import {Component, Input, Output, EventEmitter} from '@angular/core';

import {RasterSymbology} from './symbology.model';

@Component({
    selector: 'wave-symbology-raster',
    template: `
    <table>
        <tr>
            <td><label>Opacity</label></td>
            <td>
            <md-input-container>
                <input mdInput [(ngModel)]='symbology.opacity' (ngModelChange)='update()'>
                </md-input-container>
            </td>
        </tr>

        <tr>
            <td><label>Hue</label></td>
            <td>
            <md-input-container>
                <input mdInput disabled
                    type='number'
                    [(ngModel)]='symbology.hue'
                    (ngModelChange)='update()'>
                    </md-input-container>                
            </td>
        </tr>
        <tr>
            <td><label>Saturation</label></td>
            <td>
            <md-input-container>
                <input mdInput disabled
                    type='number'
                    [(ngModel)]='symbology.saturation'
                    (ngModelChange)='update()'>
                </md-input-container>
            </td>
        </tr>
    </table>
      `,
    styles: [`
        form {
            padding-top: 16px;
        }
        `],
})
export class SymbologyRasterComponent  {
    @Input() symbology: RasterSymbology;
    @Output('symbologyChanged') symbologyChanged: EventEmitter<RasterSymbology> =
        new EventEmitter<RasterSymbology>();

    update() {
        this.symbologyChanged.emit(this.symbology.clone());
    }
}
