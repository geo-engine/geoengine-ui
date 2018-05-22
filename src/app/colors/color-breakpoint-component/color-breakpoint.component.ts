import {
    Component, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit,
    Input, forwardRef, OnChanges, SimpleChanges
} from '@angular/core';

import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {ColorBreakpoint} from '../color-breakpoint.model';
import {Color, stringToRgbaStruct} from '../color';



@Component({
    selector: 'wave-color-breakpoint',
    templateUrl: './color-breakpoint.component.html',
    styleUrls: ['./color-breakpoint.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ColorBreakpointInputComponent), multi: true},
    ],
})
export class ColorBreakpointInputComponent implements  ControlValueAccessor, AfterViewInit, OnChanges {

    @Input() disabledAttribute: false;
    @Input() disabledColor: false;
    @Input() inputType: 'number' | 'string' = 'number';
    @Input() attributePlaceholder: 'attribute';
    @Input() colorPlaceholder: 'color';

    private _colorBreakpoint: ColorBreakpoint;
    onTouched: () => void;
    onChange: (_: ColorBreakpoint) => void = undefined;

    constructor(private changeDetectorRef: ChangeDetectorRef) {}

    get colorBreakpoint(): ColorBreakpoint {
        return this._colorBreakpoint;
    };

    // set accessor including call the onchange callback
    set colorBreakpoint(brk: ColorBreakpoint) {
        if (brk && (!this._colorBreakpoint || !brk.equals(this._colorBreakpoint))) {
            this._colorBreakpoint = brk;
            this.propagateChange();
        }
    }

    updateValue(value: number | string) {
        if (value && value !== this.colorBreakpoint.value) {
            if (this.inputType === 'number' && typeof value === 'string') {
                this.colorBreakpoint = this.colorBreakpoint.cloneWithValue(parseFloat(value as string));
            } else {
                this.colorBreakpoint = this.colorBreakpoint.cloneWithValue(value);
            }
        }
    }

    updateColor(color: string) {
        if (color) {
            const clr = Color.fromRgbaLike(stringToRgbaStruct(color));
            if (clr !== this.colorBreakpoint.rgba) {
                this.colorBreakpoint = this.colorBreakpoint.cloneWithColor(clr);
            }
        }
    }

    ngAfterViewInit() {
        setTimeout(() => this.changeDetectorRef.markForCheck(), 0);
    }

    ngOnChanges(changes: SimpleChanges) {
        console.log('ColorBreakpointInputComponent', changes);
        this.changeDetectorRef.markForCheck();
    }

    // Set touched on blur
    onBlur() {
        this.onTouched();
    }

    writeValue(brk: ColorBreakpoint): void {
        console.log('writeValue', brk);
        this.colorBreakpoint = brk;
    }

    registerOnChange(fn: (_: ColorBreakpoint) => void): void {
        this.onChange = fn;
        this.propagateChange();
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    private propagateChange() {
        this.changeDetectorRef.markForCheck();

        if (this.onChange) {
            this.onChange(this.colorBreakpoint);
        }
    }

}
