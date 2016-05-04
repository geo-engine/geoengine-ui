import {Component, ChangeDetectionStrategy, OnInit, Input, Output, EventEmitter} from "angular2/core";
import {MATERIAL_DIRECTIVES} from "ng2-material/all";

import {Symbology, SimplePointSymbology, RasterSymbology, MappingColorizerRasterSymbology} from "../../models/symbology.model";
import {Layer} from "../../models/layer.model";

import {RgbaToCssStringPipe} from "../../pipes/rgba-to-css-string.pipe";


@Component({
    selector: "wave-legendary",
    template: `
    <md-list>
        <md-list-item>
            <div>{{symbology.symbologyTypeId}}</div>
        </md-list-item>
    </md-list>
    `,
    directives: [MATERIAL_DIRECTIVES],
})
export class LegendaryComponent<S extends Symbology> {
    @Input() symbology: S;
}

@Component({
    selector: "wave-legendary-points",
    template: `
        <md-list>
            <md-list-item>
                <i md-icon class="circle" [style.width.px]="symbology.radius*2" [style.height.px]="symbology.radius*2" [style.border-width.px]="symbology.stroke_width" [style.border-color]="symbology.stroke_rgba | rgbaToCssStringPipe" [style.background-color]="symbology.fill_rgba | rgbaToCssStringPipe"></i>
                <p class="md-list-item-text">point</p>
            </md-list-item>
        </md-list>
        `,
    styles: [`
        wave-legendary-points {
            overflow: hidden;
        }
        .circle {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            max-width: 50px;
            max-height: 50px;
            border: 1.5px solid #fff;
            color: white;
        }`
    ],
    directives: [MATERIAL_DIRECTIVES],
    pipes: [RgbaToCssStringPipe],
    // changeDetection: ChangeDetectionStrategy.OnPush
})
export class LegendaryPointComponent<S extends SimplePointSymbology> extends LegendaryComponent<S> {}

@Component({
    selector: "wave-legendary-raster",
    template: `
        <md-list>
            <md-list-item>
                <div class="md-list-item-text">opacity: {{symbology.opacity}}</div>
            </md-list-item>
        </md-list>
        `,
    styles: [``],
    directives: [MATERIAL_DIRECTIVES]
    // changeDetection: ChangeDetectionStrategy.OnPush
})
export class LegendaryRasterComponent<S extends RasterSymbology> extends LegendaryComponent<S> {}

@Component({
    selector: "wave-legendary-mapping-colorizer-raster",
    template: `
        <div class="legend" [ngSwitch]="symbology.interpolation">
            <tbody *ngSwitchWhen="linear">
                <tr *ngFor="#breakpoint of symbology.breakpoints; #isFirst = first">
                    <td class="gradient" *ngIf="isFirst" [rowSpan]="symbology.breakpoints.length" [style.background]="colorsAsCssGradient()"></td>
                    <td>{{breakpoint[0]}}</td>
                    <td>{{breakpoint[2]}}</td>
                </tr>
            </tbody>

            <tbody *ngSwitchDefault>
                <tr *ngFor="#breakpoint of symbology.breakpoints">
                    <td class="icon" [style.background-color]="breakpoint[1]"></td>
                    <td>{{breakpoint[0]}}</td>
                    <td>{{breakpoint[2]}}</td>
                </tr>
            </tbody>
        </div>
        `,
    styles: [`

        .legend {
            margin-top: 2px;
            margin-bottom: 5px;
            display: table;
        }

        td {
            padding: 2px;
        }

        .gradient {
            min-width: 20px;
        }

        .icon {
            margin-bottom: 1px !important;
            margin-top: 1px !important;
            min-height: 20px !important;
            min-width: 20px !important;
        }

        `],
    directives: [MATERIAL_DIRECTIVES]
    // changeDetection: ChangeDetectionStrategy.OnPush
})
export class LegendaryMappingColorizerRasterComponent<S extends MappingColorizerRasterSymbology> extends LegendaryRasterComponent<S> {
    private linear: string = "linear";

    colorsAsCssGradient(): string {

        let elementSizePercent = 100.0 / this.symbology.breakpoints.length;
        let halfElementSizePercent = elementSizePercent / 2.0;
        let colorPercentStr = "";
        for (let i = 0; i < this.symbology.breakpoints.length; i++) {
            colorPercentStr += ", " + this.symbology.breakpoints[i][1] + " " + (i * elementSizePercent + halfElementSizePercent) + "%";
        }

        // console.log(colorPercentStr);
        let cssStr = "linear-gradient(to bottom" + colorPercentStr + ")";
        // console.log(cssStr);
        return cssStr;
    }
}
