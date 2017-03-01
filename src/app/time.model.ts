/**
 * Created by droenner on 28.02.2017.
 */
import * as moment from 'moment';
import DurationInputArg2 = moment.DurationInputArg2;

export type TimeType = 'TimePoint' | 'TimeInterval' | 'TimeComplex';

export interface TimeDict {
    type: TimeType;
}

export function timeFromDict(dict: TimeDict) {
    switch (dict.type) {
        case 'TimePoint': return TimePoint.fromDict(dict as TimePointDict);
        case 'TimeInterval': return TimeInterval.fromDict(dict as TimeIntervalDict);
    }
}

export interface Time {
    getType(): TimeType;
    getStart(): moment.Moment;
    getEnd(): moment.Moment;
    // getFormatString(): string;
    add(durationAmount: moment.DurationInputArg1, durationUnit?: DurationInputArg2): Time;
    subtract(durationAmount: moment.DurationInputArg1, durationUnit?: DurationInputArg2): Time;
    clone(): Time;
    asDict(): TimeDict;
    isSame(other: Time): boolean;
    isValid(): boolean;
    asRequestString(): string;
}

export interface TimePointDict extends TimeDict {
    start: string;
}

export class TimePoint implements Time {
    start: moment.Moment;

    constructor(start: moment.MomentInput) {
        this.start = moment(start);
    }

    getType(): TimeType {
        return 'TimePoint';
    }

    static fromDict(dict: TimePointDict): TimePoint {
        return new TimePoint(dict.start);
    }

    getStart(): moment.Moment {
        return this.start;
    }

    getEnd(): moment.Moment {
        return this.getStart();
    }

    add(durationAmount: moment.DurationInputArg1, durationUnit?: DurationInputArg2): TimePoint {
        return new TimePoint(this.start.add(durationAmount, durationUnit));
    }

    subtract(durationAmount: moment.DurationInputArg1, durationUnit?: DurationInputArg2): TimePoint {
        return new TimePoint(this.start.subtract(durationAmount, durationUnit));
    }

    clone(): TimePoint {
        return new TimePoint(this.start.clone());
    }

    asDict(): TimePointDict {
        return {type: this.getType(), start: this.getStart().toISOString()};
    }

    isSame(other: Time): boolean {
        return (
            !!other
            && this.getType() === other.getType()
            && this.getStart().isSame(other.getStart())
            && this.getEnd().isSame(other.getEnd())
        );
    }

    isValid(): boolean {
        return !!this.getStart() && this.getStart().isValid();
    }

    asRequestString(): string {
        return this.getStart().toISOString();
    }
}

export interface TimeIntervalDict extends TimePointDict {
    end: string;
}

export class TimeInterval implements Time {
    start: moment.Moment;
    end: moment.Moment;

    constructor(start: moment.MomentInput, end: moment.MomentInput) {
        this.start = moment(start);
        this.end = moment(end);
    }

    static fromDict(dict: TimeIntervalDict): TimeInterval {
        return new TimeInterval(dict.start, dict.end);
    }

    getType(): TimeType {
        return 'TimeInterval';
    }

    getStart(): moment.Moment {
        return this.start;
    }

    getEnd(): moment.Moment {
        return this.end;
    }

    add(durationAmount: moment.DurationInputArg1, durationUnit?: DurationInputArg2): TimeInterval {
        return new TimeInterval(
            this.start.add(durationAmount, durationUnit),
            this.end.add(durationAmount, durationUnit)
        );
    }

    subtract(durationAmount: moment.DurationInputArg1, durationUnit?: DurationInputArg2){
        return new TimeInterval(
            this.start.subtract(durationAmount, durationUnit),
            this.end.subtract(durationAmount, durationUnit)
        );
    }

    clone(): TimeInterval {
        return new TimeInterval(this.start.clone(), this.end.clone());
    }

    asDict(): TimeIntervalDict {
        return {type: this.getType(), start: this.getStart().toISOString(), end: this.getEnd().toISOString()};
    }

    isSame(other: Time): boolean {
        return (
            !!other
            && this.getType() === other.getType()
            && this.getStart().isSame(other.getStart())
            && this.getEnd().isSame(other.getEnd())
        );
    }

    isValid(): boolean {
        return !!this.getStart() && !!this.getEnd() && this.getStart().isValid() && this.getEnd().isValid();
    }

    asRequestString(): string {
        return this.getStart().toISOString() + '\\' + this.getEnd().toISOString();
    }
}

export class TimeComplex {

}
