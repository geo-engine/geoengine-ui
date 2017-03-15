import {Component, Input, OnInit, ChangeDetectionStrategy} from '@angular/core';

import {
    Symbology, SimplePointSymbology, RasterSymbology, SimpleVectorSymbology,
    MappingColorizerRasterSymbology, ClusteredPointSymbology,
} from './symbology.model';

@Component({
    selector: 'wave-legendary',
    template: `
      <span>{{symbology.symbologyTypeId}}</span>
    `,
})
export class LegendaryComponent<S extends Symbology> {
    @Input() symbology: S;
}

@Component({
    selector: 'wave-legendary-points',
    template: `
        <md-list>
            <md-list-item>
                <md-icon md-list-icon svgIcon="symbology:point"
                    [style.stroke-width.px]='symbology.strokeWidth'
                    [style.stroke]='symbology.strokeRGBA | rgbaToCssStringPipe'
                    [style.fill]='symbology.fillRGBA | rgbaToCssStringPipe'
                ></md-icon>
                <span>Points</span>
            </md-list-item>
        </md-list>
        `,
    styles: [`
        wave-legendary-points {
            overflow: hidden;
        }`,
    ],
    inputs: ['symbology'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LegendaryPointComponent<S extends SimplePointSymbology> extends LegendaryComponent<S> {
}

@Component({
    selector: 'wave-legendary-clustered-points',
    template: `
        <md-list>
            <md-list-item>
                <md-icon md-list-icon svgIcon="symbology:point"
                    [style.stroke-width.px]='symbology.strokeWidth'
                    [style.stroke]='symbology.strokeRGBA | rgbaToCssStringPipe'
                    [style.fill]='symbology.fillRGBA | rgbaToCssStringPipe'
                ></md-icon>
                <span>Clustered Points</span>
            </md-list-item>
        </md-list>
        `,
    styles: [`
        wave-legendary-points {
            overflow: hidden;
        }`,
    ],
    inputs: ['symbology'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LegendaryClusteredPointComponent<S extends ClusteredPointSymbology>
    extends LegendaryComponent<S> {}

@Component({
    selector: 'wave-legendary-vector',
    template: `
        <md-list>
            <md-list-item>
                <md-icon md-list-icon svgIcon="symbology:polygon"
                    [style.stroke-width.px]='symbology?.strokeWidth'
                    [style.stroke]='symbology?.strokeRGBA | rgbaToCssStringPipe'
                    [style.fill]='symbology?.fillRGBA | rgbaToCssStringPipe'
                ></md-icon>
                <span>Vectors</span>
            </md-list-item>
        </md-list>
        `,
    inputs: ['symbology'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LegendaryVectorComponent<S extends SimpleVectorSymbology>
    extends LegendaryComponent<S> {}

@Component({
    selector: 'wave-legendary-raster',
    template: `
        <span>opacity: {{symbology.opacity}}</span>
        `,
    styles: [``],
    inputs: ['symbology'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LegendaryRasterComponent<S extends RasterSymbology> extends LegendaryComponent<S> {}

@Component({
    selector: 'wave-legendary-mapping-colorizer-raster',
    template: `
        <div class='legend'>
            <tbody>
                <template [ngIf]='symbology.isUnknown()'>
                    <tr>
                        <td>Interpolation</td><td>{{symbology?.interpolation}}</td>
                    </tr>
                    <tr>
                        <td>Measurement</td><td>{{symbology?.unit?.measurement}}</td>
                    </tr>
                    <tr>
                        <td>Unit</td><td>{{symbology?.unit?.unit}}</td>
                    </tr>                    
                </template>
                <template [ngIf]='!symbology.isUnknown()'>
                    <tr
                        *ngFor='let breakpoint of (symbology.colorizer$ | async)?.breakpoints;
                                let isFirst = first'
                    >
                        <template [ngIf]='symbology.isContinuous()'>
                            <td class='gradient'
                                *ngIf='isFirst'
                                [rowSpan]='(symbology.colorizer$ | async)?.breakpoints.length'
                                [style.background]='symbology.colorizer$ | async | waveWappingColorizerToGradient
                                                    | waveSafeStyle'
                            ></td>
                            <td>{{breakpoint[0]}}</td>
                            <td *ngIf='isFirst'>{{symbology?.unit.unit}}</td>
                        </template>
                        <template [ngIf]='symbology.isDiscrete()'>
                            <td class ='classes'><div
                                class='icon'
                                [style.background-color]='breakpoint[1]'
                            ></div></td>
                            <td>{{symbology?.unit.classes.get(breakpoint[0])}}</td>                        
                        </template>                        
                    </tr>
                </template>
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
    inputs: ['symbology'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LegendaryMappingColorizerRasterComponent<S extends MappingColorizerRasterSymbology>
    extends LegendaryRasterComponent<S> {
}
