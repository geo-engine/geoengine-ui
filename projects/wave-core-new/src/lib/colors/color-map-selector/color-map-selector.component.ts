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
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {WaveValidators} from '../../util/form.validators';
import {Subscription} from 'rxjs';
import {MPL_COLORMAPS} from './mpl-colormaps';
import {Color, RgbaColor} from '../color';
import {ColorBreakpoint} from '../color-breakpoint.model';

/**
 * The ColormapColorizerComponent is a dialog to generate ColorizerData from colormaps.
 */
@Component({
    selector: 'wave-color-map-selector',
    templateUrl: 'color-map-selector.component.html',
    styleUrls: ['color-map-selector.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorMapSelectorComponent implements OnInit, OnDestroy, OnChanges {
    /**
     * Emmits colorizer breakpoint arrays
     */
    @Output() breakpointsChange = new EventEmitter<Array<ColorBreakpoint>>();

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
    @Input() minValue = 0;

    /**
     * Sets the max value used for ColorizerData generation.
     */
    @Input() maxValue = 1;

    /**
     * Sends the min value selected in the ui.
     */
    @Output() minValueChange = new EventEmitter<number>();

    /**
     * Sends the max value selected in the ui.
     */
    @Output() maxValueChange = new EventEmitter<number>();

    readonly colorMaps = MPL_COLORMAPS;

    /**
     * The form control used in the template.
     */
    form: FormGroup;

    /**
     * The local (work-in-progress) Colorizer.
     */
    breakpoints: Array<ColorBreakpoint>;

    protected subscriptions: Array<Subscription> = [];

    constructor(private changeDetectorRef: ChangeDetectorRef, private formBuilder: FormBuilder) {
        const initialColorMapName = Object.keys(this.colorMaps)[0];

        this.form = formBuilder.group({
            bounds: formBuilder.group(
                {
                    min: [0],
                    max: [1],
                },
                {
                    validators: [WaveValidators.minAndMax('min', 'max', {checkBothExist: true, mustNotEqual: true})],
                },
            ),
            colorMap: [this.colorMaps[initialColorMapName], [Validators.required]],
            colorMapSteps: [this.defaultNumberOfSteps, [Validators.required, Validators.min(2)]],
            colorMapReverseColors: [false],
        });

        this.breakpoints = this.createBreakpoints();
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
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((s) => s.unsubscribe());
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.minValue || changes.maxValue) {
            this.patchMinMaxValues(this.minValue, this.maxValue);
        }
    }

    /**
     * Replace the min and max values.
     */
    patchMinMaxValues(min: number, max: number): void {
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

    /**
     * Clears the local colorizer data.
     */
    removeColorizerData(): void {
        this.breakpoints = undefined;
    }

    /**
     * Apply a new color table to the colorizer data.
     */
    applyNewColorTable(_: any): void {
        if (!this.breakpoints) {
            return;
        }

        this.breakpointsChange.emit(this.breakpoints);
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
        const colorMap: Array<RgbaColor> = this.form.controls['colorMap'].value;
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

        return true;
    }

    protected createBreakpoints(): Array<ColorBreakpoint> {
        const colorMap: Array<RgbaColor> = this.form.controls['colorMap'].value;
        const colorMapSteps: number = this.form.controls['colorMapSteps'].value;
        const colorMapReverseColors: boolean = this.form.controls['colorMapReverseColors'].value;
        const bounds: {min: number; max: number} = this.form.controls['bounds'].value;

        // TODO: allow different gradient types

        const breakpoints = new Array<ColorBreakpoint>();

        const stepSize = 1 / (colorMapSteps - 1);
        for (let frac = 0; frac <= 1; frac += stepSize) {
            const value = bounds.min + frac * (bounds.max - bounds.min);

            let colorMapIndex = Math.round(frac * (colorMap.length - 1));
            if (colorMapReverseColors) {
                colorMapIndex = colorMap.length - colorMapIndex - 1;
            }
            const color = Color.fromRgbaLike(colorMap[colorMapIndex]);

            breakpoints.push(new ColorBreakpoint(value, color));
        }

        // override last because of rounding errors
        breakpoints[breakpoints.length - 1] = breakpoints[breakpoints.length - 1].cloneWithValue(bounds.max);

        return breakpoints;
    }
}
