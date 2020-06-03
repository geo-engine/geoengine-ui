import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output, SimpleChanges
} from '@angular/core';
import {ColorizerData} from '../colorizer-data.model';
import {
    BoundedColormapStepScale,
    COLORMAP_STEP_SCALES_WITH_BOUNDS,
    COLORMAP_NAMES,
    Colormap,
    ColormapNames
} from '../colormaps/colormap.model';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {valueRelation, WaveValidators} from '../../util/form.validators';
import {Subscription} from 'rxjs';

/**
 * The ColormapColorizerComponent is the main ui to generate ColorizerData from colormaps.
 */
@Component({
    selector: 'wave-colormap-colorizer',
    templateUrl: 'colormap-colorizer.component.html',
    styleUrls: ['colormap-colorizer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColormapColorizerComponent implements OnInit, OnDestroy, OnChanges {

    /**
     * Emmits new ColorizerData instances generated from user input.
     */
    @Output() colormapColorizerData = new EventEmitter<ColorizerData>();

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

    // make colormap names and step scales available to the tamplate.
    readonly colormapNames = COLORMAP_NAMES;
    readonly boundedColormapStepScales = COLORMAP_STEP_SCALES_WITH_BOUNDS;

    /**
     * The form control used in the template.
     */
    form: FormGroup;

    /**
     * The local (wip) ColorizerData.
     */
    colorizerData: ColorizerData = Colormap.createColorizerDataWithName(this.colormapNames[0], 0, 1);

    private subscriptions: Array<Subscription> = [];

    constructor(
        private changeDetectorRef: ChangeDetectorRef,
        private formBuilder: FormBuilder,
    ) {
        this.form = formBuilder.group({
                bounds: formBuilder.group({
                    min: [0],
                    max: [1]
                }, {
                    validators: [WaveValidators.minAndMax('min', 'max', {checkBothExist: true})]
                }),
                colormapName: [this.colormapNames[0], [Validators.required]],
                colormapSteps: [this.defaultNumberOfSteps, [Validators.required, Validators.min(2)]],
                colormapStepScales: [this.boundedColormapStepScales[0]],
                colormapReverseColors: [false],
            }, {
                validators: [
                    valueRelation(
                        c => c.get('bounds').get('min').value, c => c.get('colormapStepScales').value['requiresValueAbove'],
                        {checkEqual: true, checkBelow: true}
                    ),
                    valueRelation(
                        c => c.get('bounds').get('max').value, c => c.get('colormapStepScales').value['requiresValueBelow'],
                        {checkEqual: true, checkAbove: true}
                    )
                ]
            }
        );
    }

    /**
     * Replace the min and max values.
     */
    patchMinMaxValues(min: number, max: number) {

        const patchConfig: { min?: number, max?: number } = {};
        const boundsMin: number = this.form.controls['bounds'].value.min;
        const boundsMax: number = this.form.controls['bounds'].value.max;

        if (min !== undefined && min !== boundsMin) {
            patchConfig.min = min;
        }

        if (max !== undefined && max !== boundsMax) {
            patchConfig.max = max;
        }

        this.form.controls.bounds.patchValue(patchConfig);
    }

    private checkValidConfig() {
        const colormapName: ColormapNames = this.form.controls['colormapName'].value;
        const colormapSteps: number = this.form.controls['colormapSteps'].value;
        const boundedColormapStepScales: BoundedColormapStepScale = this.form.controls['colormapStepScales'].value;
        const boundsMin: number = this.form.controls['bounds'].value.min;
        const boundsMax: number = this.form.controls['bounds'].value.max;

        if (!COLORMAP_NAMES.find(x => x === colormapName)) {
            return false;
        }
        if (colormapSteps > this.maxColormapSteps) {
            return false;
        }
        if (boundsMin >= boundsMax) {
            return false;
        }
        if (boundedColormapStepScales.requiresValueAbove && boundsMin <= boundedColormapStepScales.requiresValueAbove) {
            return false;
        }
        if (boundedColormapStepScales.requiresValueBelow && boundsMax >= boundedColormapStepScales.requiresValueBelow) {
            return false;
        }
        return true;
    }

    /**
     * Clears the local colorizer data.
     */
    removeColorizerData() {
        this.colorizerData = undefined;
    }


    private updateColorizerData() {
        if (!this.checkValidConfig()) {
            this.colorizerData = undefined;
            return;
        }
        const colormapName: ColormapNames = this.form.controls['colormapName'].value;
        const colormapSteps: number = this.form.controls['colormapSteps'].value;
        const boundedColormapStepScales: BoundedColormapStepScale = this.form.controls['colormapStepScales'].value;
        const boundsMin: number = this.form.controls['bounds'].value.min;
        const boundsMax: number = this.form.controls['bounds'].value.max;
        const reverseColormap: boolean = this.form.controls['colormapReverseColors'].value;

        const colorizerData = Colormap.createColorizerDataWithName(
            colormapName, boundsMin, boundsMax, colormapSteps, boundedColormapStepScales.stepScaleName, reverseColormap
        );

        this.colorizerData = colorizerData;
    }

    /**
     * Apply a new colortable to the colorizer data.
     */
    applyNewColorTable(_: any) {
        if (this.colorizerData) {
            this.colormapColorizerData.emit(this.colorizerData);
        }
    }

    ngOnInit(): void {
        const sub = this.form.valueChanges.subscribe(_ => {
            if (this.form.invalid) {
                this.removeColorizerData();
            }
            this.updateColorizerData();

        });
        this.subscriptions.push(sub);

        if (this.minValue && this.maxValue) {
            this.patchMinMaxValues(this.minValue, this.maxValue);
        }

        const subMinMax = this.form.controls['bounds'].valueChanges.subscribe(x => {
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
        this.subscriptions.forEach(s => s.unsubscribe());
    }

    ngOnChanges(changes: SimpleChanges): void {
        for (const propName in changes) { // tslint:disable-line:forin
            switch (propName) {
                case 'minValue':
                case 'maxValue': {
                    this.patchMinMaxValues(this.minValue, this.maxValue);
                    break;
                }

                default: {// DO NOTHING
                }

            }
        }
    }
}
