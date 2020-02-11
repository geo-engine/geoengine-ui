import {ColorBreakpointDict} from '../color-breakpoint.model';
import {Color} from '../color';
import {ColorizerData} from '../colorizer-data.model';
import {colormap_inferno_data, colormap_magma_data, colormap_plasma_data, colormap_viridis_data} from './mpl-colormaps';

export type MplColormapData = Array<[number, number, number]>;
export type MplColormapName = 'MAGMA' | 'INFERNO' | 'PLASMA' | 'VIRIDIS';
export type ColorMapStepScale = 'linear' | 'exponential_steps' | 'exponential_values' | 'log_steps' | 'log_values' | 'log_values_inverse' |
    'exponential_values_inverse';


export abstract class MplColormap {

    static getMplColormapForName(colormapName: MplColormapName): MplColormapData {
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

    private static calculateStepScales(steps: number, min: number, max: number, stepScale: ColorMapStepScale): Array<number> {
        switch (stepScale) {
            case 'linear': return MplColormap.generateLinearStepFractions(steps);
            case 'exponential_steps': return MplColormap.generateExpStepFractionsSteps(steps);
            case 'exponential_values': return MplColormap.generateExpStepFractionsValues(steps, min, max);
            case 'exponential_values_inverse' : return MplColormap.inverseStepFractions(
                MplColormap.generateExpStepFractionsValues(steps, min, max)
            );
            case 'log_steps': return MplColormap.generateLogStepFractionsSteps(steps);
            case 'log_values': return MplColormap.generateLogStepFractionsValues(steps, min, max);
            case 'log_values_inverse' : return MplColormap.inverseStepFractions(
                MplColormap.generateLogStepFractionsValues(steps, min, max)
            );
        }
    }

    private static mplColorToRgb(mplColor: [number, number, number]): [number, number, number] {
        return [mplColor[0] * 255, mplColor[1] * 255, mplColor[2] * 255];
    }

    static creatColorizerDataWithName(
        mplColormapName: MplColormapName,
        min: number, max: number,
        steps: number | undefined = 16,
        stepScale: ColorMapStepScale = 'log_values'
    ) {

        const colormap = MplColormap.getMplColormapForName(mplColormapName);
        const trueSteps = (steps && steps <= colormap.length) ? steps : colormap.length;
        const stepFractions = MplColormap.calculateStepScales(trueSteps, min, max, stepScale);

        return MplColormap.createColorizerDataFromColormapAndStepFractions(colormap, min, max, stepFractions);
    }

    private static generateLinearStepFractions(steps: number): Array<number> {
        const maxIndex = steps - 1;
        const stepFractions = new Array<number>(steps);
        stepFractions[0] = 0;
        stepFractions[maxIndex] = 1;

        for (let i = 1; i < maxIndex ; i++) { // fill the values between 0 and 1.
            stepFractions[i] = i / (maxIndex);
        }

        return stepFractions;
    }

    private static generateExpStepFractionsSteps(steps: number): Array<number> {
        const maxIndex = steps - 1;
        const stepFractions = new Array<number>(steps);
        stepFractions[0] = 0;
        stepFractions[maxIndex] = 1;

        for (let i = 0; i < maxIndex - 1; i++) {
            stepFractions[i + 1] = Math.exp(i) / ( Math.exp(maxIndex));
        }

        return stepFractions;
    }

    private static generateExpStepFractionsValues(steps: number, min: number, max: number): Array<number> {
        const stepFractions = new Array<number>(steps);
        const valueRange = max - min;
        const rangeStep = valueRange / (steps - 1);

        for (let i = 0; i < steps; i++) {
            const currentVal = i * rangeStep;
            const temp1 = (currentVal < 0) ? 0 : currentVal;
            const temp2 = Math.exp(temp1);
            stepFractions[i] = temp2 / Math.exp(valueRange);
        }
        return stepFractions;
    }

    private static inverseStepFractions(stepFractions: Array<number>): Array<number> {
        const inverseFraction = stepFractions.map( x => 1.0 - x).reverse();
        return inverseFraction;
    }

    private static generateLogStepFractionsValues(steps: number, min: number, max: number): Array<number> {

        const valueRange = max - min;
        const rangeStep = valueRange / (steps - 1);

        const stepFractions = new Array<number>(steps);
        for (let i = 0; i < steps ; i++) {
            const currentVal = i * rangeStep + min;
            stepFractions[i] = (Math.log(currentVal) - Math.log(min)) / (Math.log(max) - (Math.log(min)));
        }
        return stepFractions;
    }

    private static generateLogStepFractionsSteps(steps: number): Array<number> {
        const maxIndex = steps - 1;
        const stepFractions = new Array<number>(steps);
        stepFractions[0] = 0;
        stepFractions[maxIndex] = 1;
        for (let i = 2; i <= maxIndex + 1; i++) {
            stepFractions[i - 1] = Math.log(i) / Math.log(maxIndex + 1);
        }
        return stepFractions;
    }

    private static createColorizerDataFromColormapAndStepFractions (
        colormap: MplColormapData,
        min: number, max: number,
        stepFractions: Array<number>,
    ) {
        const stepInColormap = colormap.length / stepFractions.length;
        const valueRange = (max - min);
        const breakpoints = new Array<ColorBreakpointDict>(stepFractions.length);
        for (let i = 0; i < breakpoints.length; i++) {
            const value = min + stepFractions[i] * valueRange;
            const colormapIndex = Math.round(i * stepInColormap);
            const colorMapValue = colormap[colormapIndex];
            const color = Color.fromRgbaLike(MplColormap.mplColorToRgb(colorMapValue), false);
            const i_br: ColorBreakpointDict = {
                value: value,
                rgba: color
            };
            breakpoints[i] = i_br;
        }

        return new ColorizerData({
            breakpoints: breakpoints,
            type: 'gradient'
        });
    }

}
