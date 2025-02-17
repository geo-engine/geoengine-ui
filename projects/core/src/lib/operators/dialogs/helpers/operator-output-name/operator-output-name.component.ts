import {Component, ChangeDetectionStrategy, OnChanges, SimpleChange, ChangeDetectorRef, Input, AfterViewInit} from '@angular/core';
import {NG_VALUE_ACCESSOR, ControlValueAccessor} from '@angular/forms';

@Component({
    selector: 'geoengine-operator-output-name',
    templateUrl: './operator-output-name.component.html',
    styleUrls: ['./operator-output-name.component.scss'],
    providers: [{provide: NG_VALUE_ACCESSOR, useExisting: OperatorOutputNameComponent, multi: true}],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class OperatorOutputNameComponent implements ControlValueAccessor, OnChanges, AfterViewInit {
    @Input() type: 'Layer' | 'Plot' = 'Layer';
    @Input() suggestion = '';

    private _name = '';
    private userChanged = false;

    private onTouched?: () => void;
    private onChange?: (_: string) => void = undefined;

    constructor(private changeDetectorRef: ChangeDetectorRef) {}

    set name(name: string) {
        this._name = name;
        this.userChanged = true;
        if (this.onChange) {
            this.onChange(name);
        }
    }

    get name(): string {
        return this._name;
    }

    ngAfterViewInit(): void {
        // once for rendering the input properly
        setTimeout(() => this.changeDetectorRef.markForCheck());
    }

    ngOnChanges(changes: {[propertyName: string]: SimpleChange}): void {
        // eslint-disable-next-line guard-for-in
        for (const propName in changes) {
            switch (propName) {
                case 'suggestion':
                    if (!this.userChanged) {
                        this._name = this.suggestion;

                        if (this.onChange) {
                            this.onChange(this._name);
                        }
                        this.changeDetectorRef.markForCheck();
                    }
                    break;
                default:
                // do nothing
            }
        }
    }

    /** Implemented as part of ControlValueAccessor. */
    writeValue(value: string): void {
        this._name = value;
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
