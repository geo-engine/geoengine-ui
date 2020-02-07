import {ColorBreakpointDict} from '../color-breakpoint.model';
import {Color} from '../color';
import {ColorizerData} from '../colorizer-data.model';
import {colormap_inferno_data, colormap_magma_data, colormap_plasma_data, colormap_viridis_data} from './mpl-colormaps';

export type MplColormapData = Array<[number, number, number]>;
export type MplColormapName = 'MAGMA' | 'INFERNO' | 'PLASMA' | 'VIRIDIS';



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

    static mplColorToRgb(mplColor: [number, number, number]): [number, number, number] {
        return [mplColor[0] * 255, mplColor[1] * 255, mplColor[2] * 255];
    }

    static creatColorizerDataWithName(
        mplColormapName: MplColormapName,
        min: number, max: number,
        numberOfSteps: number | undefined = 16,
        logScale: boolean = false
    ) {
        return MplColormap.createColorizerDataWithColormap(
            MplColormap.getMplColormapForName(mplColormapName), min, max, numberOfSteps, logScale
        );
    }

    private static createColorizerDataWithColormap (
        colormap: MplColormapData,
        min: number, max: number,
        steps: number | undefined = 16,
        logScale: boolean = false
    ) {
        const trueSteps = (steps && steps <= colormap.length) ? steps : colormap.length;
        const stepValueFraction = (max - min) / trueSteps;
        const stepInColormap = colormap.length / trueSteps;

        const breakpoints = new Array<ColorBreakpointDict>(trueSteps);
        for (let i = 0; i < trueSteps; i++) {
            const i_br: ColorBreakpointDict = {
                value: i * stepValueFraction,
                rgba: Color.fromRgbaLike(MplColormap.mplColorToRgb(colormap[i * stepInColormap]), false)
            };
            breakpoints[i] = i_br;
        }

        return new ColorizerData({
            breakpoints: breakpoints,
            type: 'gradient'
        });
    }

}
