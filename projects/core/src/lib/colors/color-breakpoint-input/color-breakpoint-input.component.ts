import {Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, forwardRef, OnChanges, SimpleChanges, OnDestroy} from '@angular/core';

import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {ColorBreakpoint} from '../color-breakpoint.model';
import {Color, stringToRgbaStruct, TRANSPARENT} from '../color';
import {Subject, Subscription} from 'rxjs';
import {Config} from '../../config.service';
import {debounceTime} from 'rxjs/operators';

@Component({
    selector: 'geoengine-color-breakpoint',
    templateUrl: './color-breakpoint-input.component.html',
    styleUrls: ['./color-breakpoint-input.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ColorBreakpointInputComponent), multi: true}],
})
export class ColorBreakpointInputComponent implements ControlValueAccessor, OnChanges, OnDestroy {
    @Input() readonlyAttribute = false;
    @Input() readonlyColor = false;
    @Input() attributePlaceholder = 'attribute';
    @Input() colorPlaceholder = 'color';

    private input: ColorBreakpoint = new ColorBreakpoint(0, TRANSPARENT);
    private changedValue = new Subject<ColorBreakpoint>();
    private onChangePropagationSubscription: Subscription;

    constructor(private config: Config, private changeDetectorRef: ChangeDetectorRef) {
        this.onChangePropagationSubscription = this.changedValue
            .pipe(debounceTime(this.config.DELAYS.DEBOUNCE)) // defer emitting values while the user is typing
            .subscribe((colorBreakpoint) => this.onChange(colorBreakpoint.clone()));
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onTouched = (): void => {};
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onChange = (_: ColorBreakpoint): void => {};

    ngOnDestroy(): void {
        this.onChangePropagationSubscription.unsubscribe();
    }

    get colorBreakpoint(): ColorBreakpoint {
        return this.input;
    }

    // set accessor including call the onchange callback
    set colorBreakpoint(breakpoint: ColorBreakpoint) {
        if (this.input && breakpoint.equals(this.input)) {
            return;
        }

        this.input = breakpoint;
    }

    updateValue(value: number): void {
        if (value === undefined || value === null || value === this.colorBreakpoint.value) {
            return;
        }

        this.colorBreakpoint.setValue(value);
        this.propagateChange();
    }

    updateColor(value: string): void {
        if (!value) {
            return;
        }

        let color: Color;
        try {
            color = Color.fromRgbaLike(stringToRgbaStruct(value));
        } catch (_error) {
            return;
        }

        this.input.setColor(color);

        this.propagateChange();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.inputType || changes.attributePlaceholder || changes.colorPlaceholder) {
            this.changeDetectorRef.markForCheck();
        }
    }

    // Set touched on blur
    onBlur(): void {
        this.onTouched();
    }

    writeValue(colorBreakpoint: ColorBreakpoint | null): void {
        if (!colorBreakpoint || colorBreakpoint.equals(this.colorBreakpoint)) {
            return;
        }

        this.colorBreakpoint = colorBreakpoint.clone();
    }

    registerOnChange(fn: (_: ColorBreakpoint) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    private propagateChange(): void {
        if (this.colorBreakpoint) {
            this.changedValue.next(this.colorBreakpoint);
        }
    }
}
