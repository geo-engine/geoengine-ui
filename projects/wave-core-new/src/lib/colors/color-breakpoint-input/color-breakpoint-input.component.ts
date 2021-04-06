import {
    Component,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    AfterViewInit,
    Input,
    forwardRef,
    OnChanges,
    SimpleChanges,
} from '@angular/core';

import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {ColorBreakpoint} from '../color-breakpoint.model';
import {Color, stringToRgbaStruct} from '../color';

@Component({
    selector: 'wave-color-breakpoint',
    templateUrl: './color-breakpoint.component.html',
    styleUrls: ['./color-breakpoint.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ColorBreakpointInputComponent), multi: true}],
})
export class ColorBreakpointInputComponent implements ControlValueAccessor, AfterViewInit, OnChanges {
    @Input() editAttribute: false;
    @Input() editColor: false;
    @Input() attributePlaceholder = 'attribute';
    @Input() colorPlaceholder: 'color';

    onTouched: () => void;
    onChange: (_: ColorBreakpoint) => void = undefined;

    private input: ColorBreakpoint;

    constructor(private changeDetectorRef: ChangeDetectorRef) {}

    get colorBreakpoint(): ColorBreakpoint {
        return this.input;
    }

    // set accessor including call the onchange callback
    set colorBreakpoint(breakpoint: ColorBreakpoint) {
        if (breakpoint && !breakpoint.equals(this.input)) {
            this.input = breakpoint;
        }
    }

    updateValue(value: number): void {
        if (value && value !== this.colorBreakpoint.value) {
            this.colorBreakpoint.setValue(value);
            this.propagateChange();
        }
    }

    updateColor(value: string): void {
        if (!value) {
            return;
        }

        const color = Color.fromRgbaLike(stringToRgbaStruct(value));

        this.input.setColor(color);

        this.propagateChange();
    }

    ngAfterViewInit(): void {
        // setTimeout(() => this.changeDetectorRef.markForCheck());
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

    writeValue(brk: ColorBreakpoint): void {
        this.colorBreakpoint = brk;
    }

    registerOnChange(fn: (_: ColorBreakpoint) => void): void {
        this.onChange = fn;
        this.propagateChange();
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    private propagateChange(): void {
        if (this.onChange && this.colorBreakpoint) {
            this.onChange(this.colorBreakpoint.clone());
        }
    }
}
