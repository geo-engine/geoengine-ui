import {Color, RgbaLike, RgbaStruct} from './color';

export type BreakPointValue = string | number;

export interface ColorBreakpointDict {
    value: BreakPointValue;
    rgba: RgbaLike;
}

/**
 * A ColorBreakpoint is a tuple consisting of value and RGBA...
 */
export class ColorBreakpoint implements ColorBreakpointDict {
    value: BreakPointValue;
    rgba: Color;

    constructor(config: ColorBreakpointDict) {
        this.rgba = Color.fromRgbaLike(config.rgba);
        this.value = config.value;
    }

    clone(): ColorBreakpoint {
        return new ColorBreakpoint({
            value: this.value,
            rgba: this.rgba.clone()
        });
    }

    cloneWithColor(color: RgbaLike): ColorBreakpoint {
        const cln = this.clone();
        cln.setColor(color);
        return cln;
    }

    cloneWithValue(value: BreakPointValue): ColorBreakpoint {
        const cln = this.clone();
        cln.setValue(value);
        return cln;
    }

    toDict(): ColorBreakpointDict {
        return {
            value: this.value,
            rgba: this.rgba.rgbaTuple()
        }
    }

    setColor(color: RgbaLike) {
        this.rgba = Color.fromRgbaLike(color);
    }

    setValue(value: BreakPointValue) {
        this.value = value;
    }

    valueIsNumber(): boolean {
        return typeof this.value === 'number';
    }

    equals(other: ColorBreakpoint): boolean {
        return other && this.rgba.equals(other.rgba) && this.value === other.value;
    }

    asMappingRasterColorizerBreakpoint(): IMappingRasterColorizerBreakpoint {
        return {
            value: this.value as number, // TODO: handle cases where this might be a string?
            r: this.rgba.r,
            g: this.rgba.g,
            b: this.rgba.b,
            a: this.rgba.a * 255, // TODO: mapping uses alpha values from 0-255 change this?
        }
    }
}

/**
 * The json representation expected by mapping.
 */
export interface IMappingRasterColorizerBreakpoint extends RgbaStruct {
    value: number;
    name?: string;
}
