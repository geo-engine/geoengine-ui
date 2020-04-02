import {ColorBreakpointDict} from '../color-breakpoint.model';
import {Color} from '../color';
import {ColorizerData} from '../colorizer-data.model';
import {
    colormap_inferno_data,
    colormap_magma_data,
    colormap_plasma_data,
    colormap_viridis_data,
    MPL_COLORMAP_NAMES,
    MplColormapName
} from './mpl-colormaps';
import {coolwarm_data, MORELAND_COLORMAP_NAMES, MorelandColormapName} from './moreland-colormaps';
import {
    colormap_arcon_data,
    colormap_bamako_data,
    colormap_batlow_data,
    colormap_berlin_data,
    colormap_bilbao_data,
    colormap_broc_data,
    colormap_broco_data,
    colormap_buda_data,
    colormap_corc_data,
    colormap_corco_data,
    colormap_davos_data,
    colormap_devon_data,
    colormap_grayc_data,
    colormap_hawaii_data,
    colormap_imola_data,
    colormap_lajolla_data,
    colormap_lapaz_data,
    colormap_lisbon_data,
    colormap_nuuk_data,
    colormap_oleron_data,
    colormap_oslo_data,
    colormap_roma_data,
    colormap_romao_data,
    colormap_tofino_data,
    colormap_tokyo_data,
    colormap_turku_data,
    colormap_vik_data, colormap_viko_data,
    SCIENTIFIC_COLORMAP_NAMES,
    ScientificColormapName
} from './scientific-colormaps/scientific-colormaps';
import {colormap_rainbow_data, GENERIC_COLORMAP_NAMES, GenericColormapName} from './generic-colormaps';

export type ColormapData = Array<[number, number, number]>;
export type ColormapNames = MplColormapName | MorelandColormapName | ScientificColormapName | GenericColormapName;
export const COLORMAP_NAMES: Array<ColormapNames> = [...MPL_COLORMAP_NAMES, ...MORELAND_COLORMAP_NAMES, ...SCIENTIFIC_COLORMAP_NAMES,
    ...GENERIC_COLORMAP_NAMES];

export type ColormapStepScale = 'linear' | 'log' | 'square root' | 'square';

export interface BoundedColormapStepScale {
    stepScaleName: ColormapStepScale;
    requiresValueAbove?: number;
    requiresValueBelow?: number;
}

export const COLORMAP_STEP_SCALES_WITH_BOUNDS: Array<BoundedColormapStepScale> = [
    {stepScaleName: 'linear'},
    {stepScaleName: 'log', requiresValueAbove: 0},
    {stepScaleName: 'square root', requiresValueBelow: 5000},
    {stepScaleName: 'square', requiresValueBelow: 5000}
];

export abstract class Colormap {

    static getColormapForName(colormapName: ColormapNames): ColormapData {

        switch (colormapName) {
            case 'INFERNO':
                return colormap_inferno_data;
            case 'MAGMA':
                return colormap_magma_data;
            case 'PLASMA':
                return colormap_plasma_data;
            case 'VIRIDIS':
                return colormap_viridis_data;
            case 'COOLWARM':
                return coolwarm_data;
            case 'ARCON':
                return colormap_arcon_data;
            case 'BAMAKO':
                return colormap_bamako_data;
            case 'BATLOW':
                return colormap_batlow_data;
            case 'BERLIN':
                return colormap_berlin_data;
            case 'BILBAO':
                return colormap_bilbao_data;
            case 'BROC':
                return colormap_broc_data;
            case 'BROCO':
                return colormap_broco_data;
            case 'BUDA':
                return colormap_buda_data;
            case 'CORC':
                return colormap_corc_data;
            case 'CORCO':
                return colormap_corco_data;
            case 'DAVOS':
                return colormap_davos_data;
            case 'DEVON':
                return colormap_devon_data;
            case 'GRAYC':
                return colormap_grayc_data;
            case 'HAWAII':
                return colormap_hawaii_data;
            case 'IMOLA':
                return colormap_imola_data;
            case 'LAJOLLA':
                return colormap_lajolla_data;
            case 'LAPAZ':
                return colormap_lapaz_data;
            case 'LISBON':
                return colormap_lisbon_data;
            case 'NUUK':
                return colormap_nuuk_data;
            case 'OLERON':
                return colormap_oleron_data;
            case 'OSLO':
                return colormap_oslo_data;
            case 'ROMA':
                return colormap_roma_data;
            case 'ROMAO':
                return colormap_romao_data;
            case 'TOFINO':
                return colormap_tofino_data;
            case 'TOKYO':
                return colormap_tokyo_data;
            case 'TURKU':
                return colormap_turku_data;
            case 'VIK':
                return colormap_vik_data;
            case 'VIKO':
                return colormap_viko_data;
            case 'RAINBOW':
                return colormap_rainbow_data;
        }
    }

    private static calculateStepScales(
        stepScale: ColormapStepScale, stepFractions: Array<number>, min: number, max: number
    ): Array<number> {
        switch (stepScale) {
            case 'linear':
                return Colormap.linearNormInverse(stepFractions, min, max);
            case 'log':
                return Colormap.logNormInverse(stepFractions, min, max);
            case 'square root':
                return Colormap.powerNormInverse(stepFractions, min, max, 0.5);
            case 'square' :
                return Colormap.powerNormInverse(stepFractions, min, max, 2);

        }
    }

    private static colormapColorToRgb(colormapColor: [number, number, number]): [number, number, number] {
        return [colormapColor[0] * 255, colormapColor[1] * 255, colormapColor[2] * 255];
    }

    static createColorizerDataWithName(
        colormapName: ColormapNames,
        min: number, max: number,
        steps: number | undefined = 16,
        stepScale: ColormapStepScale = 'linear',
        reverseColors: boolean = false
    ): ColorizerData {

        let colormap = Colormap.getColormapForName(colormapName);
        if (reverseColors) {
            colormap = [...colormap].reverse(); // use a clone since 'reverse' mutates the original array
        }
        const trueSteps = (steps && steps <= colormap.length) ? steps : colormap.length;
        const colormapStepFractions = Colormap.generateLinearStepFractions(trueSteps);
        const colormapValues = Colormap.calculateStepScales(stepScale, colormapStepFractions, min, max);
        const breakpoints = Colormap.createColormapColorizerBreakpoints(colormap, colormapStepFractions, colormapValues);
        return new ColorizerData({
            breakpoints,
            type: stepScale === 'log' ? 'logarithmic' : 'gradient',
        });
    }

    private static logNormInverse(stepFractions: Array<number>, min: number, max: number): Array<number> {
        return stepFractions.map(x => min * Math.pow((max / min), x));
    }

    private static powerNormInverse(stepFractions: Array<number>, min: number, max: number, gamma: number = 2): Array<number> {
        return stepFractions.map(x => Math.pow(x, 1. / gamma) * (max - min) + min);
    }

    private static linearNormInverse(stepFractions: Array<number>, min: number, max: number): Array<number> {
        return stepFractions.map(x => min + x * (max - min));
    }

    private static createColormapColorizerBreakpoints(
        colormap: ColormapData, colorStepScales: Array<number>, colormapValues: Array<number>
    ): Array<ColorBreakpointDict> {
        if (!colorStepScales || !colormapValues || colorStepScales.length !== colormapValues.length || colorStepScales.length < 2) {
            throw new Error('colormap creation requires colorMapStepScales and colormapValues with identical length >2');
        }
        const breakpoints = new Array<ColorBreakpointDict>(colorStepScales.length);
        for (let i = 0; i < colorStepScales.length; i++) {
            const value = colormapValues[i];
            const colormapIndex = Math.round(colorStepScales[i] * (colormap.length - 1));
            const colorMapValue = colormap[colormapIndex];
            const color = Color.fromRgbaLike(Colormap.colormapColorToRgb(colorMapValue), false);
            breakpoints[i] = {
                value,
                rgba: color
            };
        }
        return breakpoints;
    }

    private static generateLinearStepFractions(steps: number): Array<number> {
        const maxIndex = steps - 1;
        const stepFractions = new Array<number>(steps);
        stepFractions[0] = 0;
        stepFractions[maxIndex] = 1;

        for (let i = 1; i < maxIndex; i++) { // fill the values between 0 and 1.
            stepFractions[i] = i / (maxIndex);
        }

        return stepFractions;
    }
}
