export const enum Interpolation {
    Unknown = 0,
    Continuous = 1,
    Discrete = 2,
}

function interpolationToName(interpolation: Interpolation) {
    switch (interpolation) {
        case Interpolation.Unknown:
            return "unknown";
        case Interpolation.Continuous:
            return "continuous";
        case Interpolation.Discrete:
            return "discrete";
    }
}

type Class = string;

interface UnitConfig {
    measurement: string;
    unit: string;
    min?: number;
    max?: number;
    interpolation: Interpolation;
    classes?: Map<number, Class>;
}

export interface UnitDict {
    measurement: string;
    unit: string;
    min?: number;
    max?: number;
    interpolation: number;
    classes: {[index: number]: string};
}

export interface UnitQueryDict {
    measurement: string;
    unit: string;
    min?: number;
    max?: number;
    interpolation: string;
    classes?: {[index: number]: string};
}

/**
 * A Unit contains semantical information about a set of values (i.e. a raster's pixels or an
 * attribute).
 *
 * These are:
 * - What is measured? e.g. Temperature, Elevation, Precipitation, ...
 * - What unit is the measurement in? e.g. Celsius, Kelvin, Meters, cm/day, ...
 * - Does it have a minimum or maximum value?
 * - is it a continuous or a discrete value (e.g. temperature vs. classification)?
 * - an optional set of parameters, e.g. names for a classification's classes
 *
 * Units can suggest a default colorization.
 */
export class Unit {
    private _measurement: string;
    private _unit: string;
    private _min: number;
    private _max: number;
    private _interpolation: Interpolation;
    private _classes: Map<number, Class>;

    constructor(config: UnitConfig) {
        this._measurement = config.measurement;
        this._unit = config.unit;
        this._min = config.min;
        this._max = config.max;
        this._interpolation = config.interpolation;
        this._classes = config.classes;
    }

    get measurement(): string {
        return this._measurement;
    }

    get unit(): string {
        return this._unit;
    }

    get min(): number {
        return this._min;
    }

    get max(): number {
        return this._max;
    }

    get interpolation(): Interpolation {
        return this._interpolation;
    }

    get classes(): Map<number, Class> {
        return this._classes;
    }

    toString(): string {
        return `${this._measurement} (${this._unit})`;
    }

    toDict(): UnitDict {
        let classes: {[index: number]: string} = {};
        if (this._classes !== undefined) {
            Array.from(this._classes.entries()).forEach(([n, name]) => classes[n] = name);
        }

        return {
            measurement: this._measurement,
            unit: this._unit,
            min: this._min,
            max: this._max,
            interpolation: this._interpolation,
            classes: classes,
        };
    }

    static fromDict(dict: UnitDict): Unit {
        let classes = new Map<number, Class>();
        if (dict.classes !== undefined) {
            for (let className in dict.classes) {
                classes.set(parseFloat(className), dict.classes[className]);
            }
        }
        let config: UnitConfig = {
            measurement: dict.measurement,
            unit: dict.unit,
            min: dict.min,
            max: dict.max,
            interpolation: dict.interpolation,
            classes: classes
        };
        return new Unit(config);
    }

    private static _defaultUnit = new Unit({
        measurement: "raw",
        unit: "unknown",
        interpolation: Interpolation.Continuous,
    });

    static get defaultUnit(): Unit {
        return Unit._defaultUnit;
    }

    toQueryDict(): UnitQueryDict {
        let dict = {
            measurement: this._measurement,
            unit: this._unit,
            interpolation: interpolationToName(this._interpolation),
        };

        if (this._min !== undefined) {
            dict["min"] = this._min;
        }
        if (this._max !== undefined) {
            dict["max"] = this._max;
        }
        if (this._unit === "classification") {
            let classes: {[index: number]: string} = {};
            for (let key in this._classes) {
                classes[key] = this._classes[key];
            }
            dict["classes"] = classes;
        }

        return dict;
    }
}
