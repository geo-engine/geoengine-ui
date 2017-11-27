import {Map as ImmutableMap} from 'immutable';

export const enum Interpolation {
    Unknown = 0,
    Continuous = 1,
    Discrete = 2,
}

function interpolationToName(interpolation: Interpolation): string {
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
}

export function nameToInterpolation(name: string): Interpolation {
    'use strict';
    if (name === interpolationToName(Interpolation.Continuous)) {
        return Interpolation.Continuous;
    }
    if (name === interpolationToName(Interpolation.Discrete)) {
        return Interpolation.Discrete;
    }
    return Interpolation.Unknown;
}

type Class = string;

export interface UnitConfig {
    measurement: string;
    unit: string;
    min?: number;
    max?: number;
    interpolation: Interpolation;
    classes?: Map<number, Class> | ImmutableMap<number, Class>;
}

export interface UnitDict {
    measurement: string;
    unit: string;
    min?: number;
    max?: number;
    interpolation: number;
    classes: {[index: number]: string};
}

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
        measurement: 'raw',
        unit: 'unknown',
        interpolation: Interpolation.Continuous,
    });

    private _measurement: string;
    private _unit: string;
    private _min: number;
    private _max: number;
    private _interpolation: Interpolation;
    private _classes: ImmutableMap<number, Class>;

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
            classes: classes,
        };
        return new Unit(config);
    }

    static fromMappingDict(dict: UnitMappingDict): Unit {
      let interpolation = (!!dict.interpolation) ?
        nameToInterpolation(dict.interpolation) : Interpolation.Unknown;
      let classes = new Map<number, Class>();
      if (dict.classes !== undefined) {
          if (interpolation === Interpolation.Unknown) {
              interpolation = Interpolation.Discrete;
          }
          for (let className in dict.classes) {
              classes.set(parseFloat(className), dict.classes[className]);
          }
      }
      let config: UnitConfig = {
          measurement: dict.measurement,
          unit: dict.unit,
          min: dict.min,
          max: dict.max,
          interpolation: interpolation,
          classes: classes,
      };
      return new Unit(config);
    }

    static get defaultUnit(): Unit {
        return Unit._defaultUnit;
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

    get classes(): ImmutableMap<number, Class> {
        return this._classes;
    }

    toString(): string {
        return `${this._measurement} (${this._unit})`;
    }

    toDict(): UnitDict {
        let classes: {
            [index: number]: string
        } = this._classes === undefined ? {} : this._classes.toJS() as {[index: number]: string};

        return {
            measurement: this._measurement,
            unit: this._unit,
            min: this._min,
            max: this._max,
            interpolation: this._interpolation,
            classes: classes,
        };
    }

    toMappingDict(): UnitMappingDict {
        let dict: UnitMappingDict = {
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
