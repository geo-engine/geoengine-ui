import {Component, ChangeDetectionStrategy, OnInit, Input, Output, EventEmitter} from "angular2/core";
import {MATERIAL_DIRECTIVES} from "ng2-material/all";

import {Symbology, SimplePointSymbology} from "../../models/symbology.model";
import {Layer} from "../../models/layer.model";

import {RgbaToCssStringPipe} from "../../pipes/rgba-to-css-string.pipe";


@Component({
    selector: "wave-legendary-points",
    template: `
        <md-list>
            <md-list-item>
                <i md-icon class="circle" [style.width.px]="symbology.radius*2" [style.height.px]="symbology.radius*2" [style.border-width.px]="symbology.stroke_width" [style.border-color]="symbology.stroke_rgba | rgbaToCssStringPipe" [style.background-color]="symbology.fill_rgba | rgbaToCssStringPipe"></i>
                <div>point</div>
            </md-list-item>
        </md-list>
        `,
    styles: [`
        .wave-legendary-points {
            overflow: hidden;
        }
        .circle {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            max-width: 50%;
            max-height: 100%;
            border: 1.5px solid #fff;
            color: white;
        }`
    ],
    directives: [MATERIAL_DIRECTIVES],
    pipes: [RgbaToCssStringPipe],
    // changeDetection: ChangeDetectionStrategy.OnPush
})
export class LegendaryPointComponent {
    @Input() symbology: SimplePointSymbology;
}
