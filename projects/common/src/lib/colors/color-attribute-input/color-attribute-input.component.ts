import {
    Component,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Input,
    forwardRef,
    OnChanges,
    SimpleChanges,
    ViewEncapsulation,
} from '@angular/core';

import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {Color, stringToRgbaStruct} from '../color';

export interface ColorAttributeInput {
    readonly key: string;
    readonly value: Color;
}

export interface ColorAttributeInputHinter {
    colorHint(key: string): string | undefined;
}

@Component({
    selector: 'geoengine-color-attribute-input',
    templateUrl: './color-attribute-input.component.html',
    styleUrls: ['./color-attribute-input.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ColorAttributeInputComponent), multi: true}],
    encapsulation: ViewEncapsulation.Emulated,
    standalone: false,
})
export class ColorAttributeInputComponent implements ControlValueAccessor, OnChanges {
    @Input() readonlyAttribute = false;
    @Input() readonlyColor = false;
    @Input() attributePlaceholder = 'attribute';
    @Input() colorPlaceholder = 'color';
    @Input() colorAttributeHinter?: ColorAttributeInputHinter;

    onTouched?: () => void;
    onChange?: (_: ColorAttributeInput) => void = undefined;

    input?: ColorAttributeInput;
    cssString = '';

    constructor(private changeDetectorRef: ChangeDetectorRef) {}

    hasColorHint(): boolean {
        return this.colorAttributeHinter !== undefined;
    }

    colorHint(key: string | undefined): string | undefined {
        if (!key) {
            return undefined;
        }
        if (this.colorAttributeHinter) {
            return this.colorAttributeHinter.colorHint(key);
        }
        return undefined;
    }

    updateKey(key?: string): void {
        if (!key || !this.input || key === this.input.key) {
            return;
        }

        this.input = {
            key,
            value: this.input.value,
        };
    }

    updateColor(value: string): void {
        if (!value || !this.input) {
            return;
        }

        const color = Color.fromRgbaLike(stringToRgbaStruct(value));

        this.input = {
            key: this.input.key,
            value: color,
        };
        this.cssString = color.rgbaCssString();

        this.propagateChange();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.inputType || changes.attributePlaceholder || changes.colorPlaceholder) {
            this.changeDetectorRef.markForCheck();
        }
    }

    // Set touched on blur
    onBlur(): void {
        if (this.onTouched) {
            this.onTouched();
        }
    }

    writeValue(input?: ColorAttributeInput): void {
        this.input = input;

        if (!input) {
            return;
        }

        this.cssString = input.value.rgbaCssString();
    }

    registerOnChange(fn: (_: ColorAttributeInput) => void): void {
        this.onChange = fn;
        this.propagateChange();
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    propagateChange(): void {
        if (this.onChange && this.input) {
            this.onChange(this.input);
        }
    }
}
