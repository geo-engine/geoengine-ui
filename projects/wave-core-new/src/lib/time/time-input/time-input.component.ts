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
import {Moment, unitOfTime} from 'moment';

@Component({
    selector: 'wave-time-input',
    templateUrl: './time-input.component.html',
    styleUrls: ['./time-input.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TimeInputComponent), multi: true}],
})
export class TimeInputComponent implements ControlValueAccessor, AfterViewInit, OnChanges {
    @Input() disabled: false;

    private _time: Moment;
    onTouched: () => void;
    onChange: (_: Moment) => void = undefined;

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

    ngAfterViewInit() {
        setTimeout(() => this.changeDetectorRef.markForCheck(), 0);
    }

    ngOnChanges(changes: {[propName: string]: SimpleChange}) {
        this.changeDetectorRef.markForCheck();
    }

    // Set touched on blur
    onBlur() {
        this.onTouched();
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

    update(timeUnit: unitOfTime.Base, value: number) {
        if (value) {
            this.time.set(timeUnit, value);
            this.propagateChange();
        }
    }

    updateDate(value: number) {
        if (value) {
            this.time.date(value);
            this.propagateChange();
        }
    }

    private propagateChange() {
        if (this.onChange) {
            this.onChange(this.time);
        }
    }
}
