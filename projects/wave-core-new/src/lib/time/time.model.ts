import {DurationInputArg1, DurationInputArg2, Moment, MomentInput, utc} from 'moment';
import {TimeIntervalDict, ToDict} from '../backend/backend.model';

export type TimeType = 'TimePoint' | 'TimeInterval';

export interface TimeStepDuration {
    durationAmount: DurationInputArg1;
    durationUnit: DurationInputArg2;
}

export class Time implements ToDict<TimeIntervalDict> {
    _start: Moment;
    _end: Moment;

    static fromDict(dict: TimeIntervalDict): Time {
        return new Time(dict.start, dict.end);
    }

    constructor(start: MomentInput, end: MomentInput) {
        this._start = utc(start);
        this._end = utc(end);
    }

    toDict(): TimeIntervalDict {
        return {
            start: this.start.valueOf(),
            end: this.end.valueOf(),
        };
    }

    get type(): TimeType {
        if (this.start === this.end) {
            return 'TimePoint';
        } else {
            return 'TimeInterval';
        }
    }

    get start(): Moment {
        return this._start;
    }

    get end(): Moment {
        return this._end;
    }

    add(durationAmount: DurationInputArg1, durationUnit?: DurationInputArg2): Time {
        return new Time(
            this.start.add(durationAmount, durationUnit),
            this.end.add(durationAmount, durationUnit)
        );
    }

    subtract(durationAmount: DurationInputArg1, durationUnit?: DurationInputArg2): Time {
        return new Time(
            this.start.subtract(durationAmount, durationUnit),
            this.end.subtract(durationAmount, durationUnit)
        );
    }

    clone(): Time {
        return new Time(this.start.clone(), this.end.clone());
    }

    isSame(other: Time): boolean {
        return (
            !!other
            && this.type === other.type
            && this.start.isSame(other.start)
            && this.end.isSame(other.end)
        );
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
