import {ColorizerDict, LinearGradientDict, PaletteDict} from '../backend/backend.model';
import {Color, colorToDict, rgbaColorFromDict} from './color';
import {ColorBreakpoint} from './color-breakpoint.model';

export abstract class Colorizer {
    abstract readonly defaultColor: Color;

    static fromDict(dict: ColorizerDict): Colorizer {
        if (dict.LinearGradient) {
            return LinearGradient.fromLinearGradientDict(dict.LinearGradient);
        } else if (dict.Palette) {
            return PaletteColorizer.fromPaletteDict(dict.Palette);
        }
        throw new Error('Unimplemented or invalid colorizer');
    }

    abstract getColor(value: number | undefined): Color;

    abstract getBreakpoints(): Array<ColorBreakpoint>;

    abstract equals(other: Colorizer): boolean;

    abstract clone(): Colorizer;

    abstract toDict(): ColorizerDict;

    abstract isGradient(): boolean;

    abstract isDiscrete(): boolean;

    isContinuous(): boolean {
        return !this.isDiscrete();
    }

    abstract getColorAtIndex(index: number): Color;

    abstract getNumberOfColors(): number;
}

export class LinearGradient extends Colorizer {
    readonly breakpoints: Array<ColorBreakpoint>;
    readonly noDataColor: Color;
    readonly defaultColor: Color;

    constructor(breakpoints: Array<ColorBreakpoint>, noDataColor: Color, defaultColor: Color) {
        super();
        this.defaultColor = defaultColor;
        this.noDataColor = noDataColor;
        this.breakpoints = breakpoints;
    }

    static fromLinearGradientDict(dict: LinearGradientDict): LinearGradient {
        return new LinearGradient(
            dict.breakpoints.map((b) => ColorBreakpoint.fromDict(b)),
            Color.fromRgbaLike(rgbaColorFromDict(dict.no_data_color)),
            Color.fromRgbaLike(rgbaColorFromDict(dict.default_color)),
        );
    }

    getColor(value: number | undefined): Color {
        if (value === undefined || value === null) {
            return this.noDataColor;
        }

        if (value < this.breakpoints[0].value || value > this.breakpoints[this.breakpoints.length].value) {
            return this.defaultColor;
        }

        const index = this.breakpoints.findIndex((b) => b.value >= value);

        const brk = this.breakpoints[index];
        const nextBrk = this.breakpoints[Math.min(index + 1, this.breakpoints.length - 1)];

        const diff = value - brk.value;
        const fracDiff = diff / (nextBrk.value - brk.value);
        return Color.interpolate(brk.color, nextBrk.color, fracDiff);
    }

    getBreakpoints(): Array<ColorBreakpoint> {
        return this.breakpoints;
    }

    equals(other: Colorizer): boolean {
        if (other instanceof LinearGradient) {
            if (this.breakpoints.length !== other.breakpoints.length) {
                return false;
            }

            for (let i = 0; i < this.breakpoints.length; i++) {
                if (this.breakpoints[i].equals(other.breakpoints[i])) {
                    return false;
                }
            }

            return this.defaultColor.equals(other.defaultColor) && this.noDataColor.equals(other.noDataColor);
        }

        return false;
    }

    clone(): Colorizer {
        return new LinearGradient(
            this.breakpoints.map((b) => b.clone()),
            this.noDataColor.clone(),
            this.defaultColor.clone(),
        );
    }

    toDict(): ColorizerDict {
        return {
            LinearGradient: {
                breakpoints: this.breakpoints.map((b) => b.toDict()),
                no_data_color: colorToDict(this.noDataColor),
                default_color: colorToDict(this.defaultColor),
            },
        };
    }

    isGradient(): boolean {
        return true;
    }

    isDiscrete(): boolean {
        return false;
    }

    getColorAtIndex(index: number): Color {
        return this.breakpoints[index].color;
    }

    getNumberOfColors(): number {
        return this.breakpoints.length;
    }

    getDefaultColor(): Color {
        return this.defaultColor;
    }
}

export class PaletteColorizer extends Colorizer {
    readonly colors: Map<number, Color>;
    readonly noDataColor: Color;
    readonly defaultColor: Color;

    constructor(colors: Map<number, Color>, noDataColor: Color, defaultColor: Color) {
        super();
        this.colors = colors;
        this.noDataColor = noDataColor;
        this.defaultColor = defaultColor;
    }

    static fromPaletteDict(dict: PaletteDict): PaletteColorizer {
        const colors = new Map();
        for (const i of Object.keys(dict.colors)) {
            colors[i] = Color.fromRgbaLike(rgbaColorFromDict(dict.colors[i]));
        }
        return new PaletteColorizer(
            colors,
            Color.fromRgbaLike(rgbaColorFromDict(dict.no_data_color)),
            Color.fromRgbaLike(rgbaColorFromDict(dict.default_color)),
        );
    }

    getColor(value: number): Color {
        const color = this.colors.get(value);
        if (color === undefined) {
            return this.defaultColor;
        }
        return color;
    }

    getBreakpoints(): Array<ColorBreakpoint> {
        const breakpoints = [];
        for (const [value, color] of Object.entries(this.colors)) {
            breakpoints.push(new ColorBreakpoint(parseInt(value, 10), color));
        }
        return breakpoints;
    }

    equals(other: Colorizer): boolean {
        if (other instanceof PaletteColorizer) {
            if (this.colors.size !== other.colors.size) {
                return false;
            }

            for (const i in Object.keys(this.colors)) {
                if (this.colors[i] !== other.colors[i]) {
                    return false;
                }
            }

            return this.noDataColor.equals(other.noDataColor) && this.defaultColor.equals(other.defaultColor);
        }
        return false;
    }

    clone(): Colorizer {
        const colors = new Map();
        for (const i of Object.keys(this.colors)) {
            colors[i] = this.colors[i];
        }

        return new PaletteColorizer(colors, this.noDataColor.clone(), this.defaultColor.clone());
    }

    toDict(): ColorizerDict {
        const colors = {};
        for (const i of Object.keys(this.colors)) {
            colors[i] = colorToDict(this.colors[i]);
        }

        return {
            Palette: {
                colors,
                no_data_color: colorToDict(this.noDataColor),
                default_color: colorToDict(this.defaultColor),
            },
        };
    }

    isGradient(): boolean {
        return false;
    }

    isDiscrete(): boolean {
        return true;
    }

    getColorAtIndex(index: number): Color {
        const key = Array.from(this.colors.keys())[index];
        return this.colors[key];
    }

    getNumberOfColors(): number {
        return this.colors.size;
    }
}
