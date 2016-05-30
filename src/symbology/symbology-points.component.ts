import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {MATERIAL_DIRECTIVES} from 'ng2-material';
import {MD_INPUT_DIRECTIVES} from '@angular2-material/input';

import {SimplePointSymbology, SimpleVectorSymbology} from './symbology.model';

import {RgbaToCssStringPipe} from '../pipes/rgba-to-css-string.pipe';
import {CssStringToRgbaPipe} from '../pipes/css-string-to-rgba.pipe';

@Component({
    selector: 'wave-symbology-points',
    template: `
        <form class='md-block' flex-gt-sm>
            <label>Fill color</label>
            <md-input
                [style.background-color]='symbology.fill_rgba | rgbaToCssStringPipe'
                [ngModel]='symbology.fill_rgba | rgbaToCssStringPipe'
                (ngModelChange)='updateFillRgba($event)'>
            </md-input>

            <label>Stroke color</label>
            <md-input
                [style.background-color]='symbology.stroke_rgba | rgbaToCssStringPipe'
                [ngModel]='symbology.stroke_rgba | rgbaToCssStringPipe'
                (ngModelChange)='updateStrokeRgba($event)'>
            </md-input>

            <label>Stroke width</label>
            <md-input type='number'
                [(ngModel)]='symbology.stroke_width'
                (ngModelChange)='update()'>
            </md-input>

            <label>Radius</label>
            <md-input type='number'
                [(ngModel)]='symbology.radius'
                (ngModelChange)='update()'>
            </md-input>
        </form>

        `,
    directives: [MATERIAL_DIRECTIVES, MD_INPUT_DIRECTIVES],
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
    <form>
        <template [ngIf]='symbology.describesArea'>
            <label>Fill color</label>
            <md-input
                [style.background-color]='symbology.fill_rgba | rgbaToCssStringPipe'
                [ngModel]='symbology.fill_rgba | rgbaToCssStringPipe'
                (ngModelChange)='updateFillRgba($event)'>
            </md-input>
        </template>

        <label>Stroke color</label>
        <md-input
            [style.background-color]='symbology.stroke_rgba | rgbaToCssStringPipe'
            [ngModel]='symbology.stroke_rgba | rgbaToCssStringPipe'
            (ngModelChange)='updateStrokeRgba($event)'>
        </md-input>

        <label>Stroke width</label>
        <md-input type='number'
            [(ngModel)]='symbology.stroke_width'
            (ngModelChange)='update()'>
        </md-input>
    </form>
     `,
    styles: [``],
    directives: [MATERIAL_DIRECTIVES, MD_INPUT_DIRECTIVES],
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
