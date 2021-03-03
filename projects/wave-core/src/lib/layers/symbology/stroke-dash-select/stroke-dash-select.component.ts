import {ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, Input, OnChanges, SimpleChanges} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {StrokeDashStyle} from '../symbology.model';

/**
 * @title Basic select
 */
@Component({
    selector: 'wave-stroke-dash-select',
    templateUrl: 'stroke-dash-select.component.html',
    styleUrls: ['stroke-dash-select.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StrokeDashSelectComponent), multi: true}],
})
export class StrokeDashSelectComponent implements ControlValueAccessor, OnChanges {
    static svgPrefix = '<svg height="20" width="20" ><line x1="0" y1="0" x2="200" y2="200" style="stroke:rgb(255,0,0);stroke-width:2;';
    static svgDashPrefix = 'stroke-dasharray:';
    static svgPostfix = '"/></svg>';

    @Input() lines: StrokeDashStyle[] = [[], [5, 5], [9, 3, 3]];

    _strokeDashStyle: StrokeDashStyle = [];
    onTouched: () => void;
    onChange: (_: StrokeDashStyle) => void = undefined;

    get strokeDashStyle(): StrokeDashStyle {
        return this._strokeDashStyle;
    }

    set strokeDashStyle(strokeDashStyle: StrokeDashStyle) {
        if (!strokeDashStyle) {
            this._strokeDashStyle = [];
            this.notify();
            this.changeDetectorRef.markForCheck();
        }

        if (!!strokeDashStyle && strokeDashStyle !== this._strokeDashStyle) {
            this._strokeDashStyle = strokeDashStyle;
            this.notify();
            this.changeDetectorRef.markForCheck();
        }
    }

    constructor(public domSanitizer: DomSanitizer, private changeDetectorRef: ChangeDetectorRef) {}

    protected generateViewSvgString(dashArray: Array<number>): string {
        if (!!dashArray && dashArray.length > 0) {
            return (
                StrokeDashSelectComponent.svgPrefix +
                StrokeDashSelectComponent.svgDashPrefix +
                dashArray.join(',') +
                StrokeDashSelectComponent.svgPostfix
            );
        }
        return StrokeDashSelectComponent.svgPrefix + StrokeDashSelectComponent.svgPostfix;
    }

    generateViewImage(dashArray: Array<number>): SafeHtml {
        const svgString = this.generateViewSvgString(dashArray);
        return this.domSanitizer.bypassSecurityTrustHtml(svgString);
    }

    dashStyleName(dashArray: Array<number>): string {
        if (!!dashArray && dashArray.length > 1) {
            return 'Dashed Line';
        }
        return 'Solid Line';
    }

    registerOnChange(fn: (_: StrokeDashStyle) => void): void {
        if (fn) {
            this.onChange = fn;
            this.notify();
        }
    }

    registerOnTouched(fn: () => void): void {
        if (fn) {
            this.onTouched = fn;
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        for (const propName in changes) {
            // tslint:disable-line:forin
            switch (propName) {
                case 'lines': {
                    this.changeDetectorRef.markForCheck();
                    break;
                }
                default: {
                    /* DO NOTHING*/
                }
            }
        }
    }

    notify() {
        if (this.onChange) {
            this.onChange(this.strokeDashStyle);
        }
    }

    writeValue(strokeDashStyle: StrokeDashStyle): void {
        this.strokeDashStyle = strokeDashStyle;
    }
}
