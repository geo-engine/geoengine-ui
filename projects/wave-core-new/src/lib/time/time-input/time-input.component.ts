import {
    Component,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    AfterViewInit,
    Input,
    forwardRef,
    OnChanges,
    SimpleChange,
} from '@angular/core';

import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import moment, {Moment, unitOfTime} from 'moment';

@Component({
    selector: 'wave-time-input',
    templateUrl: './time-input.component.html',
    styleUrls: ['./time-input.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TimeInputComponent), multi: true}],
})
export class TimeInputComponent implements ControlValueAccessor, AfterViewInit, OnChanges {
    @Input() disabled = false;

    onTouched?: () => void;
    onChange?: (_: Moment) => void = undefined;

    private _time: Moment = moment.utc();

    constructor(private changeDetectorRef: ChangeDetectorRef) {}

    get time(): Moment {
        return this._time;
    }

    // set accessor including call the onchange callback
    set time(time: Moment) {
        if (time !== this._time) {
            this._time = time;
            if (this.onChange) {
                this.onChange(time);
            }
        }
    }

    ngAfterViewInit(): void {
        setTimeout(() => this.changeDetectorRef.markForCheck(), 0);
    }

    ngOnChanges(_changes: {[propName: string]: SimpleChange}): void {
        this.changeDetectorRef.markForCheck();
    }

    // Set touched on blur
    onBlur(): void {
        if (this.onTouched) {
            this.onTouched();
        }
    }

    writeValue(time: Moment): void {
        this.time = time;
        this.changeDetectorRef.markForCheck();
    }

    registerOnChange(fn: (_: Moment) => void): void {
        this.onChange = fn;
        this.propagateChange();
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    update(timeUnit: unitOfTime.Base, value: number): void {
        if (value) {
            this.time.set(timeUnit, value);
            this.propagateChange();
        }
    }

    updateDate(value: number): void {
        if (value) {
            this.time.date(value);
            this.propagateChange();
        }
    }

    private propagateChange(): void {
        if (this.onChange) {
            this.onChange(this.time);
        }
    }
}
