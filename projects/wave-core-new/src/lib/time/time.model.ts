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
                return 'Millis';
            case 'second':
            case 'seconds':
                return 'Seconds';
            case 'minute':
            case 'minutes':
                return 'Minutes';
            case 'hour':
            case 'hours':
                return 'Hours';
            case 'day':
            case 'days':
                return 'Days';
            case 'month':
            case 'months':
                return 'Months';
            case 'year':
            case 'years':
                return 'Years';
        }
    };

    return {
        step: duration.durationAmount,
        granularity: mapGranularity(duration.durationUnit),
    };
};

export const timeStepDictTotimeStepDuration = (timeStepDict: TimeStepDict): TimeStepDuration => {
    const mapGranularity = (granularity: TimeStepGranularityDict, plural: boolean): TimeStepDurationType => {
        switch (granularity) {
            case 'Millis':
                return plural ? 'milliseconds' : 'millisecond';
            case 'Seconds':
                return plural ? 'seconds' : 'second';
            case 'Minutes':
                return plural ? 'minutes' : 'minute';
            case 'Hours':
                return plural ? 'hours' : 'hour';
            case 'Days':
                return plural ? 'days' : 'day';
            case 'Months':
                return plural ? 'months' : 'month';
            case 'Years':
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
        return !!this.start && !!this.end && this.start.isValid() && this.end.isValid();
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
