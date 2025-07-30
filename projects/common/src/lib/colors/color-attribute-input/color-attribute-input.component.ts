import {
    Component,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Input,
    forwardRef,
    OnChanges,
    SimpleChanges,
    ViewEncapsulation,
    inject,
} from '@angular/core';

import {ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule} from '@angular/forms';
import {Color, stringToRgbaStruct} from '../color';
import {
    FxLayoutDirective,
    FxLayoutAlignDirective,
    FxLayoutGapDirective,
    FxFlexDirective,
} from '../../util/directives/flexbox-legacy.directive';
import {MatFormField, MatInput, MatHint} from '@angular/material/input';
import {ColorPickerDirective} from 'ngx-color-picker';

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
    imports: [
        FxLayoutDirective,
        FxLayoutAlignDirective,
        FxLayoutGapDirective,
        MatFormField,
        FxFlexDirective,
        MatInput,
        FormsModule,
        MatHint,
        ColorPickerDirective,
    ],
})
export class ColorAttributeInputComponent implements ControlValueAccessor, OnChanges {
    private changeDetectorRef = inject(ChangeDetectorRef);

    @Input() readonlyAttribute = false;
    @Input() readonlyColor = false;
    @Input() attributePlaceholder = 'attribute';
    @Input() colorPlaceholder = 'color';
    @Input() colorAttributeHinter?: ColorAttributeInputHinter;

    onTouched?: () => void;
    onChange?: (_: ColorAttributeInput) => void = undefined;

    input?: ColorAttributeInput;
    cssString = '';

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
