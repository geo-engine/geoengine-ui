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
        console.log('ColorBreakpointInputComponent', 'set colorBreakpoint');
        if (brk && (!brk.equals(this._colorBreakpoint))) {
            console.log('ColorBreakpointInputComponent', 'set colorBreakpoint', 'changed', brk.equals(this._colorBreakpoint));
            this._colorBreakpoint = brk;
            // this.changeDetectorRef.markForCheck(); // TODO: when is this needed?
        }
    }

    updateValue(value: number | string) { // TODO: should this really clone?
        if (value && value !== this.colorBreakpoint.value) {
            if (this.inputType === 'number' && typeof value === 'string') {
                // this.colorBreakpoint = this.colorBreakpoint.cloneWithValue(parseFloat(value as string));
                this.colorBreakpoint.setValue(parseFloat(value as string));
            } else {
                // this.colorBreakpoint = this.colorBreakpoint.cloneWithValue(value);
                this.colorBreakpoint.setValue(value);
            }
            this.propagateChange();
        }
    }

    updateColor(color: string) { // TODO: should this really clone?
        if (color) {
            const clr = Color.fromRgbaLike(stringToRgbaStruct(color));
            if (!clr.equals(this._colorBreakpoint.rgba)) {
                // this.colorBreakpoint = this.colorBreakpoint.cloneWithColor(clr);
                this.colorBreakpoint.setColor(clr);
            }
            this.propagateChange();
        }
    }

    ngAfterViewInit() {
        // setTimeout(() => this.changeDetectorRef.markForCheck(), 0);
    }

    ngOnChanges(changes: SimpleChanges) {
        // this.changeDetectorRef.markForCheck(); // TODO: only markForCheck if there is a change!
        for (let propName in changes) { // tslint:disable-line:forin
            switch (propName) {
                case 'inputType':
                case 'attributePlaceholder':
                case 'colorPlaceholder':
                {
                    this.changeDetectorRef.markForCheck();
                }

                default: // DO NOTHING
                    console.log('ColorBreakpointInputComponent', 'ngOnChanges', 'default: ', propName)

            }
        }
    }

    // Set touched on blur
    onBlur() {
        this.onTouched();
    }

    writeValue(brk: ColorBreakpoint): void {
        console.log("ColorBreakpointInputComponent", 'writeValue', brk);
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
