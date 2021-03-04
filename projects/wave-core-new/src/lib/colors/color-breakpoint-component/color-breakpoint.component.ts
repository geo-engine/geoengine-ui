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
    @Input() disabledAttribute: false;
    @Input() disabledColor: false;
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
    set colorBreakpoint(brk: ColorBreakpoint) {
        if (brk && !brk.equals(this._colorBreakpoint)) {
            this._colorBreakpoint = brk;
        }
    }

    updateValue(value: number | string) {
        // TODO: should this really clone?
        if (value && value !== this.colorBreakpoint.value) {
            if (this.inputType === 'number' && typeof value === 'string') {
                this.colorBreakpoint.setValue(parseFloat(value as string));
            } else {
                this.colorBreakpoint.setValue(value);
            }
            this.propagateChange();
        }
    }

    updateColor(color: string) {
        // TODO: should this really clone?
        if (color) {
            const clr = Color.fromRgbaLike(stringToRgbaStruct(color));
            if (!clr.equals(this._colorBreakpoint.rgba)) {
                this.colorBreakpoint.setColor(clr);
            }
            this.propagateChange();
        }
    }

    ngAfterViewInit() {
        // setTimeout(() => this.changeDetectorRef.markForCheck(), 0);
    }

    ngOnChanges(changes: SimpleChanges) {
        // eslint-disable-next-line guard-for-in
        for (const propName in changes) {
            switch (propName) {
                case 'inputType':
                case 'attributePlaceholder':
                case 'colorPlaceholder': {
                    this.changeDetectorRef.markForCheck();
                    break;
                }

                default: {
                } // DO NOTHING
            }
        }
    }

    // Set touched on blur
    onBlur() {
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

    private propagateChange() {
        if (this.onChange && this.colorBreakpoint) {
            this.onChange(this.colorBreakpoint.clone());
        }
    }
}
