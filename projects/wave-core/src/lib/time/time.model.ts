import {DurationInputArg1, DurationInputArg2, Moment, MomentInput, utc} from 'moment';

export type TimeType = 'TimePoint' | 'TimeInterval' | 'TimeComplex';

export interface TimeDict {
    type: TimeType;
}

export function timeFromDict(dict: TimeDict) {
    switch (dict.type) {
        case 'TimePoint':
            return TimePoint.fromDict(dict as TimePointDict);
        case 'TimeInterval':
            return TimeInterval.fromDict(dict as TimeIntervalDict);
        default:
            console.error('INVALID TIME REPRESENTATION', dict);
            throw Error('invalid time representation');
    }
}

export interface TimeStepDuration {
    durationAmount: DurationInputArg1;
    durationUnit: DurationInputArg2;
}

export interface Time {
    getType(): TimeType;

    getStart(): Moment;

    getEnd(): Moment;

    // getFormatString(): string;
    add(durationAmount: DurationInputArg1, durationUnit?: DurationInputArg2): Time;

    subtract(durationAmount: DurationInputArg1, durationUnit?: DurationInputArg2): Time;

    clone(): Time;

    asDict(): TimeDict;

    isSame(other: Time): boolean;

    isValid(): boolean;

    asRequestString(): string;

    toString(): string;
}

export interface TimePointDict extends TimeDict {
    start: string;
}

export class TimePoint implements Time {
    start: Moment;

    static fromDict(dict: TimePointDict): TimePoint {
        return new TimePoint(dict.start);
    }

    constructor(start: MomentInput) {
        this.start = utc(start);
    }

    getType(): TimeType {
        return 'TimePoint';
    }

    getStart(): Moment {
        return this.start;
    }

    getEnd(): Moment {
        return this.getStart();
    }

    add(durationAmount: DurationInputArg1, durationUnit?: DurationInputArg2): TimePoint {
        return new TimePoint(this.start.add(durationAmount, durationUnit));
    }

    subtract(durationAmount: DurationInputArg1, durationUnit?: DurationInputArg2): TimePoint {
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

    toString(): string {
        return this.getStart().format('DD.MM.YYYY HH:mm:ss');
    }
}

export interface TimeIntervalDict extends TimePointDict {
    end: string;
}

export class TimeInterval implements Time {
    start: Moment;
    end: Moment;

    static fromDict(dict: TimeIntervalDict): TimeInterval {
        return new TimeInterval(dict.start, dict.end);
    }

    // TODO: check if this makes sense
    static maximal(): TimeInterval {
        const min = {
            years: 1,
            months: 0,
            date: 1,
            hours: 1,
            minutes: 0,
            seconds: 0,
            milliseconds: 0,
        };
        const max = {
            years: 9999,
            months: 11,
            date: 31,
            hours: 23,
            minutes: 59,
            seconds: 59,
            milliseconds: 999,
        };
        return new TimeInterval(min, max);
    }

    constructor(start: MomentInput, end: MomentInput) {
        this.start = utc(start);
        this.end = utc(end);

        if (this.start === this.end) {
            this.end = this.end.clone();
        }
    }

    getType(): TimeType {
        return 'TimeInterval';
    }

    getStart(): Moment {
        return this.start;
    }

    getEnd(): Moment {
        return this.end;
    }

    add(durationAmount: DurationInputArg1, durationUnit?: DurationInputArg2): TimeInterval {
        return new TimeInterval(
            this.start.add(durationAmount, durationUnit),
            this.end.add(durationAmount, durationUnit)
        );
    }

    subtract(durationAmount: DurationInputArg1, durationUnit?: DurationInputArg2) {
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
        return this.getStart().toISOString() + '/'
            + ((this.getStart().isSame(this.getEnd()))
                ? this.getEnd().add(1, 'millisecond').toISOString() : this.getEnd().toISOString());
    }

    toString(): string {
        const start = this.getStart().format('DD.MM.YYYY HH:mm:ss');
        const end = this.getEnd().format('DD.MM.YYYY HH:mm:ss');
        return `${start} - ${end}`;
    }
}
