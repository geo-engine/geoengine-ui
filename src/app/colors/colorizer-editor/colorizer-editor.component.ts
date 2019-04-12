import {
    Component,
    Input,
    ChangeDetectionStrategy,
    OnChanges,
    SimpleChanges,
    forwardRef,
    ChangeDetectorRef, AfterViewInit,
} from '@angular/core';

import {ColorizerData, ColorizerType} from '../colorizer-data.model';
import {NG_VALUE_ACCESSOR, ControlValueAccessor} from '@angular/forms';
import {ColorBreakpoint} from '../color-breakpoint.model';

@Component({
    selector: 'wave-colorizer-editor',
    templateUrl: 'colorizer-editor.component.html',
    styleUrls: ['colorizer-editor.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ColorizerEditorComponent), multi: true},
    ],
})
export class ColorizerEditorComponent implements ControlValueAccessor, OnChanges, AfterViewInit {

    _colorizer: ColorizerData = undefined;
    onTouched: () => void;
    onChange: (_: ColorizerData) => void = undefined;

    get colorizer(): ColorizerData {
        return this._colorizer;
    }

    set colorizer(clr: ColorizerData) {
        if (clr && (!clr.equals(this._colorizer))) {
            // console.log("ColorizerEditorComponent", 'set fillColorizer', clr, this._colorizer, clr.equals(this._colorizer));
            this._colorizer = clr.clone();
            this.notify();
            // this.changeDetectorRef.markForCheck();
        }
    }

    @Input() showTypeSelect = true;
    @Input() showNameHintColumn = false;
    @Input() disabledAttribute: false;
    @Input() disabledColor: false;
    @Input() inputType: 'number' | 'string' = 'number';
    @Input() attributePlaceholder: 'attribute';
    @Input() colorPlaceholder: 'color';

    constructor(private changeDetectorRef: ChangeDetectorRef) {
    }

    ngOnChanges(changes: SimpleChanges) {
        for (let propName in changes) { // tslint:disable-line:forin
            switch (propName) {
                case 'inputType':
                case 'attributePlaceholder':
                case 'colorPlaceholder':
                {
                    this.changeDetectorRef.markForCheck();
                    break;
                }

                default: {// DO NOTHING
                    // console.log('ColorizerEditorComponent', 'ngOnChanges', 'default: ', propName)
                }

            }
        }

        // this.changeDetectorRef.markForCheck();
    }

    updateType(type: ColorizerType) {
        // console.log('updateType', type);
        if (type && this._colorizer) {
            const diff = this._colorizer.updateType(type);
            if (diff) {
                this.notify();
            }
        }
    }

    updateBreakpointAt(i: number, brk: ColorBreakpoint) {
        // TODO: check if this is valid
        if (this._colorizer && this._colorizer.breakpoints.length > i ) {
            const diff = this._colorizer.updateBreakpointAt(i, brk);
            // if (diff) {
                this.notify();
            // }
        }
    }

    addBreakpointAt(i: number) {
        if (this._colorizer && this._colorizer.breakpoints.length > i ) {
            this._colorizer.addBreakpointAt(i,
                this._colorizer.getBreakpointAt(i).clone()
            );
        } else {
            this._colorizer.addBreakpoint(this._colorizer.getBreakpointAt(i));
        }
        this.notify();
    }

    removeBreakpointAt(i: number) {
        if (this._colorizer && this._colorizer.breakpoints.length > i ) {
            this._colorizer.removeBreakpointAt(i);
            this.notify();
        }
    }

    notify() {
        // console.log('ColorizerEditorComponent', 'notify', this);

        if (this.onChange && this._colorizer) {
            this.onChange(this._colorizer.clone());
        }
    }

    ngAfterViewInit() {
        // setTimeout(() => this.changeDetectorRef.markForCheck(), 10);
    }

    registerOnChange(fn: (_: ColorizerData) => void): void {
        if ( fn ) {
            this.onChange = fn;
            this.notify();
        }
    }

    registerOnTouched(fn: () => void): void {
        if ( fn ) {
            this.onTouched = fn;

        }
    }

    writeValue(colorizerData: ColorizerData): void {
        this.colorizer = colorizerData;
    }

}
