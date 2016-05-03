import {Component, ChangeDetectionStrategy, OnInit, Input, Output, EventEmitter} from "angular2/core";
import {MATERIAL_DIRECTIVES} from "ng2-material/all";

import {Symbology, RasterSymbology} from "../../models/symbology.model";
import {Layer} from "../../models/layer.model";

@Component({
    selector: "wave-legendary-raster",
    template: `
        <md-list>
            <md-list-item>
                <div>opacity: {{symbology.opacity}}</div>
            </md-list-item>
        </md-list>
        `,
    styles: [`
        wave-legendary-points {
            overflow: hidden;
        }
        `],
    directives: [MATERIAL_DIRECTIVES]
    // changeDetection: ChangeDetectionStrategy.OnPush
})
export class LegendaryRasterComponent {
    @Input() symbology: RasterSymbology;
}
