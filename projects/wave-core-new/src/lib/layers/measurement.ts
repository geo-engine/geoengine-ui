import {MeasurementDict, ToDict} from '../backend/backend.model';
import * as Immutable from 'immutable';

export abstract class Measurement implements ToDict<'unitless' | MeasurementDict> {
    abstract readonly measurement: string;

    static fromDict(dict: 'unitless' | MeasurementDict): Measurement {
        if (dict === 'unitless') {
            return new UnitlessMeasurement();
        }

        if (dict.continuous) {
            const continuous = dict.continuous;
            return new ContinuousMeasurement(continuous.measurement, continuous.unit);
        }

        if (dict.classification) {
            const classification = dict.classification;
            return new ClassificationMeasurement(classification.measurement, classification.classes);
        }

        throw new Error('unable to deserialize `Measurement`');
    }

    abstract toDict(): 'unitless' | MeasurementDict;
}

export class UnitlessMeasurement extends Measurement {
    readonly measurement = '';

    constructor() {
        super();
    }

    toDict(): 'unitless' {
        return 'unitless';
    }
}

export class ContinuousMeasurement extends Measurement {
    readonly measurement: string;
    readonly unit?: string;

    constructor(measurement: string, unit?: string) {
        super();

        this.measurement = measurement;
        this.unit = unit;
    }

    toDict(): MeasurementDict {
        return {
            continuous: {
                measurement: this.measurement,
                unit: this.unit,
            },
        };
    }
}

export class ClassificationMeasurement extends Measurement {
    readonly measurement: string;
    readonly classes: Immutable.Map<number, string>;

    constructor(measurement: string, classes: {[key: number]: string}) {
        super();

        this.measurement = measurement;

        let classMap = Immutable.Map<number, string>();
        for (const classesKey of Object.keys(classes)) {
            const classesKeyNumber = parseInt(classesKey, 10);
            classMap = classMap.set(classesKeyNumber, classes[classesKeyNumber]);
        }

        this.classes = Immutable.Map(classMap);
    }

    toDict(): MeasurementDict {
        return {
            classification: {
                measurement: this.measurement,
                classes: this.classes.toObject(),
            },
        };
    }
}
