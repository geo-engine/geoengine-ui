import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {MATERIAL_DIRECTIVES} from 'ng2-material';

import {SimplePointSymbology, SimpleVectorSymbology} from './symbology.model';

import {RgbaToCssStringPipe} from '../pipes/rgba-to-css-string.pipe';
import {CssStringToRgbaPipe} from '../pipes/css-string-to-rgba.pipe';

@Component({
    selector: 'wave-symbology-points',
    template: `
    <md-input-container class='md-block' flex-gt-sm>
        <label>Fill color</label>
        <input md-input
            [style.background-color]='symbology.fill_rgba | rgbaToCssStringPipe'
            [value]='symbology.fill_rgba | rgbaToCssStringPipe'
            (valueChange)='updateFillRgba($event)'>
    </md-input-container>
    <md-input-container class='md-block' flex-gt-sm>
        <label>Stroke color</label>
        <input md-input
            [style.background-color]='symbology.stroke_rgba | rgbaToCssStringPipe'
            [value]='symbology.stroke_rgba | rgbaToCssStringPipe'
            (valueChange)='updateStrokeRgba($event)'>
    </md-input-container>
    <md-input-container class='md-block' flex-gt-sm>
        <label>Stroke width</label>
        <input md-input type='number'
            [(value)]='symbology.stroke_width'
            (valueChange)='update()'>
     </md-input-container>
     <md-input-container class='md-block' flex-gt-sm>
         <label>Radius</label>
         <input md-input type='number'
            [(value)]='symbology.radius'
            (valueChange)='update()'>
      </md-input-container>`,
    styles: [``],
    directives: [MATERIAL_DIRECTIVES],
    pipes: [RgbaToCssStringPipe, CssStringToRgbaPipe],
    // changeDetection: ChangeDetectionStrategy.OnPush
})
export class SymbologyPointsComponent implements OnInit {

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
        if (this.symbology.stroke_width < SymbologyPointsComponent.minStrokeWidth) {
            this.symbology.stroke_width = SymbologyPointsComponent.minStrokeWidth;
        }

        // return a clone (immutablility)
        this.symbologyChanged.emit(this.symbology.clone());
    }

    updateFillRgba(rgba: string) {
        this.symbology.fill_rgba = this._cssStringToRgbaTransformer.transform(rgba); // TODO: replace when colorpicker is ready
        this.update();
    }

    updateStrokeRgba(rgba: string) {
        this.symbology.stroke_rgba = this._cssStringToRgbaTransformer.transform(rgba); // TODO: replace when colorpicker is ready
        this.update();
    }

    ngOnInit() {
        // console.log('wave-symbology-points', this.symbology);
    }
}

@Component({
    selector: 'wave-symbology-vector',
    template: `
    <md-input-container class='md-block' flex-gt-sm>
        <label>Fill color</label>
        <input md-input
            [style.background-color]='symbology.fill_rgba | rgbaToCssStringPipe'
            [value]='symbology.fill_rgba | rgbaToCssStringPipe'
            (valueChange)='updateFillRgba($event)'>
    </md-input-container>
    <md-input-container class='md-block' flex-gt-sm>
        <label>Stroke color</label>
        <input md-input
            [style.background-color]='symbology.stroke_rgba | rgbaToCssStringPipe'
            [value]='symbology.stroke_rgba | rgbaToCssStringPipe'
            (valueChange)='updateStrokeRgba($event)'>
    </md-input-container>
    <md-input-container class='md-block' flex-gt-sm>
        <label>Stroke width</label>
        <input md-input type='number' [(value)]='symbology.stroke_width' (valueChange)='update()'>
     </md-input-container>
     `,
    styles: [``],
    directives: [MATERIAL_DIRECTIVES],
    pipes: [RgbaToCssStringPipe, CssStringToRgbaPipe],
    // changeDetection: ChangeDetectionStrategy.OnPush
})
export class SymbologyVectorComponent {

    static minStrokeWidth: number = 1;

    // @Input() layer: Layer;
    @Input() symbology: SimpleVectorSymbology;
    @Output('symbologyChanged') symbologyChanged = new EventEmitter<SimpleVectorSymbology>();

    private _cssStringToRgbaTransformer = new CssStringToRgbaPipe();

    update() {
        // console.log('wave-symbology-points', 'update', this.symbology);

        // guard against negative values
        if (this.symbology.stroke_width < SymbologyPointsComponent.minStrokeWidth) {
            this.symbology.stroke_width = SymbologyPointsComponent.minStrokeWidth;
        }

        // return a clone (immutablility)
        this.symbologyChanged.emit(this.symbology.clone());
    }

    updateFillRgba(rgba: string) {
        this.symbology.fill_rgba = this._cssStringToRgbaTransformer.transform(rgba); // TODO: replace when colorpicker is ready
        this.update();
    }

    updateStrokeRgba(rgba: string) {
        this.symbology.stroke_rgba = this._cssStringToRgbaTransformer.transform(rgba); // TODO: replace when colorpicker is ready
        this.update();
    }
}
