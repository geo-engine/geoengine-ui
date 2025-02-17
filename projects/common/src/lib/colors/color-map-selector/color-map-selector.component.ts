import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges,
} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {Color, RgbaTuple} from '../color';
import {ColorBreakpoint} from '../color-breakpoint.model';
import {geoengineValidators} from '../../util/form.validators';
import {ALL_COLORMAPS} from '../colormaps/colormaps';

/**
 * The ColormapColorizerComponent is a dialog to generate ColorizerData from colormaps.
 */
@Component({
    selector: 'geoengine-color-map-selector',
    templateUrl: 'color-map-selector.component.html',
    styleUrls: ['color-map-selector.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class ColorMapSelectorComponent implements OnInit, OnDestroy, OnChanges {
    /**
     * Emmits colorizer breakpoint arrays
     */
    @Output() breakpointsChange = new EventEmitter<Array<ColorBreakpoint>>();

    /**
     * Informs parent to enable "Apply Changes" button
     */
    @Output() changesToForm = new EventEmitter<void>();

    /**
     * Number of breakpoints used in the ColorizerData.
     */
    @Input() defaultNumberOfSteps = 16;

    /**
     * Max allowed number of breakpoints in the ColorizerData.
     */
    @Input() maxColormapSteps = 16;

    /**
     * Sets the min value used for ColorizerData generation.
     */
    @Input() minValue? = 0;

    /**
     * Sets the max value used for ColorizerData generation.
     */
    @Input() maxValue? = 1;

    @Input() scale: 'linear' | 'logarithmic' = 'linear';

    /**
     * Sends the min value selected in the ui.
     */
    @Output() minValueChange = new EventEmitter<number>();

    /**
     * Sends the max value selected in the ui.
     */
    @Output() maxValueChange = new EventEmitter<number>();

    readonly colorMaps = ALL_COLORMAPS;

    /**
     * The form control used in the template.
     */
    form: UntypedFormGroup;

    /**
     * The local (work-in-progress) Colorizer.
     */
    breakpoints?: Array<ColorBreakpoint>;

    protected subscriptions: Array<Subscription> = [];

    protected readonly largerThanZeroValidator = geoengineValidators.largerThan(0);

    constructor(
        protected readonly changeDetectorRef: ChangeDetectorRef,
        protected readonly formBuilder: UntypedFormBuilder,
    ) {
        const initialColorMapName = Object.keys(this.colorMaps)[0];

        this.form = formBuilder.group({
            bounds: formBuilder.group(
                {
                    min: [0],
                    max: [1],
                },
                {
                    validators: [geoengineValidators.minAndMax('min', 'max', {checkBothExist: true, mustNotEqual: true})],
                },
            ),
            colorMap: [this.colorMaps[initialColorMapName], [Validators.required]],
            colorMapSteps: [this.defaultNumberOfSteps, [Validators.required, Validators.min(2)]],
            colorMapReverseColors: [false],
        });

        this.breakpoints = this.createBreakpoints();

        this.updateOnScaleChange();
    }

    ngOnInit(): void {
        const sub = this.form.valueChanges.subscribe((_) => {
            if (this.form.invalid) {
                this.removeColorizerData();
            }
            this.updateColorizerData();
        });
        this.subscriptions.push(sub);

        if (this.minValue && this.maxValue) {
            this.patchMinMaxValues(this.minValue, this.maxValue);
        }

        const subMinMax = this.form.controls['bounds'].valueChanges.subscribe((x) => {
            if (Number.isFinite(x.min)) {
                this.minValueChange.emit(x.min.value);
            }
            if (Number.isFinite(x.max)) {
                this.maxValueChange.emit(x.max.value);
            }
        });
        this.subscriptions.push(subMinMax);

        this.form.valueChanges.subscribe(() => {
            this.changesToForm.emit();
        });
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((s) => s.unsubscribe());
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.minValue || changes.maxValue) {
            this.patchMinMaxValues(this.minValue, this.maxValue);
        }

        if (changes.scale) {
            this.updateOnScaleChange();
        }
    }

    /**
     * Replace the min and max values.
     */
    patchMinMaxValues(min?: number, max?: number): void {
        if (typeof min !== 'number' || typeof max !== 'number') {
            return;
        }

        const bounds: {min: number; max: number} = this.form.controls['bounds'].value;

        if (bounds.min === min && bounds.max === max) {
            return;
        }

        this.form.controls.bounds.setValue({min, max});

        this.updateColorizerData();
    }

    updateOnScaleChange(): void {
        const minControl = this.form.controls['bounds'].get('min');

        if (!minControl) {
            return;
        }

        if (this.scale === 'linear') {
            minControl.removeValidators(this.largerThanZeroValidator);
        } else if (this.scale === 'logarithmic') {
            minControl.setValidators(this.largerThanZeroValidator);
        }

        minControl.updateValueAndValidity();
    }

    /**
     * Clears the local colorizer data.
     */
    removeColorizerData(): void {
        this.breakpoints = undefined;
    }

    /**
     * Apply changes to color table to the colorizer data.
     */
    applyChanges(): void {
        if (!this.breakpoints) {
            return;
        }

        this.breakpointsChange.emit(this.breakpoints);
    }

    public static createLinearBreakpoints(
        colorMap: Array<RgbaTuple>,
        colorMapSteps: number,
        colorMapReverseColors: boolean,
        bounds: {min: number; max: number},
    ): Array<ColorBreakpoint> {
        const breakpoints = new Array<ColorBreakpoint>();

        for (let i = 0; i < colorMapSteps; i++) {
            const frac = i / (colorMapSteps - 1);
            const value = bounds.min + frac * (bounds.max - bounds.min);

            const colorMapPos = frac * (colorMap.length - 1);
            let colorMapIndex = Math.floor(colorMapPos);
            const colorMapPosRemainder = colorMapPos - colorMapIndex;
            let nextMapIndex = Math.min(colorMapIndex + 1, colorMap.length - 1);

            if (colorMapReverseColors) {
                colorMapIndex = colorMap.length - colorMapIndex - 1;
                nextMapIndex = Math.max(0, colorMapIndex - 1);
            }

            // we use the colorMapPosRemainder to interpolate between the two colors
            //if the remainder is 0, we can just use the colorMapIndex and return the color
            if (colorMapPosRemainder < Number.EPSILON) {
                breakpoints.push(new ColorBreakpoint(value, Color.fromRgbaLike(colorMap[colorMapIndex])));
                continue;
            }

            //otherwise we need to interpolate between the two colors
            const color = Color.fromRgbaLike(colorMap[colorMapIndex]);
            const nextColor = Color.fromRgbaLike(colorMap[nextMapIndex]);

            const r = color.r + colorMapPosRemainder * (nextColor.r - color.r);
            const g = color.g + colorMapPosRemainder * (nextColor.g - color.g);
            const b = color.b + colorMapPosRemainder * (nextColor.b - color.b);
            const a = color.a + colorMapPosRemainder * (nextColor.a - color.a);

            const realColor = Color.fromRgbaLike([Math.trunc(r), Math.trunc(g), Math.trunc(b), Math.trunc(a)]);

            breakpoints.push(new ColorBreakpoint(value, realColor));
        }

        // override last because of rounding errors
        breakpoints[breakpoints.length - 1] = breakpoints[breakpoints.length - 1].cloneWithValue(bounds.max);

        return breakpoints;
    }

    protected updateColorizerData(): void {
        if (!this.checkValidConfig()) {
            this.breakpoints = undefined;
            return;
        }

        this.breakpoints = this.createBreakpoints();

        this.changeDetectorRef.markForCheck();
    }

    protected checkValidConfig(): boolean {
        const colorMap: Array<RgbaTuple> = this.form.controls['colorMap'].value;
        const colorMapSteps: number = this.form.controls['colorMapSteps'].value;
        const boundsMin: number = this.form.controls['bounds'].value.min;
        const boundsMax: number = this.form.controls['bounds'].value.max;

        if (!colorMap) {
            return false;
        }
        if (colorMapSteps > this.maxColormapSteps) {
            return false;
        }
        if (boundsMin >= boundsMax) {
            return false;
        }

        if (this.scale === 'logarithmic' && boundsMin <= 0) {
            return false;
        }

        return true;
    }

    protected createBreakpoints(): Array<ColorBreakpoint> {
        const colorMap: Array<RgbaTuple> = this.form.controls['colorMap'].value;
        const colorMapSteps: number = this.form.controls['colorMapSteps'].value;
        const colorMapReverseColors: boolean = this.form.controls['colorMapReverseColors'].value;
        const bounds: {min: number; max: number} = this.form.controls['bounds'].value;

        if (this.scale === 'logarithmic') {
            return this.createLogarithmicBreakpoints(colorMap, colorMapSteps, colorMapReverseColors, bounds);
        } else {
            // `this.scale === 'linear'`
            return ColorMapSelectorComponent.createLinearBreakpoints(colorMap, colorMapSteps, colorMapReverseColors, bounds);
        }
    }

    protected createLogarithmicBreakpoints(
        colorMap: Array<RgbaTuple>,
        colorMapSteps: number,
        colorMapReverseColors: boolean,
        bounds: {min: number; max: number},
    ): Array<ColorBreakpoint> {
        if (bounds.min <= 0) {
            // TODO: handle
            throw new Error('logarithmic scale requires min > 0');
        }

        const breakpoints = new Array<ColorBreakpoint>();

        for (let i = 0; i < colorMapSteps; i++) {
            const frac = i / (colorMapSteps - 1);
            const value = Math.exp(Math.log(bounds.min) + frac * (Math.log(bounds.max) - Math.log(bounds.min)));

            const colorMapPos = frac * (colorMap.length - 1);
            let colorMapIndex = Math.floor(colorMapPos);
            const colorMapPosRemainder = colorMapPos - colorMapIndex;
            let nextMapIndex = Math.min(colorMapIndex + 1, colorMap.length - 1);

            if (colorMapReverseColors) {
                colorMapIndex = colorMap.length - colorMapIndex - 1;
                nextMapIndex = Math.max(0, colorMapIndex - 1);
            }

            // we use the colorMapPosRemainder to interpolate between the two colors
            //if the remainder is 0, we can just use the colorMapIndex and return the color
            if (colorMapPosRemainder < Number.EPSILON) {
                breakpoints.push(new ColorBreakpoint(value, Color.fromRgbaLike(colorMap[colorMapIndex])));
                continue;
            }

            //otherwise we need to interpolate between the two colors
            const color = Color.fromRgbaLike(colorMap[colorMapIndex]);
            const nextColor = Color.fromRgbaLike(colorMap[nextMapIndex]);

            const r = color.r + colorMapPosRemainder * (nextColor.r - color.r);
            const g = color.g + colorMapPosRemainder * (nextColor.g - color.g);
            const b = color.b + colorMapPosRemainder * (nextColor.b - color.b);
            const a = color.a + colorMapPosRemainder * (nextColor.a - color.a);

            const realColor = Color.fromRgbaLike([Math.trunc(r), Math.trunc(g), Math.trunc(b), Math.trunc(a)]);

            breakpoints.push(new ColorBreakpoint(value, realColor));
        }

        // override last because of rounding errors
        breakpoints[breakpoints.length - 1] = breakpoints[breakpoints.length - 1].cloneWithValue(bounds.max);

        return breakpoints;
    }
}
