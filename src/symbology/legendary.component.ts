import {Component,  Input, OnInit} from 'angular2/core';
import {MATERIAL_DIRECTIVES} from 'ng2-material/all';

import {Symbology, SimplePointSymbology, RasterSymbology, SimpleVectorSymbology,
    MappingColorizerRasterSymbology, MappingColorizer} from './symbology.model';

import {RgbaToCssStringPipe} from '../pipes/rgba-to-css-string.pipe';

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
        <div class='legend' *ngIf='ready' [ngSwitch]='colorizer.interpolation'>
            <tbody *ngSwitchWhen='_linear'>
                <tr *ngFor='#breakpoint of colorizer.breakpoints; #isFirst = first'>
                    <td class='gradient'
                        *ngIf='isFirst'
                        [rowSpan]='colorizer.breakpoints.length'
                        [style.background]='colorsAsCssGradient()'>
                    </td>
                    <td>{{breakpoint[0]}}</td>
                    <td>{{breakpoint[2]}}</td>
                </tr>
            </tbody>

            <tbody *ngSwitchDefault>
                <tr *ngFor='#breakpoint of colorizer.breakpoints'>
                    <td class='icon' [style.background-color]='breakpoint[1]'></td>
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
    directives: [MATERIAL_DIRECTIVES],
    // changeDetection: ChangeDetectionStrategy.OnPush
})
export class LegendaryMappingColorizerRasterComponent<S extends MappingColorizerRasterSymbology>
    extends LegendaryRasterComponent<S> implements OnInit {

    private colorizer: MappingColorizer = {
        interpolation: '',
        breakpoints: [],
    };
    private _linear: string = 'linear';

    get ready(): boolean {
        return (this.colorizer !== undefined);
    }

    colorsAsCssGradient(): string {
        const elementSize = 100.0 / this.colorizer.breakpoints.length;
        const halfElementSize = elementSize / 2.0;
        const breaks = this.colorizer.breakpoints;
        let colorStr = '';
        for (let i = 0; i < this.colorizer.breakpoints.length; i++) {
            colorStr += ', ' + breaks[i][1] + ' ' + (i * elementSize + halfElementSize) + '%';
        }

        let cssStr = 'linear-gradient(to bottom' + colorStr + ')';
        return cssStr;
    }

    ngOnInit() {
        this.symbology.colorizer$.subscribe(x => {
            this.colorizer = x;
        });
    }
}
