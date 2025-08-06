import {AfterViewInit, Component, forwardRef} from '@angular/core';
import {v4 as uuidv4} from 'uuid';
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule} from '@angular/forms';
import {MatFormField} from '@angular/material/form-field';
import {MatInput, MatLabel} from '@angular/material/input';
import {MatButton} from '@angular/material/button';

@Component({
    selector: 'geoengine-manager-id-input',
    templateUrl: './id-input.component.html',
    styleUrl: './id-input.component.scss',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => IdInputComponent),
            multi: true,
        },
    ],
    imports: [ReactiveFormsModule, MatFormField, MatInput, MatButton, MatLabel],
})
export class IdInputComponent implements AfterViewInit, ControlValueAccessor {
    idControl = new FormControl<string>('');

    protected disabled = false;
    protected onTouched: () => void = () => {
        /* do nothing */
    };

    private onChange: (value: string) => void = () => {
        /* do nothing */
    };

    ngAfterViewInit(): void {
        if (!this.idControl.value) {
            this.generate();
        }

        this.idControl.valueChanges.subscribe((value) => {
            if (value) {
                this.onChange(value);
            }
        });
    }

    generate(): void {
        const newId = uuidv4();
        this.idControl.patchValue(newId);
        this.onChange(newId);
    }

    writeValue(value: string): void {
        if (value) {
            this.idControl.patchValue(value, {emitEvent: false});
        }
    }

    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
        if (isDisabled) {
            this.idControl.disable();
        } else {
            this.idControl.enable();
        }
    }
}
