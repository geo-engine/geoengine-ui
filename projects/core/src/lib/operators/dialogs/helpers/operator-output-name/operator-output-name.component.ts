import {Component, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, input, linkedSignal, inject} from '@angular/core';
import {NG_VALUE_ACCESSOR, ControlValueAccessor, FormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';

@Component({
    selector: 'geoengine-operator-output-name',
    templateUrl: './operator-output-name.component.html',
    styleUrls: ['./operator-output-name.component.scss'],
    providers: [{provide: NG_VALUE_ACCESSOR, useExisting: OperatorOutputNameComponent, multi: true}],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatFormFieldModule, FormsModule, MatInputModule],
})
export class OperatorOutputNameComponent implements ControlValueAccessor, AfterViewInit {
    private changeDetectorRef = inject(ChangeDetectorRef);

    type = input<'Layer' | 'Plot'>('Layer');
    suggestion = input<string>('');

    name = linkedSignal(() => this.suggestion());

    private onTouched?: () => void;
    private onChange?: (_: string) => void = undefined;

    ngAfterViewInit(): void {
        // once for rendering the input properly
        setTimeout(() => this.changeDetectorRef.markForCheck());
    }

    /** Implemented as part of ControlValueAccessor. */
    writeValue(value: string): void {
        this.name.set(value);
        this.changeDetectorRef.markForCheck();
    }

    /** Implemented as part of ControlValueAccessor. */
    registerOnChange(fn: () => void): void {
        this.onChange = fn;
    }

    /** Implemented as part of ControlValueAccessor. */
    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    onBlur(): void {
        if (this.onTouched) {
            this.onTouched();
        }
    }
}
