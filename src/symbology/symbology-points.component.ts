import {Component, Input, Output, EventEmitter} from '@angular/core';
import {MATERIAL_DIRECTIVES} from 'ng2-material';
import {MD_INPUT_DIRECTIVES} from '@angular2-material/input';

import {ColorPickerDirective} from 'ct-angular2-color-picker/component';

import {SimplePointSymbology, SimpleVectorSymbology} from './symbology.model';

import {RgbaToCssStringPipe} from '../pipes/rgba-to-css-string.pipe';
import {CssStringToRgbaPipe} from '../pipes/css-string-to-rgba.pipe';

@Component({
    selector: 'wave-symbology-points',
    template: `
        <form class='md-block'>
        <div>
            <label>Fill color</label>
            <md-input
                [colorPicker]='symbology.fill_rgba | rgbaToCssStringPipe'
                (colorPickerChange)='updateFillRgba($event)'
                [style.background-color]='symbology.fill_rgba | rgbaToCssStringPipe'
                [ngModel]='symbology.fill_rgba | rgbaToCssStringPipe'
                (ngModelChange)='updateFillRgba($event)'>
            </md-input>
        </div>
        <div>
            <label>Stroke color</label>
            <md-input
                [colorPicker]='symbology.stroke_rgba | rgbaToCssStringPipe'
                (colorPickerChange)='updateStrokeRgba($event)'
                [cpOutputFormat]="'rgba'"
                [style.background-color]='symbology.stroke_rgba | rgbaToCssStringPipe'
                [ngModel]='symbology.stroke_rgba | rgbaToCssStringPipe'
                (ngModelChange)='updateStrokeRgba($event)'>
            </md-input>
        </div>
        <div>
            <label>Stroke width</label>
            <md-input type='number'
                min=0
                [(ngModel)]='symbology.stroke_width'
                (ngModelChange)='update()'>
            </md-input>
        </div>
        <div>
            <label>Radius</label>
            <md-input type='number'
                min=0
                [(ngModel)]='symbology.radius'
                (ngModelChange)='update()'>
            </md-input>
        </div>
        </form>
        `,
    directives: [MATERIAL_DIRECTIVES, MD_INPUT_DIRECTIVES, ColorPickerDirective],
    pipes: [RgbaToCssStringPipe, CssStringToRgbaPipe],
    // changeDetection: ChangeDetectionStrategy.OnPush
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
        <template [ngIf]='symbology.describesArea'>
        <div>
            <label>Fill color</label>
            <md-input
                [colorPicker]='symbology.fill_rgba | rgbaToCssStringPipe'
                (colorPickerChange)='updateFillRgba($event)'
                [style.background-color]='symbology.fill_rgba | rgbaToCssStringPipe'
                [ngModel]='symbology.fill_rgba | rgbaToCssStringPipe'
                (ngModelChange)='updateFillRgba($event)'>
            </md-input>
        </div>
        </template>
        <div>
            <label>Stroke color</label>
            <md-input
                [colorPicker]='symbology.stroke_rgba | rgbaToCssStringPipe'
                (colorPickerChange)='updateStrokeRgba($event)'
                [cpOutputFormat]="'rgba'"
                [style.background-color]='symbology.stroke_rgba | rgbaToCssStringPipe'
                [ngModel]='symbology.stroke_rgba | rgbaToCssStringPipe'
                (ngModelChange)='updateStrokeRgba($event)'>
            </md-input>
        </div>
        <div>
        <label>Stroke width</label>
        <md-input type='number'
            min=0
            [(ngModel)]='symbology.stroke_width'
            (ngModelChange)='update()'>
        </md-input>
        </div>
    </form>
     `,
    styles: [``],
    directives: [MATERIAL_DIRECTIVES, MD_INPUT_DIRECTIVES, ColorPickerDirective],
    pipes: [RgbaToCssStringPipe, CssStringToRgbaPipe],
    // changeDetection: ChangeDetectionStrategy.OnPush
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
