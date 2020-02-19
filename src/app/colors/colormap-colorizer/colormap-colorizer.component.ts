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
    MplColormapName
} from '../colormaps/colormap.model';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {valueRelation, WaveValidators} from '../../util/form.validators';
import {Subscription} from 'rxjs';

@Component({
    selector: 'wave-colormap-colorizer',
    templateUrl: 'colormap-colorizer.component.html',
    styleUrls: ['colormap-colorizer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColormapColorizerComponent implements OnInit, OnDestroy, OnChanges {

    @Output() colormapColorizerData = new EventEmitter<ColorizerData>();
    @Input() defaultNumberOfSteps = 16;
    @Input() maxColormapSteps = 16;
    @Input() minValue = 0;
    @Input() maxValue = 1;

    readonly colormapNames = COLORMAP_NAMES;
    readonly boundedColormapStepScales = COLORMAP_STEP_SCALES_WITH_BOUNDS;
    form: FormGroup;
    colorizerData: ColorizerData = Colormap.createColorizerDataWithName(this.colormapNames[0], 0, 1);
    subscriptions: Array<Subscription> = [];

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
                colormapStepScales: [this.boundedColormapStepScales[0]]
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

    patchMinMaxValues(min: number, max: number) {

        const patchConfig: { min?: number, max?: number } = {};

        if (min !== undefined) {
            patchConfig.min = min;
        }

        if (max !== undefined) {
            patchConfig.max = max;
        }

        this.form.controls.bounds.patchValue(patchConfig);
    }

    checkValidConfig() {
        const colormapName: MplColormapName = this.form.controls['colormapName'].value;
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

    removeColorizerData() {
        this.colorizerData = undefined;
    }

    updateColorizerData() {
        if (!this.checkValidConfig()) {
            this.colorizerData = undefined;
            return;
        }
        const colormapName: MplColormapName = this.form.controls['colormapName'].value;
        const colormapSteps: number = this.form.controls['colormapSteps'].value;
        const boundedColormapStepScales: BoundedColormapStepScale = this.form.controls['colormapStepScales'].value;
        const boundsMin: number = this.form.controls['bounds'].value.min;
        const boundsMax: number = this.form.controls['bounds'].value.max;

        const colorizerData = Colormap.createColorizerDataWithName(
            colormapName, boundsMin, boundsMax, colormapSteps, boundedColormapStepScales.stepScaleName
        );

        this.colorizerData = colorizerData;
    }

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

        if (this.minValue && this.maxValue)
            this.patchMinMaxValues(this.minValue, this.maxValue);
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
    }

    ngOnChanges(changes: SimpleChanges): void {
        for (let propName in changes) { // tslint:disable-line:forin
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
