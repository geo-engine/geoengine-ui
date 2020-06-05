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

/**
 * The ColorizerEditorComponent is the main dialog for editing ColorizerData / ColorBreakpoints
 */
@Component({
    selector: 'wave-colorizer-editor',
    templateUrl: 'colorizer-editor.component.html',
    styleUrls: ['colorizer-editor.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ColorizerEditorComponent), multi: true},
    ],
})
export class ColorizerEditorComponent implements ControlValueAccessor, OnChanges {

    private _colorizer: ColorizerData = undefined;
    onTouched: () => void;
    onChange: (_: ColorizerData) => void = undefined;

    get colorizer(): ColorizerData {
        return this._colorizer;
    }

    set colorizer(clr: ColorizerData) {
        if (clr && (!clr.equals(this._colorizer))) {
            this._colorizer = clr.clone();
            this.notify();
        }
    }

    /**
     * Toggles the colorizer type selector. Default = true.
     */
    @Input() showTypeSelect = true;

    /**
     * Toggles the name hinting column. Default = false.
     */
    @Input() showNameHintColumn = false;

    /**
     * Switches the attribute input to disabled. Default = false;
     */
    @Input() disabledAttribute = false;

    /**
     * Switches the color input to disabled. Default = false;
     */
    @Input() disabledColor = false;

    /**
     * The data type of the attribute input. Default = number.
     */
    @Input() inputType: 'number' | 'string' = 'number';

    /**
     * The attribute input placeholder string.
     */
    @Input() attributePlaceholder = 'attribute';

    /**
     * the color input placeholder string.
     */
    @Input() colorPlaceholder = 'color';

    /**
     * The constructor.
     */
    constructor(private changeDetectorRef: ChangeDetectorRef) {
    }

    ngOnChanges(changes: SimpleChanges) {
        for (const propName in changes) { // tslint:disable-line:forin
            switch (propName) {
                case 'inputType':
                case 'attributePlaceholder':
                case 'colorPlaceholder': {
                    this.changeDetectorRef.markForCheck();
                    break;
                }

                default: {// DO NOTHING
                }

            }
        }
    }

    /**
     * Update the colorizer type of the colorizer data.
     */
    updateType(type: ColorizerType) {
        if (type && this._colorizer) {
            const diff = this._colorizer.updateType(type);
            if (diff) {
                this.notify();
            }
        }
    }

    /**
     * Update the breakpoint in the colorizer data at position i.
     */
    updateBreakpointAt(i: number, brk: ColorBreakpoint) {
        // TODO: check if this is valid
        if (this._colorizer && this._colorizer.breakpoints.length > i ) {
            const diff = this._colorizer.updateBreakpointAt(i, brk);
            this.notify();
        }
    }

    /**
     * Add a new breakpoint a tposition i. Clones the next breakpoint if possible.
     */
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

    /**
     * Removes the breakpoint at position i.
     */
    removeBreakpointAt(i: number) {
        if (this._colorizer && this._colorizer.breakpoints.length > i ) {
            this._colorizer.removeBreakpointAt(i);
            this.notify();
        }
    }

    /**
     * Sends the wip colorizer to a registred reciever.
     */
    notify() {
        if (this.onChange && this._colorizer) {
            this.onChange(this._colorizer.clone());
        }
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
