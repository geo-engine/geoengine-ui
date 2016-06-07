import {Component,  Input, OnInit} from '@angular/core';
import {MATERIAL_DIRECTIVES} from 'ng2-material';

import {Observable} from 'rxjs/Rx';

import {Symbology, SimplePointSymbology, RasterSymbology, SimpleVectorSymbology,
    MappingColorizerRasterSymbology, MappingColorizer} from './symbology.model';

import {RgbaToCssStringPipe} from '../pipes/rgba-to-css-string.pipe';
import {SafeStylePipe} from '../pipes/safe-style.pipe';

import {MappingColorizerToGradientPipe} from './mapping-colorizer-to-gradient.pipe';

@Component({
    selector: 'wave-legendary',
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
    selector: 'wave-legendary-points',
    template: `
        <md-list>
            <md-list-item>
                <i md-icon class='circle'
                    [style.width.px]='symbology.radius*2'
                    [style.height.px]='symbology.radius*2'
                    [style.border-width.px]='symbology.stroke_width'
                    [style.border-color]='symbology.stroke_rgba | rgbaToCssStringPipe'
                    [style.background-color]='symbology.fill_rgba | rgbaToCssStringPipe'>
                </i>
                <p class='md-list-item-text'></p>
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
        }`,
    ],
    directives: [MATERIAL_DIRECTIVES],
    pipes: [RgbaToCssStringPipe],
    // changeDetection: ChangeDetectionStrategy.OnPush
})
export class LegendaryPointComponent<S extends SimplePointSymbology> extends LegendaryComponent<S> {
}

@Component({
    selector: 'wave-legendary-vector',
    template: `
        <md-list>
            <md-list-item>
                <i md-icon class='vector'
                    [style.border-width.px]='symbology.stroke_width'
                    [style.border-color]='symbology.stroke_rgba | rgbaToCssStringPipe'
                    [style.background-color]='symbology.fill_rgba | rgbaToCssStringPipe'>
                </i>
                <p class='md-list-item-text'></p>
            </md-list-item>
        </md-list>
        `,
    styles: [`
        .vector {
            width: 20px;
            height: 20px;
            max-width: 50px;
            max-height: 50px;
            border: 1.5px solid #fff;
            color: white;
        }`,
    ],
    directives: [MATERIAL_DIRECTIVES],
    pipes: [RgbaToCssStringPipe],
    // changeDetection: ChangeDetectionStrategy.OnPush
})
export class LegendaryVectorComponent<S extends SimpleVectorSymbology>
    extends LegendaryComponent<S> {}

@Component({
    selector: 'wave-legendary-raster',
    template: `
        <md-list>
            <md-list-item>
                <div class='md-list-item-text'>opacity: {{symbology.opacity}}</div>
            </md-list-item>
        </md-list>
        `,
    styles: [``],
    directives: [MATERIAL_DIRECTIVES],
    // changeDetection: ChangeDetectionStrategy.OnPush
})
export class LegendaryRasterComponent<S extends RasterSymbology> extends LegendaryComponent<S> {}

@Component({
    selector: 'wave-legendary-mapping-colorizer-raster',
    template: `
        <div class='legend'>
            <tbody>
                <tr *ngFor='let breakpoint of (colorizer$ | async)?.breakpoints; let isFirst = first'>
                    <template [ngIf]='symbology.isContinuous()'>
                        <td class='gradient'
                            *ngIf='isFirst'
                            [rowSpan]='(colorizer$ | async)?.breakpoints.length'
                            [style.background]='colorizer$ | async | waveWappingColorizerToGradient | waveSafeStyle'>
                        </td>
                        <td>{{breakpoint[0]}}</td>
                    </template>
                    <template [ngIf]='symbology.isDiscrete()'>
                        <td class ='classes'><div class='icon' [style.background-color]='breakpoint[1]'></div></td>
                        <td>{{symbology.unit.classes.get(breakpoint[0])}}</td>
                    </template>
                </tr>
            </tbody>
        </div>
        `,
    styles: [`

        .legend {
            margin-top: 2px;
            margin-bottom: 5px;
            display: table;
            font-size: 13px;
        }
        tr {
            min-height: 20px;
        }

        td {
            padding: 2px;
        }

        .gradient {
            min-width: 20px;
            border: #000 solid 1px;
        }

        .classes {
            vertical-align:top;
        }

        .icon {
            margin-bottom: 1px !important;
            margin-top: 1px !important;
            min-height: 20px !important;
            min-width: 20px !important;
            border: #000 solid 1px;
        }

        `],
    directives: [MATERIAL_DIRECTIVES],
    pipes: [MappingColorizerToGradientPipe, SafeStylePipe],
    // changeDetection: ChangeDetectionStrategy.OnPush
})
export class LegendaryMappingColorizerRasterComponent<S extends MappingColorizerRasterSymbology>
    extends LegendaryRasterComponent<S> implements OnInit {

    private colorizer$: Observable<MappingColorizer>;

    ngOnInit() {
        this.colorizer$ = this.symbology.colorizer$;
    }
}
