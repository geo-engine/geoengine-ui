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
    @Input() inputType: 'number' | 'string' = 'number';
    @Input() attributePlaceholder = 'attribute';
    @Input() colorPlaceholder: 'color';

    onTouched: () => void;
    onChange: (_: ColorBreakpoint) => void = undefined;

    private _colorBreakpoint: ColorBreakpoint;

    constructor(private changeDetectorRef: ChangeDetectorRef) {}

    get colorBreakpoint(): ColorBreakpoint {
        return this._colorBreakpoint;
    }

    // set accessor including call the onchange callback
    set colorBreakpoint(breakpoint: ColorBreakpoint) {
        if (breakpoint && !breakpoint.equals(this._colorBreakpoint)) {
            this._colorBreakpoint = breakpoint;
        }
    }

    updateValue(value: number | string): void {
        if (value && value !== this.colorBreakpoint.value) {
            if (this.inputType === 'number' && typeof value === 'string') {
                this.colorBreakpoint.setValue(parseFloat(value as string));
            } else {
                this.colorBreakpoint.setValue(value);
            }
            this.propagateChange();
        }
    }

    updateColor(color: string): void {
        // TODO: should this really clone?
        if (color) {
            const clr = Color.fromRgbaLike(stringToRgbaStruct(color));
            if (!clr.equals(this._colorBreakpoint.rgba)) {
                this.colorBreakpoint.setColor(clr);
            }
            this.propagateChange();
        }
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
