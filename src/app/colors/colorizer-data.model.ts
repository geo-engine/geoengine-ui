import {ColorBreakpoint, IMappingRasterColorizerBreakpoint, ColorBreakpointDict, BreakPointValue} from './color-breakpoint.model';
import {Color} from './color';

/**
 * DEPRECATED
 */
export interface DeprecatedMappingColorizerDoNotUse {
    interpolation: string;
    breakpoints: Array<[number, string, string]>;
    result?: string | number;
}

export type ColorizerType = 'gradient' | 'palette';

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

    // TODO: Chroma -> also add a temperature scale?
    static grayScaleColorizer(minMax: { min: number, max: number }): ColorizerData {

        const min_br: ColorBreakpointDict = {
            value: (minMax.min !== undefined) ? minMax.min : -1000,
            rgba: Color.fromRgbaLike({
                r: 0,
                g: 0,
                b: 0,
                a: 1
            }),
        };

        const mid_br: ColorBreakpointDict = {
            value: (minMax.min !== undefined && minMax.max !== undefined) ? (minMax.max + minMax.min) / 2.0 : 0,
            rgba: Color.fromRgbaLike({
                r: 128,
                g: 128,
                b: 128,
                a: 1,
            })
        };

        const max_br: ColorBreakpointDict = {
            value: (minMax.max !== undefined) ? minMax.max : 1000,
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
        return new ColorizerData(dict);
    }

    static empty(): ColorizerData {
        return new ColorizerData({
            breakpoints: [],
            type: 'gradient'
        })
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
        this.breakpoints.splice(i, 0, brk)
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
     * Get the color for a breakpoint value.
     * TODO: this is prob. not very fast.
     * @param {BreakPointValue} value
     * @param {boolean} interpolate
     * @returns {Color | undefined}
     */
    getColorForValue(value: BreakPointValue, interpolate: boolean = false): Color | undefined {

        if (!value || !this.breakpoints || this.breakpoints.length === 0) {
            return undefined;
        }

        const isNumber = typeof value === 'number';
        const firstBrkIsNumber = this.getBreakpointAt(0).valueIsNumber();

        const brk = this.breakpoints.find(x => {
            let lookUpValue = value;

            if (firstBrkIsNumber && ! isNumber) {
                lookUpValue = parseFloat(value as string);
            }

            // console.log('colorLookup', x, value, lookUpValue, lookUpValue === value);
            return lookUpValue === x.value;
        });

        return brk ? brk.rgba : undefined;
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
            if ( !this.getBreakpointAt(i).equals(other.getBreakpointAt(i)) ) {
                return false;
            }
        }

        return true;
    }

    toDict(): IColorizerData {
        // console.log('toDict()', this);
        return {
            breakpoints: this.breakpoints.map(br => br.toDict()),
            type: this.type
        }
    }

    static fromMappingColorizerData(mcd: MappingRasterColorizerDict): ColorizerData {
        // console.log('ColorizerData.fromMappingColorizerData', mcd);

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
                })
            })
        })
    }
}
