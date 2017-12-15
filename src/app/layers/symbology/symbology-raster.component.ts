import {Component, Input, Output, EventEmitter} from '@angular/core';

import {RasterSymbology} from './symbology.model';
import {MatSliderChange} from "@angular/material";

@Component({
    selector: 'wave-symbology-raster',
    template: `
    <table>
        <tr>
            <td><span>Opacity</span></td>
            <td>
                    <mat-slider #slo thumbLabel min="1" max="100" step="1" [value]="symbology?.opacity*100"
                        (change)="updateOpacity($event)">
                    </mat-slider>
            </td>
            <td>{{slo.displayValue}} %</td>
        </tr>
        <!--
        <tr>
            <td><span>Hue</span></td>
            <td>
                <mat-slider #slh thumbLabel min="0" max="100" step="1" value="100" [disabled]="true"></mat-slider>
                <span>{{slh.displayValue}} %</span>
            </td>
        </tr>
        <tr>
            <td><span>Saturation</span></td>
            <td>
                <mat-slider #sls thumbLabel min="0" max="10" step="1" value="100" [disabled]="true"></mat-slider>
                <span>{{sls.displayValue}} %</span>
            </td>
        </tr>
        -->
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
        
        td:first-child, td:last-child {
            width: 1%;
            white-space: nowrap;
        }
        
        mat-slider {
            min-width: unset;
            width: 100%;
        }
        `],
})
export class SymbologyRasterComponent  {
    @Input() symbology: RasterSymbology;
    @Output('symbologyChanged') symbologyChanged: EventEmitter<RasterSymbology> =
        new EventEmitter<RasterSymbology>();

    updateOpacity(event: MatSliderChange){
        this.symbology.opacity = (!event.value || event.value === 0) ? 0 : event.value / 100;
        this.update();
    }

    update() {
        this.symbologyChanged.emit(this.symbology.clone());
    }
}
