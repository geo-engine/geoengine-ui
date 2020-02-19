import {ColorBreakpointDict} from '../color-breakpoint.model';
import {Color} from '../color';
import {ColorizerData} from '../colorizer-data.model';
import {colormap_inferno_data, colormap_magma_data, colormap_plasma_data, colormap_viridis_data} from './mpl-colormaps';

export type ColormapData = Array<[number, number, number]>;
export type MplColormapName = 'MAGMA' | 'INFERNO' | 'PLASMA' | 'VIRIDIS';
export type ColormapStepScale = 'linear' | 'log' | 'power_05' | 'power_2';

export interface BoundedColormapStepScale {
    stepScaleName: ColormapStepScale;
    requiresValueAbove?: number;
    requiresValueBelow?: number;
}

export const COLORMAP_NAMES: Array<MplColormapName> = ['MAGMA', 'INFERNO', 'PLASMA', 'VIRIDIS'];
export const COLORMAP_STEP_SCALES_WITH_BOUNDS: Array<BoundedColormapStepScale> = [
    {stepScaleName: 'linear'},
    {stepScaleName: 'log', requiresValueAbove: 0},
    {stepScaleName: 'power_05', requiresValueBelow: 5000},
    {stepScaleName: 'power_2', requiresValueBelow: 5000}
];

export abstract class Colormap {

    static getColormapForName(colormapName: MplColormapName): ColormapData {
        switch (colormapName) {
            case 'INFERNO':
                return colormap_inferno_data;
            case 'MAGMA':
                return colormap_magma_data;
            case 'PLASMA':
                return colormap_plasma_data;
            case 'VIRIDIS':
                return colormap_viridis_data;
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
            case 'power_05':
                return Colormap.powerNormInverse(stepFractions, min, max, 0.5);
            case 'power_2' :
                return Colormap.powerNormInverse(stepFractions, min, max, 2);

        }
    }

    private static colormapColorToRgb(colormapColor: [number, number, number]): [number, number, number] {
        return [colormapColor[0] * 255, colormapColor[1] * 255, colormapColor[2] * 255];
    }

    static createColorizerDataWithName(
        colormapName: MplColormapName,
        min: number, max: number,
        steps: number | undefined = 16,
        stepScale: ColormapStepScale = 'linear'
    ): ColorizerData {

        const colormap = Colormap.getColormapForName(colormapName);
        const trueSteps = (steps && steps <= colormap.length) ? steps : colormap.length;
        const colormapStepFractions = Colormap.generateLinearStepFractions(trueSteps);
        const colormapValues = Colormap.calculateStepScales(stepScale, colormapStepFractions, min, max);
        const breakpoints = Colormap.createColormapColorizerBreakpoints(colormap, colormapStepFractions, colormapValues);
        return new ColorizerData({
            breakpoints: breakpoints,
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
            const i_br: ColorBreakpointDict = {
                value: value,
                rgba: color
            };
            breakpoints[i] = i_br;
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
