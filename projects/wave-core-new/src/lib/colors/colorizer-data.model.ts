import {BreakPointValue, ColorBreakpoint, ColorBreakpointDict, IMappingRasterColorizerBreakpoint} from './color-breakpoint.model';
import {Color} from './color';

/**
 * The colorizer types supported by Mapping.
 */
export type ColorizerType = 'gradient' | 'logarithmic' | 'palette' | 'rgba_composite';

/**
 * An interface for the data representing a colorizer.
 */
export interface IColorizerData {
    breakpoints: Array<ColorBreakpointDict>;
    type?: ColorizerType;
}

/**
 * The interface for colorizers supported by Mapping.
 */
export interface MappingRasterColorizerDict {
    breakpoints: Array<IMappingRasterColorizerBreakpoint>;
    type?: ColorizerType;
    nodata?: IMappingRasterColorizerBreakpoint;
    default?: IMappingRasterColorizerBreakpoint;
}

/**
 * The information within ColorizerData allows colorization of vector and raster data.
 */
export class ColorizerData implements IColorizerData {
    breakpoints: Array<ColorBreakpoint>;
    type: ColorizerType;

    /**
     * Generate a new gray scale colorizer for values between min and max.
     */
    static grayScaleColorizer(minMax: {min: number; max: number}): ColorizerData {
        const saveMin = minMax.min ? minMax.min : -1000;
        const saveMax = minMax.max ? minMax.max : 1000;
        const saveCenter = (saveMin + saveMax) / 2.0;

        const min_br: ColorBreakpointDict = {
            value: saveMin,
            rgba: Color.fromRgbaLike({
                r: 0,
                g: 0,
                b: 0,
                a: 1,
            }),
        };

        const mid_br: ColorBreakpointDict = {
            value: saveCenter,
            rgba: Color.fromRgbaLike({
                r: 128,
                g: 128,
                b: 128,
                a: 1,
            }),
        };

        const max_br: ColorBreakpointDict = {
            value: saveMax,
            rgba: Color.fromRgbaLike({
                r: 255,
                g: 255,
                b: 255,
                a: 1,
            }),
        };

        return new ColorizerData({
            breakpoints: [min_br, mid_br, max_br],
            type: 'gradient',
        });
    }

    /**
     * Deserialization for IColorizerData into ColorizerData.
     */
    static fromDict(dict: IColorizerData): ColorizerData {
        if (!dict) {
            // return some default value in case of empty deserialization
            return ColorizerData.grayScaleColorizer({
                min: 0,
                max: 100,
            });
        }

        return new ColorizerData(dict);
    }

    /**
     * Generates an instance of ColorizerData without any breakpoints.
     */
    static empty(): ColorizerData {
        return new ColorizerData({
            breakpoints: [],
            type: 'gradient',
        });
    }

    /**
     * Check if an instance of (I)ColorizerData is valid.
     */
    static is_valid(colorizerData: IColorizerData) {
        return colorizerData.breakpoints.length >= 2;
    }

    /**
     * The constructor for ColorizerData.
     */
    constructor(config: IColorizerData) {
        this.breakpoints = config.breakpoints ? config.breakpoints.map((br) => new ColorBreakpoint(br)) : [];
        this.type = config.type ? config.type : 'gradient';
    }

    /**
     * Removes all breakpoints.
     */
    clear() {
        this.breakpoints = [];
    }

    /**
     * Adds a breakpoint to the end of the list.
     */
    addBreakpoint(brk: ColorBreakpointDict) {
        this.breakpoints.push(new ColorBreakpoint(brk));
    }

    /**
     * Adds a breakpoint at position i in the list.
     */
    addBreakpointAt(i: number, brk: ColorBreakpoint) {
        this.breakpoints.splice(i, 0, brk);
    }

    /**
     * Removes the breakpoint at position i in the list.
     */
    removeBreakpointAt(i: number) {
        this.breakpoints.splice(i, 1);
    }

    /**
     * Updates the ColorBreakpoint at position i.
     */
    updateBreakpointAt(i: number, brk: ColorBreakpoint): boolean {
        const equal = this.getBreakpointAt(i).equals(brk);
        if (brk && !equal) {
            this.breakpoints[i] = brk;
            return true;
        }
        return false;
    }

    /**
     * Returns the ColorBreakpoint at position i.
     */
    getBreakpointAt(i: number): ColorBreakpoint {
        return this.breakpoints[i];
    }

    /**
     * Get a (new) breakpoint for a value.
     */
    getBreakpointForValue(value: BreakPointValue, interpolate: boolean = false): ColorBreakpoint | undefined {
        if (!value || !this.breakpoints || this.breakpoints.length <= 0) {
            return undefined;
        }

        const isGradient = this.type === 'gradient';
        const isNumber = typeof value === 'number';
        const firstBrkIsNumber = this.getBreakpointAt(0).valueIsNumber(); // TODO: this is prob. not always the correct type.
        const lookUpValue = firstBrkIsNumber && !isNumber ? parseFloat(value as string) : value;
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
                value: brk.value + diff,
            });
        }

        return undefined;
    }

    get firstBreakpoint(): ColorBreakpoint | undefined {
        return !this.breakpoints || this.isEmpty() ? undefined : this.breakpoints[0];
    }

    get lastBreakpoint(): ColorBreakpoint | undefined {
        return !this.breakpoints || this.isEmpty() ? undefined : this.breakpoints[this.breakpoints.length - 1];
    }

    /**
     * Checks if the list of breakpoints is empty.
     */
    isEmpty(): boolean {
        return !this.breakpoints || this.breakpoints.length === 0;
    }

    /**
     * Update the type of the ColorizerData.
     */
    updateType(type: ColorizerType): boolean {
        if (type && (!this.type || type !== this.type)) {
            this.type = type;
            return true;
        }
        return false;
    }

    /**
     * Returns a clone of the ColorizerData.
     */
    clone(): ColorizerData {
        return new ColorizerData(this.toDict() as IColorizerData);
    }

    /**
     * Compares this ColorizerData with another one.
     */
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

    /**
     * Transforms ColorizerData into an interface object.
     */
    toDict(): IColorizerData {
        return {
            breakpoints: this.breakpoints.map((br) => br.toDict()),
            type: this.type,
        };
    }

    /**
     * Generates a ColorizerData instance from a MappingColorizer.
     */
    static fromMappingColorizerData(mcd: MappingRasterColorizerDict): ColorizerData {
        return new ColorizerData({
            type: !mcd || !mcd.type ? 'gradient' : mcd.type,
            breakpoints:
                !mcd || !mcd.breakpoints
                    ? []
                    : mcd.breakpoints.map((br) => {
                          return new ColorBreakpoint({
                              rgba: {
                                  r: br.r,
                                  g: br.g,
                                  b: br.b,
                                  a: br.a ? br.a : 1.0,
                              },
                              value: br.value,
                          });
                      }),
        });
    }
}
