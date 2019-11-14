import {ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, Input, OnChanges, SimpleChanges} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {ColorizerData} from '../../../colors/colorizer-data.model';

/*
export interface StrokeDashStyle {
    dashArray: Array<number>;
    // solid: boolean;
    dashStyleName: string;
}
 */

export type StrokeDashStyle = Array<number>;

/**
 * @title Basic select
 */
@Component({
    selector: 'wave-stroke-dash-select',
    templateUrl: 'stroke-dash-select.component.html',
    styleUrls: ['stroke-dash-select.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StrokeDashSelectComponent), multi: true},
    ],
})
export class StrokeDashSelectComponent implements ControlValueAccessor, OnChanges {


    static svgPrefix = '<svg height="20" width="20" ><line x1="0" y1="0" x2="200" y2="200" style="stroke:rgb(255,0,0);stroke-width:2;';
    static svgDashPrefix = 'stroke-dasharray:';
    static svgPostfix = '"/></svg>';

    _strokeDashStyle: StrokeDashStyle = [];
    onTouched: () => void;
    onChange: (_: StrokeDashStyle) => void = undefined;

    get strokeDashStyle(): StrokeDashStyle {
        return this._strokeDashStyle;
    }

    set strokeDashStyle(strokeDashStyle: StrokeDashStyle) {
        if (!strokeDashStyle) {
            // console.log("StrokeDashSelectComponent", 'set strokeDashStyle', strokeDashStyle, this._strokeDashStyle);
            this._strokeDashStyle = [];
            this.notify();
            this.changeDetectorRef.markForCheck();
        }

        if (!!strokeDashStyle
            && strokeDashStyle !== this._strokeDashStyle
        ) {
            // console.log("StrokeDashSelectComponent", 'set strokeDashStyle', strokeDashStyle, this._strokeDashStyle);
            this._strokeDashStyle = strokeDashStyle;
            this.notify();
            this.changeDetectorRef.markForCheck();
        }
    }

    constructor(
        public domSanitizer: DomSanitizer,
        private changeDetectorRef: ChangeDetectorRef
    ) {}

    @Input() lines: StrokeDashStyle[] = [
        [], [5, 5], [9, 3, 3]
    ];

    protected generateViewSvgString(dashArray: Array<number>): string {
        if (!!dashArray && dashArray.length > 0) {
            return StrokeDashSelectComponent.svgPrefix + StrokeDashSelectComponent.svgDashPrefix
                + dashArray.join(',') + StrokeDashSelectComponent.svgPostfix;
        }
        return StrokeDashSelectComponent.svgPrefix + StrokeDashSelectComponent.svgPostfix;
    }

    protected generateViewImage(dashArray: Array<number>): SafeHtml {
        const svgString = this.generateViewSvgString(dashArray);
        // console.log("StrokeDashSelectComponent: generateViewImage(): ", dashArray, svgString);
        return this.domSanitizer.bypassSecurityTrustHtml(svgString);
    }

    protected dashStyleName(dashArray: Array<number>): string {
        if (!!dashArray && dashArray.length > 1) {
            return 'Dashed Line';
        }
        return 'Solid Line';
    }

    registerOnChange(fn: (_: StrokeDashStyle) => void): void {
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

    ngOnChanges(changes: SimpleChanges) {
        // console.log("StrokeDashSelectComponent: ngOnChanges(): ", changes);
        for (let propName in changes) { // tslint:disable-line:forin
            switch (propName) {
                case 'lines': {
                    this.changeDetectorRef.markForCheck();
                    break;
                }
                default: { /* DO NOTHING*/ }
            }
        }
    }

    notify() {
        // console.log("StrokeDashSelectComponent: notify(): ", this._strokeDashStyle, this.onChange);
        if (this.onChange) {
            this.onChange(this.strokeDashStyle);
        }
    }

    writeValue(strokeDashStyle: StrokeDashStyle): void {
        // console.log("StrokeDashSelectComponent: writeValue(): ", strokeDashStyle, this.strokeDashStyle);
        this.strokeDashStyle = strokeDashStyle;
    }

}
