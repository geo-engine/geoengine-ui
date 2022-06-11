import {DurationInputArg1, DurationInputArg2, Moment, MomentInput, utc} from 'moment';
import {TimeIntervalDict, TimeStepDict, TimeStepGranularityDict, ToDict} from '../backend/backend.model';

export type TimeType = 'TimePoint' | 'TimeInterval';

type TimeStepDurationType =
    | 'millisecond'
    | 'milliseconds'
    | 'second'
    | 'seconds'
    | 'minute'
    | 'minutes'
    | 'hour'
    | 'hours'
    | 'day'
    | 'days'
    | 'month'
    | 'months'
    | 'year'
    | 'years';

export interface TimeStepDuration {
    durationAmount: number;
    durationUnit: TimeStepDurationType;
}

export const timeStepDurationToTimeStepDict = (duration: TimeStepDuration): TimeStepDict => {
    const mapGranularity = (durationUnit: TimeStepDurationType): TimeStepGranularityDict => {
        switch (durationUnit) {
            case 'millisecond':
            case 'milliseconds':
                return 'millis';
            case 'second':
            case 'seconds':
                return 'seconds';
            case 'minute':
            case 'minutes':
                return 'minutes';
            case 'hour':
            case 'hours':
                return 'hours';
            case 'day':
            case 'days':
                return 'days';
            case 'month':
            case 'months':
                return 'months';
            case 'year':
            case 'years':
                return 'years';
        }
    };

    return {
        step: duration.durationAmount,
        granularity: mapGranularity(duration.durationUnit),
    };
};

export const timeStepDurationToDurationInputArg2 = (durationUnit: TimeStepDurationType): DurationInputArg2 => {
    switch (durationUnit) {
        case 'millisecond':
        case 'milliseconds':
            return 'millisecond';
        case 'second':
        case 'seconds':
            return 'second';
        case 'minute':
        case 'minutes':
            return 'minute';
        case 'hour':
        case 'hours':
            return 'hour';
        case 'day':
        case 'days':
            return 'day';
        case 'month':
        case 'months':
            return 'month';
        case 'year':
        case 'years':
            return 'year';
    }
};

export const timeStepDictTotimeStepDuration = (timeStepDict: TimeStepDict): TimeStepDuration => {
    const mapGranularity = (granularity: TimeStepGranularityDict, plural: boolean): TimeStepDurationType => {
        switch (granularity) {
            case 'millis':
                return plural ? 'milliseconds' : 'millisecond';
            case 'seconds':
                return plural ? 'seconds' : 'second';
            case 'minutes':
                return plural ? 'minutes' : 'minute';
            case 'hours':
                return plural ? 'hours' : 'hour';
            case 'days':
                return plural ? 'days' : 'day';
            case 'months':
                return plural ? 'months' : 'month';
            case 'years':
                return plural ? 'years' : 'year';
        }
    };

    return {
        durationAmount: timeStepDict.step,
        durationUnit: mapGranularity(timeStepDict.granularity, timeStepDict.step > 1),
    };
};

export class Time implements ToDict<TimeIntervalDict> {
    readonly start: Moment;
    readonly end: Moment;

    constructor(start: MomentInput, end?: MomentInput) {
        this.start = utc(start);
        if (end) {
            this.end = utc(end);
        } else {
            this.end = this.start.clone();
        }
    }

    static fromDict(dict: TimeIntervalDict): Time {
        return new Time(dict.start, dict.end);
    }

    toDict(): TimeIntervalDict {
        return {
            start: this.start.valueOf(),
            end: this.end.valueOf(),
        };
    }

    get type(): TimeType {
        if (this.start.isSame(this.end)) {
            return 'TimePoint';
        } else {
            return 'TimeInterval';
        }
    }

    add(durationAmount: DurationInputArg1, durationUnit?: DurationInputArg2): Time {
        return new Time(this.start.clone().add(durationAmount, durationUnit), this.end.clone().add(durationAmount, durationUnit));
    }

    addDuration(timeStepDuration: TimeStepDuration): Time {
        return this.add(timeStepDuration.durationAmount, timeStepDurationToDurationInputArg2(timeStepDuration.durationUnit));
    }

    subtract(durationAmount: DurationInputArg1, durationUnit?: DurationInputArg2): Time {
        return new Time(this.start.clone().subtract(durationAmount, durationUnit), this.end.clone().subtract(durationAmount, durationUnit));
    }

    clone(): Time {
        return new Time(this.start.clone(), this.end.clone());
    }

    isSame(other: Time): boolean {
        return !!other && this.type === other.type && this.start.isSame(other.start) && this.end.isSame(other.end);
    }

    isValid(): boolean {
        return !!this.start && !!this.end && this.start.isValid() && this.end.isValid() && this.start <= this.end;
    }

    asRequestString(): string {
        switch (this.type) {
            case 'TimePoint':
                return this.start.toISOString();
            case 'TimeInterval':
                return `${this.start.toISOString()}/${this.end.toISOString()}`;
        }
    }

    toString(): string {
        switch (this.type) {
            case 'TimePoint':
                return this.start.format('DD.MM.YYYY HH:mm:ss');
            case 'TimeInterval':
                const start = this.start.format('DD.MM.YYYY HH:mm:ss');
                const end = this.end.format('DD.MM.YYYY HH:mm:ss');
                return `${start} - ${end}`;
        }
    }
}
