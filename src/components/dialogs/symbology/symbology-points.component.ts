import {Component, ChangeDetectionStrategy, OnInit, Input, Output, EventEmitter} from "angular2/core";
import {MATERIAL_DIRECTIVES} from "ng2-material/all";

import {Symbology, SimplePointSymbology} from "../../../models/symbology.model";
import {Layer} from "../../../models/layer.model";

import {RgbaToCssStringPipe} from "../../../pipes/rgba-to-css-string.pipe";
import {CssStringToRgbaPipe} from "../../../pipes/css-string-to-rgba.pipe";

@Component({
    selector: "wave-symbology-points",
    template: `
    <md-input-container class="md-block" flex-gt-sm>
        <label>Fill color</label>
        <input md-input [style.background-color]="symbology.fill_rgba | rgbaToCssStringPipe" [value]="symbology.fill_rgba | rgbaToCssStringPipe" (valueChange)="updateFillRgba($event)">
    </md-input-container>
    <md-input-container class="md-block" flex-gt-sm>
        <label>Stroke color</label>
        <input md-input [style.background-color]="symbology.stroke_rgba | rgbaToCssStringPipe" [value]="symbology.stroke_rgba | rgbaToCssStringPipe" (valueChange)="updateStrokeRgba($event)">
    </md-input-container>
    <md-input-container class="md-block" flex-gt-sm>
        <label>Stroke width</label>
        <input md-input type="number" [(value)]="symbology.stroke_width" (valueChange)="update()">
     </md-input-container>
     <md-input-container class="md-block" flex-gt-sm>
         <label>Radius</label>
         <input md-input type="number" [(value)]="symbology.radius" (valueChange)="update()">
      </md-input-container>`,
    styles: [``],
    directives: [MATERIAL_DIRECTIVES],
    pipes: [RgbaToCssStringPipe, CssStringToRgbaPipe],
    // changeDetection: ChangeDetectionStrategy.OnPush
})
export class SymbologyPointsComponent implements OnInit {
    // @Input() layer: Layer;
    @Input() symbology: SimplePointSymbology;

    @Output("symbologyChanged") symbologyChangedEmitter: EventEmitter<SimplePointSymbology> = new EventEmitter<SimplePointSymbology>();

    private _cssStringToRgbaTransformer = new CssStringToRgbaPipe();

    update() {
        // console.log("wave-symbology-points", "update", this.symbology);
        this.symbologyChangedEmitter.emit(this.symbology.clone());
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
        // console.log("wave-symbology-points", this.symbology);
    }
}
