import {ColorBreakpointDict} from '../color-breakpoint.model';
import {Color} from '../color';
import {ColorizerData} from '../colorizer-data.model';
import {
    COLORMAP_INFERNO_DATA,
    COLORMAP_MAGMA_DATA,
    COLORMAP_PLASMA_DATA,
    COLORMAP_VIRIDIS_DATA,
    MPL_COLORMAP_NAMES,
    MplColormapName,
} from './mpl-colormaps';
import {COOLWARM_DATA, MORELAND_COLORMAP_NAMES, MorelandColormapName} from './moreland-colormaps';
import {
    COLORMAP_ARCON_DATA,
    COLORMAP_BAMAKO_DATA,
    COLORMAP_BATLOW_DATA,
    COLORMAP_BERLIN_DATA,
    COLORMAP_BILBAO_DATA,
    COLORMAP_BROC_DATA,
    COLORMAP_BROCO_DATA,
    COLORMAP_BUDA_DATA,
    COLORMAP_CORC_DATA,
    COLORMAP_CORCO_DATA,
    COLORMAP_DAVOS_DATA,
    COLORMAP_DEVON_DATA,
    COLORMAP_GRAYC_DATA,
    COLORMAP_HAWAII_DATA,
    COLORMAP_IMOLA_DATA,
    COLORMAP_LAJOLLA_DATA,
    COLORMAP_LAPAZ_DATA,
    COLORMAP_LISBON_DATA,
    COLORMAP_NUUK_DATA,
    COLORMAP_OLERON_DATA,
    COLORMAP_OSLO_DATA,
    COLORMAP_ROMA_DATA,
    COLORMAP_ROMAO_DATA,
    COLORMAP_TOFINO_DATA,
    COLORMAP_TOKYO_DATA,
    COLORMAP_TURKU_DATA,
    COLORMAP_VIK_DATA,
    COLORMAP_VIKO_DATA,
    SCIENTIFIC_COLORMAP_NAMES,
    ScientificColormapName,
} from './scientific-colormaps/scientific-colormaps';
import {COLORMAP_RAINBOW_DATA, GENERIC_COLORMAP_NAMES, GenericColormapName} from './generic-colormaps';

/**
 * Type for ColormapData / a wrapper for RGB values.
 */
export type ColormapData = Array<[number, number, number]>;

/**
 * All allowed `Colormap` names.
 */
export type ColormapNames = MplColormapName | MorelandColormapName | ScientificColormapName | GenericColormapName;

/**
 * A list of all `Colormap` names.
 */
export const COLORMAP_NAMES: Array<ColormapNames> = [
    ...MPL_COLORMAP_NAMES,
    ...MORELAND_COLORMAP_NAMES,
    ...SCIENTIFIC_COLORMAP_NAMES,
    ...GENERIC_COLORMAP_NAMES,
];

/**
 * The `Colormap` step scaling methods.
 */
export type ColormapStepScale = 'linear' | 'log' | 'square root' | 'square';

/**
 * An interface for bounded step scales. E.g. log is only possible for values >= 1.
 */
export interface BoundedColormapStepScale {
    stepScaleName: ColormapStepScale;
    requiresValueAbove?: number;
    requiresValueBelow?: number;
}

/**
 * A list of all step scales with possible bounds.
 */
export const COLORMAP_STEP_SCALES_WITH_BOUNDS: Array<BoundedColormapStepScale> = [
    {stepScaleName: 'linear'},
    {stepScaleName: 'log', requiresValueAbove: 0},
    {stepScaleName: 'square root', requiresValueBelow: 5000},
    {stepScaleName: 'square', requiresValueBelow: 5000},
];

/**
 * Abstract class for common `Colormap` functions.
 */
export abstract class Colormap {
    /**
     * Resolves the `Colormap` data for a `Colormap` name.
     */
    static getColormapForName(colormapName: ColormapNames): ColormapData {
        switch (colormapName) {
            case 'INFERNO':
                return COLORMAP_INFERNO_DATA;
            case 'MAGMA':
                return COLORMAP_MAGMA_DATA;
            case 'PLASMA':
                return COLORMAP_PLASMA_DATA;
            case 'VIRIDIS':
                return COLORMAP_VIRIDIS_DATA;
            case 'COOLWARM':
                return COOLWARM_DATA;
            case 'ARCON':
                return COLORMAP_ARCON_DATA;
            case 'BAMAKO':
                return COLORMAP_BAMAKO_DATA;
            case 'BATLOW':
                return COLORMAP_BATLOW_DATA;
            case 'BERLIN':
                return COLORMAP_BERLIN_DATA;
            case 'BILBAO':
                return COLORMAP_BILBAO_DATA;
            case 'BROC':
                return COLORMAP_BROC_DATA;
            case 'BROCO':
                return COLORMAP_BROCO_DATA;
            case 'BUDA':
                return COLORMAP_BUDA_DATA;
            case 'CORC':
                return COLORMAP_CORC_DATA;
            case 'CORCO':
                return COLORMAP_CORCO_DATA;
            case 'DAVOS':
                return COLORMAP_DAVOS_DATA;
            case 'DEVON':
                return COLORMAP_DEVON_DATA;
            case 'GRAYC':
                return COLORMAP_GRAYC_DATA;
            case 'HAWAII':
                return COLORMAP_HAWAII_DATA;
            case 'IMOLA':
                return COLORMAP_IMOLA_DATA;
            case 'LAJOLLA':
                return COLORMAP_LAJOLLA_DATA;
            case 'LAPAZ':
                return COLORMAP_LAPAZ_DATA;
            case 'LISBON':
                return COLORMAP_LISBON_DATA;
            case 'NUUK':
                return COLORMAP_NUUK_DATA;
            case 'OLERON':
                return COLORMAP_OLERON_DATA;
            case 'OSLO':
                return COLORMAP_OSLO_DATA;
            case 'ROMA':
                return COLORMAP_ROMA_DATA;
            case 'ROMAO':
                return COLORMAP_ROMAO_DATA;
            case 'TOFINO':
                return COLORMAP_TOFINO_DATA;
            case 'TOKYO':
                return COLORMAP_TOKYO_DATA;
            case 'TURKU':
                return COLORMAP_TURKU_DATA;
            case 'VIK':
                return COLORMAP_VIK_DATA;
            case 'VIKO':
                return COLORMAP_VIKO_DATA;
            case 'RAINBOW':
                return COLORMAP_RAINBOW_DATA;
        }
    }

    static createColorizerDataWithName(
        colormapName: ColormapNames,
        min: number,
        max: number,
        steps: number | undefined = 16,
        stepScale: ColormapStepScale = 'linear',
        reverseColors: boolean = false,
    ): ColorizerData {
        let colormap = Colormap.getColormapForName(colormapName);
        if (reverseColors) {
            colormap = [...colormap].reverse(); // use a clone since 'reverse' mutates the original array
        }
        const trueSteps = steps && steps <= colormap.length ? steps : colormap.length;
        const colormapStepFractions = Colormap.generateLinearStepFractions(trueSteps);
        const colormapValues = Colormap.calculateStepScales(stepScale, colormapStepFractions, min, max);
        const breakpoints = Colormap.createColormapColorizerBreakpoints(colormap, colormapStepFractions, colormapValues);
        return new ColorizerData({
            breakpoints,
            type: stepScale === 'log' ? 'logarithmic' : 'gradient',
        });
    }

    private static calculateStepScales(
        stepScale: ColormapStepScale,
        stepFractions: Array<number>,
        min: number,
        max: number,
    ): Array<number> {
        switch (stepScale) {
            case 'linear':
                return Colormap.linearNormInverse(stepFractions, min, max);
            case 'log':
                return Colormap.logNormInverse(stepFractions, min, max);
            case 'square root':
                return Colormap.powerNormInverse(stepFractions, min, max, 0.5);
            case 'square':
                return Colormap.powerNormInverse(stepFractions, min, max, 2);
        }
    }

    private static colormapColorToRgb(colormapColor: [number, number, number]): [number, number, number] {
        return [colormapColor[0] * 255, colormapColor[1] * 255, colormapColor[2] * 255];
    }

    private static logNormInverse(stepFractions: Array<number>, min: number, max: number): Array<number> {
        return stepFractions.map((x) => min * Math.pow(max / min, x));
    }

    private static powerNormInverse(stepFractions: Array<number>, min: number, max: number, gamma: number = 2): Array<number> {
        return stepFractions.map((x) => Math.pow(x, 1 / gamma) * (max - min) + min);
    }

    private static linearNormInverse(stepFractions: Array<number>, min: number, max: number): Array<number> {
        return stepFractions.map((x) => min + x * (max - min));
    }

    private static createColormapColorizerBreakpoints(
        colormap: ColormapData,
        colorStepScales: Array<number>,
        colormapValues: Array<number>,
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
                rgba: color,
            };
        }
        return breakpoints;
    }

    private static generateLinearStepFractions(steps: number): Array<number> {
        const maxIndex = steps - 1;
        const stepFractions = new Array<number>(steps);
        stepFractions[0] = 0;
        stepFractions[maxIndex] = 1;

        for (let i = 1; i < maxIndex; i++) {
            // fill the values between 0 and 1.
            stepFractions[i] = i / maxIndex;
        }

        return stepFractions;
    }
}
