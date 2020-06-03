import {Color, RgbaLike, RgbaStruct} from './color';

export type BreakPointValue = string | number;

export interface ColorBreakpointDict {
    value: BreakPointValue;
    rgba: RgbaLike;
}

/**
 * A ColorBreakpoint is a tuple consisting of value and RGBA.
 */
export class ColorBreakpoint implements ColorBreakpointDict {
    value: BreakPointValue;
    rgba: Color;

    constructor(config: ColorBreakpointDict) {
        this.rgba = Color.fromRgbaLike(config.rgba);
        this.value = config.value;
    }

    /**
     * Clones the ColorBreakpoint
     */
    clone(): ColorBreakpoint {
        return new ColorBreakpoint({
            value: this.value,
            rgba: this.rgba.clone()
        });
    }

    /**
     * Clones the ColorBreakpoint and replaces the color.
     */
    cloneWithColor(color: RgbaLike): ColorBreakpoint {
        const cln = this.clone();
        cln.setColor(color);
        return cln;
    }

    /**
     * Clones the ColorBreakpoint and replaces the value.
     */
    cloneWithValue(value: BreakPointValue): ColorBreakpoint {
        const cln = this.clone();
        cln.setValue(value);
        return cln;
    }

    /**
     * Transforms the ColorBreakpoint int a ColorBreakpointDict.
     */
    toDict(): ColorBreakpointDict {
        return {
            value: this.value,
            rgba: this.rgba.rgbaTuple()
        };
    }

    /**
     * Sets the color to the provided value.
     */
    setColor(color: RgbaLike) {
        this.rgba = Color.fromRgbaLike(color);
    }

    /**
     * Sets the value of the ColorBreakpoint to the provided value.
     */
    setValue(value: BreakPointValue) {
        this.value = value;
    }

    /**
     * Returns true if the value is a number.
     */
    valueIsNumber(): boolean {
        return typeof this.value === 'number';
    }

    /**
     * Compares the ColorBreakpoint with another one.
     */
    equals(other: ColorBreakpoint): boolean {
        return other && this.rgba.equals(other.rgba) && this.value === other.value;
    }

    /**
     * Transforms the ColorBreakpoint into a representation understood by Mappings colorizer.
     */
    asMappingRasterColorizerBreakpoint(): IMappingRasterColorizerBreakpoint {
        return {
            value: this.value as number, // TODO: handle cases where this might be a string?
            r: this.rgba.r,
            g: this.rgba.g,
            b: this.rgba.b,
            a: this.rgba.a * 255, // TODO: mapping uses alpha values from 0-255 change this?
        };
    }
}

/**
 * The json representation expected by mapping.
 */
export interface IMappingRasterColorizerBreakpoint extends RgbaStruct {
    value: number;
    name?: string;
}
