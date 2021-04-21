import {
    Component,
    ChangeDetectionStrategy,
    OnChanges,
    SimpleChanges,
    OnDestroy,
    AfterViewInit,
    OnInit,
    forwardRef,
    HostListener,
} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {BLACK, Color} from '../../../colors/color';
import {ColorParam, DerivedColor, StaticColor} from '../symbology.model';

/**
 * An edit component for `ColorParam`
 */
@Component({
    selector: 'wave-color-param-editor',
    templateUrl: 'color-param-editor.component.html',
    styleUrls: ['color-param-editor.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ColorParamEditorComponent), multi: true}],
})
export class ColorParamEditorComponent implements OnChanges, OnDestroy, AfterViewInit, OnInit, ControlValueAccessor {
    colorParam: ColorParam;

    isStatic = true;
    isDerived = false;

    protected defaultColorParam: ColorParam = new StaticColor(BLACK);

    constructor() {
        this.colorParam = this.defaultColorParam;
    }

    @HostListener('blur') onBlur(): void {
        this.onTouched();
    }

    onTouched = (): void => {};
    onChange = (_: ColorParam | null): void => {};

    ngOnChanges(_changes: SimpleChanges): void {}

    ngOnInit(): void {}

    ngAfterViewInit(): void {}

    ngOnDestroy(): void {}

    writeValue(value: ColorParam | null): void {
        console.log('writeValue', value);

        if (!value) {
            value = this.defaultColorParam;
        }

        if (value instanceof StaticColor) {
            this.setStatic(true);
        } else if (value instanceof DerivedColor) {
            this.setStatic(false);
        } else {
            throw Error('Unexpected ColorParam Variant');
        }

        this.colorParam = value;

        // TODO: update here?
    }

    registerOnChange(fn: (_: ColorParam | null) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setStatic(isStatic: boolean): void {
        this.isStatic = isStatic;
        this.isDerived = !isStatic;
    }

    update(defaultColor?: Color): void {
        if (this.colorParam instanceof StaticColor) {
            this.colorParam = new StaticColor(defaultColor ?? this.colorParam.color);
        } else if (this.colorParam instanceof DerivedColor) {
            // TODO: implement
        }
    }
}
