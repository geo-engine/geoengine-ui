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
import {Color, stringToRgbaStruct} from '../color';

export interface ColorAttributeInput {
    readonly key: string;
    readonly value: Color;
}

@Component({
    selector: 'wave-color-attribute-input',
    templateUrl: './color-attribute-input.component.html',
    styleUrls: ['./color-attribute-input.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ColorAttributeInputComponent), multi: true}],
})
export class ColorAttributeInputComponent implements ControlValueAccessor, AfterViewInit, OnChanges {
    @Input() readonlyAttribute: false;
    @Input() readonlyColor: false;
    @Input() attributePlaceholder = 'attribute';
    @Input() colorPlaceholder: 'color';

    onTouched: () => void;
    onChange: (_: ColorAttributeInput) => void = undefined;

    input: ColorAttributeInput;

    constructor(private changeDetectorRef: ChangeDetectorRef) {}

    updateKey(key: string): void {
        if (!key || key === this.input.key) {
            return;
        }

        this.input = {
            key,
            value: this.input.value,
        };

        this.propagateChange();
    }

    updateColor(value: string): void {
        if (!value) {
            return;
        }

        const color = Color.fromRgbaLike(stringToRgbaStruct(value));

        this.input = {
            key: this.input.key,
            value: color,
        };

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

    writeValue(input: ColorAttributeInput): void {
        this.input = input;
    }

    registerOnChange(fn: (_: ColorAttributeInput) => void): void {
        this.onChange = fn;
        this.propagateChange();
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    private propagateChange(): void {
        if (this.onChange && this.input) {
            this.onChange(this.input);
        }
    }
}
