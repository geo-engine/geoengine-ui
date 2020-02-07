import {BreakPointValue, ColorBreakpoint, ColorBreakpointDict, IMappingRasterColorizerBreakpoint} from './color-breakpoint.model';
import {Color} from './color';
import {MplColormap, MplColormapName} from './mpl-colormaps/mpl-colormap.model';

/**
 * DEPRECATED
 */
export interface DeprecatedMappingColorizerDoNotUse {
    interpolation: string;
    breakpoints: Array<[number, string, string]>;
    result?: string | number;
}

export type ColorizerType = 'gradient' | 'logarithmic' | 'palette' | 'rgba_composite';

export interface IColorizerData {
    breakpoints: Array<ColorBreakpointDict>;
    type?: ColorizerType;
}

export interface MappingRasterColorizerDict {
    breakpoints: Array<IMappingRasterColorizerBreakpoint>;
    type?: ColorizerType;
    nodata?: IMappingRasterColorizerBreakpoint;
    overflow?: IMappingRasterColorizerBreakpoint;
}

export class ColorizerData implements IColorizerData {
    breakpoints: Array<ColorBreakpoint>;
    type: ColorizerType;

    static grayScaleColorizer(minMax: { min: number, max: number }): ColorizerData {

        const saveMin = (minMax.min) ? minMax.min : -1000;
        const saveMax = (minMax.max) ? minMax.max : 1000;
        const saveCenter = (saveMin + saveMax) / 2.0;

        const min_br: ColorBreakpointDict = {
            value: saveMin,
            rgba: Color.fromRgbaLike({
                r: 0,
                g: 0,
                b: 0,
                a: 1
            }),
        };

        const mid_br: ColorBreakpointDict = {
            value: saveCenter,
            rgba: Color.fromRgbaLike({
                r: 128,
                g: 128,
                b: 128,
                a: 1,
            })
        };

        const max_br: ColorBreakpointDict = {
            value: saveMax,
            rgba: Color.fromRgbaLike({
                r: 255,
                g: 255,
                b: 255,
                a: 1,
            })
        };

        return new ColorizerData({
            breakpoints: [min_br, mid_br, max_br],
            type: 'gradient'
        });
    }

    static fromDict(dict: IColorizerData): ColorizerData {
        if (!dict) { // return some default value in case of empty deserialization
            return ColorizerData.grayScaleColorizer({
                min: 0,
                max: 100,
            });
        }

        return new ColorizerData(dict);
    }

    static empty(): ColorizerData {
        return new ColorizerData({
            breakpoints: [],
            type: 'gradient'
        });
    }

    constructor(config: IColorizerData) {
        this.breakpoints = (config.breakpoints) ? config.breakpoints.map(br => new ColorBreakpoint(br)) : [];
        this.type = (config.type) ? config.type : 'gradient';
    }

    clear() {
        this.breakpoints = [];
    }

    addBreakpoint(brk: ColorBreakpointDict) {
        this.breakpoints.push(new ColorBreakpoint(brk));
    }

    addBreakpointAt(i: number, brk: ColorBreakpoint) {
        this.breakpoints.splice(i, 0, brk);
    }

    removeBreakpointAt(i: number) {
        this.breakpoints.splice(i, 1);
    }

    updateBreakpointAt(i: number, brk: ColorBreakpoint): boolean {
        const equal = this.getBreakpointAt(i).equals(brk);
        if (brk && !equal) {
            this.breakpoints[i] = brk;
            return true;
        }
        return false;
    }

    getBreakpointAt(i: number): ColorBreakpoint {
        return this.breakpoints[i];
    }

    /**
     * Get a (new) breakpoint for a value.
     * TODO: this is prob. not very correct...
     * @param {BreakPointValue} value
     * @param {boolean} interpolate
     * @returns {ColorBreakpoint | undefined}
     */
    getBreakpointForValue(value: BreakPointValue, interpolate: boolean = false): ColorBreakpoint | undefined {

        if (!value || !this.breakpoints || this.breakpoints.length <= 0) {
            return undefined;
        }

        const isGradient = this.type === 'gradient';
        const isNumber = typeof value === 'number';
        const firstBrkIsNumber = this.getBreakpointAt(0).valueIsNumber(); // TODO: this is prob. not always the correct type.
        const lookUpValue = (firstBrkIsNumber && !isNumber) ? parseFloat(value as string) : value;
        const isLookupNumber = typeof lookUpValue === 'number';

        let brk_index = -1;
        for (let index = 0; index < this.breakpoints.length; index++) {
            const brk_i = this.breakpoints[index];
            if (isLookupNumber && brk_i.value <= lookUpValue) {
                brk_index = index;
            } else if (brk_i.value === lookUpValue) {
                brk_index = index;
            }
        }
        const brk = this.breakpoints[brk_index];
        const validBrk = brk_index >= 0 && (this.breakpoints.length > 1 || brk.value === lookUpValue);
        const isLastBrk = brk_index >= this.breakpoints.length - 1;

        if (!validBrk) {
            return undefined;
        }

        if (!interpolate || isLastBrk || brk.value === lookUpValue || !isGradient) {
            return brk;
        }

        // handling gradients for numbers...
        const brk_next = this.breakpoints[brk_index + 1];
        if (typeof lookUpValue === 'number' && typeof brk.value === 'number' && typeof brk_next.value === 'number') {
            const diff = lookUpValue - brk.value;
            const frac_diff = diff / (brk_next.value - brk.value);
            const color = Color.interpolate(brk.rgba, brk_next.rgba, frac_diff);

            return new ColorBreakpoint({
                rgba: color,
                value: brk.value + diff
            })
        }

        return undefined;
    }

    updateType(type: ColorizerType): boolean {
        if (type && (!this.type || type !== this.type)) {
            this.type = type;
            return true;
        }
        return false;
    }


    clone(): ColorizerData {
        return new ColorizerData(this.toDict() as IColorizerData);
    }

    equals(other: ColorizerData): boolean {
        if (!other || this.breakpoints.length !== other.breakpoints.length || this.type !== other.type) {
            return false;
        }

        for (let i = 0; i < this.breakpoints.length; i++) {
            if (!this.getBreakpointAt(i).equals(other.getBreakpointAt(i))) {
                return false;
            }
        }

        return true;
    }

    toDict(): IColorizerData {
        return {
            breakpoints: this.breakpoints.map(br => br.toDict()),
            type: this.type
        }
    }

    static fromMappingColorizerData(mcd: MappingRasterColorizerDict): ColorizerData {

        return new ColorizerData({
            type: (!mcd || !mcd.type) ? 'gradient' : mcd.type,
            breakpoints: (!mcd || !mcd.breakpoints) ? [] : mcd.breakpoints.map(br => {
                return new ColorBreakpoint({
                    rgba: {
                        r: br.r,
                        g: br.g,
                        b: br.b,
                        a: (br.a) ? br.a : 1.0,
                    },
                    value: br.value,
                });
            })
        });
    }
}
