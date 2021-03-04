import {Map as ImmutableMap} from 'immutable';

/**
 * A unit can have three types of interpolation between values.
 *  * Unknown - no information about interpolation between values
 *  * Continuous - it is okay to (linearly) scale in between values
 *  * Discrete - the unit states discrete values, e.g. for a classification
 */
export const enum Interpolation {
    Unknown = 0,
    Continuous = 1,
    Discrete = 2,
}

/**
 * String serialization for interpolation variants
 */
export const interpolationToName = (interpolation: Interpolation): string => {
    'use strict';
    switch (interpolation) {
        case Interpolation.Unknown:
            return 'unknown';
        case Interpolation.Continuous:
            return 'continuous';
        case Interpolation.Discrete:
            return 'discrete';
        default:
            throw new Error('Unknown Unit Interpolation');
    }
};

/**
 * String deserialization for interpolation variants
 */
export const nameToInterpolation = (name: string): Interpolation => {
    'use strict';
    if (name === interpolationToName(Interpolation.Continuous)) {
        return Interpolation.Continuous;
    }
    if (name === interpolationToName(Interpolation.Discrete)) {
        return Interpolation.Discrete;
    }
    return Interpolation.Unknown;
};

/**
 * A name of a classification value
 */
type Class = string;

/**
 * Input of the unit constructor.
 */
export interface UnitConfig {
    measurement: string;
    unit: string;
    min?: number;
    max?: number;
    interpolation: Interpolation;
    classes?: Map<number, Class> | ImmutableMap<number, Class>;
}

/**
 * Serialization of the unit for storage
 */
export interface UnitDict {
    measurement: string;
    unit: string;
    min?: number;
    max?: number;
    interpolation: number;
    classes: {[index: number]: string};
}

/**
 * Serialization of a unit for queries to the backend
 */
export interface UnitMappingDict {
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
    private static _defaultUnit = new Unit({
        measurement: 'unknown',
        unit: 'unknown',
        interpolation: Interpolation.Continuous,
    });

    private readonly _measurement: string;
    private readonly _unit: string;
    private readonly _min: number;
    private readonly _max: number;
    private readonly _interpolation: Interpolation;
    private readonly _classes: ImmutableMap<number, Class>;

    /**
     * Create a new unit with all parameters specified upfront
     */
    constructor(config: UnitConfig) {
        this._measurement = config.measurement;
        this._unit = config.unit;
        this._min = config.min;
        this._max = config.max;
        this._interpolation = config.interpolation;
        if (config.classes) {
            if (config.classes instanceof ImmutableMap) {
                this._classes = config.classes as ImmutableMap<number, Class>;
            } else {
                this._classes = ImmutableMap<number, Class>(config.classes as Map<number, Class>);
            }
        }
    }

    /**
     * Deserialize a unit from a `UnitDict`
     */
    static fromDict(dict: UnitDict): Unit {
        const classes = new Map<number, Class>();
        if (dict.classes !== undefined) {
            // eslint-disable-next-line guard-for-in
            for (const className in dict.classes) {
                classes.set(parseFloat(className), dict.classes[className]);
            }
        }
        const config: UnitConfig = {
            measurement: dict.measurement,
            unit: dict.unit,
            min: dict.min,
            max: dict.max,
            interpolation: dict.interpolation,
            classes,
        };
        return new Unit(config);
    }

    /**
     * Deserialize a unit from unit information from the backend
     */
    static fromMappingDict(dict: UnitMappingDict): Unit {
        let interpolation = !!dict.interpolation ? nameToInterpolation(dict.interpolation) : Interpolation.Unknown;
        const classes = new Map<number, Class>();
        if (dict.classes !== undefined) {
            if (interpolation === Interpolation.Unknown) {
                interpolation = Interpolation.Discrete;
            }
            // eslint-disable-next-line guard-for-in
            for (const className in dict.classes) {
                classes.set(parseFloat(className), dict.classes[className]);
            }
        }
        const config: UnitConfig = {
            measurement: dict.measurement,
            unit: dict.unit,
            min: dict.min,
            max: dict.max,
            interpolation,
            classes,
        };
        return new Unit(config);
    }

    /**
     * Default unit without further information (=> unitless)
     */
    static get defaultUnit(): Unit {
        return Unit._defaultUnit;
    }

    /**
     * What do the values measures?
     */
    get measurement(): string {
        return this._measurement;
    }

    /**
     * What is the unit of the measured values?
     */
    get unit(): string {
        return this._unit;
    }

    /**
     * Return a minimum value for this unit
     */
    get min(): number {
        return this._min;
    }

    /**
     * Return a maximum value for this unit
     */
    get max(): number {
        return this._max;
    }

    /**
     * Return the interpolation for this unit
     */
    get interpolation(): Interpolation {
        return this._interpolation;
    }

    /**
     * Return a map of classes of this unit.
     * This is empty if the unit is no classification.
     */
    get classes(): ImmutableMap<number, Class> {
        return this._classes;
    }

    /**
     * Human-readable, concise string serialization of a unit
     */
    toString(): string {
        const output = [];
        if (this.measurement !== 'unknown') {
            output.push(this.measurement);

            if (this.unit !== 'unknown') {
                output.push(` (${this.unit})`);
            }
        }
        return output.join('');
    }

    /**
     * Serialize the unit for storage
     */
    toDict(): UnitDict {
        const classes: {
            [index: number]: string;
        } = this._classes === undefined ? {} : (this._classes.toJS() as {[index: number]: string});

        return {
            measurement: this._measurement,
            unit: this._unit,
            min: this._min,
            max: this._max,
            interpolation: this._interpolation,
            classes,
        };
    }

    /**
     * Serialize the unit for queries to the backend
     */
    toMappingDict(): UnitMappingDict {
        const dict: UnitMappingDict = {
            measurement: this._measurement,
            unit: this._unit,
            interpolation: interpolationToName(this._interpolation),
        };

        if (this._min !== undefined) {
            dict.min = this._min;
        }
        if (this._max !== undefined) {
            dict.max = this._max;
        }
        if (this._unit === 'classification') {
            dict['classes'] = this._classes.toJS() as {[index: number]: string};
        }

        return dict;
    }
}
