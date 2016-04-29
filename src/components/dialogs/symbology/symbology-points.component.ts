import {Component, ChangeDetectionStrategy, OnInit, Input, Output, EventEmitter} from "angular2/core";
import {MATERIAL_DIRECTIVES} from "ng2-material/all";

import {Symbology, SimplePointSymbology} from "../../../models/symbology.model";
import {Layer} from "../../../models/layer.model";


@Component({
    selector: "wave-symbology-points",
    template: `
    <md-input-container class="md-block" flex-gt-sm>
        <label>Fill color</label>
        <input md-input [style.background-color]="symbology.fill_color" [(value)]="symbology.fill_color" (valueChange)="update()">
    </md-input-container>
    <md-input-container class="md-block" flex-gt-sm>
        <label>Stroke color</label>
        <input md-input [style.background-color]="symbology.stroke_color" [(value)]="symbology.stroke_color" (valueChange)="update()">
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
    directives: [MATERIAL_DIRECTIVES]
    // changeDetection: ChangeDetectionStrategy.OnPush
})
export class SymbologyPointsComponent implements OnInit {
    // @Input() layer: Layer;
    @Input() symbology: SimplePointSymbology;

    @Output("symbologyChanged") symbologyChangedEmitter: EventEmitter<SimplePointSymbology> = new EventEmitter<SimplePointSymbology>();

    update() {
        console.log("wave-symbology-points", "update", this.symbology);
        this.symbologyChangedEmitter.emit(this.symbology.clone());
    }

    ngOnInit() {
        console.log("wave-symbology-points", this.symbology);
    }
}
