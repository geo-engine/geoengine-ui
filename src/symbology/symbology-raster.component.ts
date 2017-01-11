import {Component, Input, Output, EventEmitter} from '@angular/core';

import {RasterSymbology} from './symbology.model';

@Component({
    selector: 'wave-symbology-raster',
    template: `
    <form>
    <table>
        <tr>
            <td><label>Opacity</label></td>
            <td>
                <md-input [(ngModel)]='symbology.opacity' (ngModelChange)='update()'>
                </md-input>
            </td>
        </tr>

        <tr>
            <td><label>Hue</label></td>
            <td>
                <md-input disabled
                    type='number'
                    [(ngModel)]='symbology.hue'
                    (ngModelChange)='update()'>
                </md-input>
            </td>
        </tr>
        <tr>
            <td><label>Saturation</label></td>
            <td>
                <md-input disabled
                    type='number'
                    [(ngModel)]='symbology.saturation'
                    (ngModelChange)='update()'>
                </md-input>
            </td>
        </tr>
    </table>
    </form>
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
        // console.log('wave-symbology-raster', 'update', this.symbology);
        this.symbologyChanged.emit(this.symbology.clone());
    }
}
