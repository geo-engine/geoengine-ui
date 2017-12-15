import {Component, Input, Output, EventEmitter} from '@angular/core';

import {SimplePointSymbology, SimpleVectorSymbology} from './symbology.model';
import {CssStringToRgbaPipe} from '../../util/pipes/css-string-to-rgba.pipe';
import {MatSliderChange} from '@angular/material';
import {LayerService} from '../layer.service';

@Component({
    selector: 'wave-symbology-points',
    template: `
        <table>
            <tr>
                <td>
                    <span>Fill</span>
                </td>
                <td class="color_cell" [style.background-color]='symbology.fillRGBA | rgbaToCssStringPipe'
                 [colorPicker]='symbology.fillRGBA | rgbaToCssStringPipe'
                 (colorPickerChange)='updateFillRgba($event)'
                 [cpSaveClickOutside]="false"
                 [cpOKButton]="true"
                 [cpOutputFormat]="'rgba'">
                    {{symbology.fillRGBA}}
                </td>
            </tr>
            <tr>
                <td>
                    <span>Stroke</span>
                </td>
                <td class="color_cell"
                    [style.background-color]='symbology.strokeRGBA | rgbaToCssStringPipe'
                    [colorPicker]='symbology.strokeRGBA | rgbaToCssStringPipe'
                    (colorPickerChange)='updateStrokeRgba($event)'
                    [cpSaveClickOutside]="false"
                    [cpOKButton]="true"
                    [cpOutputFormat]="'rgba'">
                    {{symbology.strokeRGBA}}                    
                </td>
            </tr>
            <tr *ngIf="editStrokeWidth">
                <td>                    
                </td>
                <td>
                    <mat-slider #sls thumbLabel min="0" max="10" step="1" [value]="symbology.strokeWidth"
                        (change)="updateStrokeWidth($event)">
                    </mat-slider>
                    <span>{{sls.displayValue}} px</span>
                </td>
            </tr>
            <tr *ngIf="editRadius">
                <td>
                    <span>Radius</span>
                </td>
                <td>
                    <mat-slider #slr thumbLabel min="0" max="10" step="1" [value]="symbology.radius"
                        (change)="updateRadius($event)">
                    </mat-slider>
                    <span>{{slr.displayValue}} px</span>
                </td>
            </tr>
        </table>
        `,
    styleUrls: [
        './symbology-points.component.scss'
    ],
})
export class SymbologyPointsComponent {

    static minStrokeWidth: number = 0;
    static minRadius: number = 1;

    @Input() editRadius: boolean = true;
    @Input() editStrokeWidth: boolean = true;
    @Input() symbology: SimplePointSymbology;
    @Output('symbologyChanged') symbologyChanged = new EventEmitter<SimplePointSymbology>();

    private _cssStringToRgbaTransformer = new CssStringToRgbaPipe();

    constructor(private layerService: LayerService) {}

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

@Component({
    selector: 'wave-symbology-vector',
    template: `
        <table>
            <tr *ngIf="symbology.describesArea()">
                <td>
                    <span>Fill</span>
                </td>
                <td class="color_cell" [style.background-color]='symbology.fillRGBA | rgbaToCssStringPipe'
                    [colorPicker]='symbology.fillRGBA | rgbaToCssStringPipe'
                    (colorPickerChange)='updateFillRgba($event)'
                    [cpSaveClickOutside]="false"
                    [cpOKButton]="true"
                    [cpOutputFormat]="'rgba'">
                    {{symbology.fillRGBA}}
                </td>
            </tr>
            <tr>
                <td>
                    <span>Stroke</span>
                </td>
                <td class="color_cell" [style.background-color]='symbology.strokeRGBA | rgbaToCssStringPipe'
                    [colorPicker]='symbology.strokeRGBA | rgbaToCssStringPipe'
                    (colorPickerChange)='updateStrokeRgba($event)'
                    [cpSaveClickOutside]="false"
                    [cpOKButton]="true"
                    [cpOutputFormat]="'rgba'">
                    {{symbology.strokeRGBA}}                    
                </td>
            </tr>
            <tr>
                <td>                    
                </td>
                <td>
                    <mat-slider #sls thumbLabel min="0" max="10" step="1" [value]="symbology.strokeWidth"
                        (change)="updateStrokeWidth($event)">
                    </mat-slider>
                    <span>{{sls.displayValue}} px</span>
                </td>
            </tr>
        </table>
     `,
    styleUrls: [
        './symbology-points.component.scss'
    ]
})
export class SymbologyVectorComponent {

    static minStrokeWidth: number = 0;

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
