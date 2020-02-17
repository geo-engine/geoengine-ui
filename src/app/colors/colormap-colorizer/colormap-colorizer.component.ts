import {ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {ColorizerData} from '../colorizer-data.model';
import {
    BoundedMplColormapStepScale,
    COLORMAP_STEP_SCALES_WITH_BOUNDS,
    MPL_COLORMAP_NAMES,
    MplColormap,
    MplColormapName
} from '../mpl-colormaps/mpl-colormap.model';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {valueAboveMin, valueBelowMax, WaveValidators} from '../../util/form.validators';
import {Subscription} from 'rxjs';

@Component({
    selector: 'wave-colormap-colorizer',
    templateUrl: 'colormap-colorizer.component.html',
    styleUrls: ['colormap-colorizer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColormapColorizerComponent implements OnInit, OnDestroy {

    @Output() colormapColorizerData = new EventEmitter<ColorizerData>();
    @Input() defaultNumberOfSteps = 16;
    @Input() maxColormapSteps = 16;

    colormapNames = MPL_COLORMAP_NAMES;
    boundedColormapStepScales = COLORMAP_STEP_SCALES_WITH_BOUNDS;
    form: FormGroup;
    colorizerData: ColorizerData = MplColormap.createColorizerDataWithName(this.colormapNames[0], 0, 1);
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
                    valueAboveMin(
                        c => c.get('bounds').get('min').value, c => c.get('colormapStepScales').value['requiresValueAbove'],
                        {checkEqual: true}
                    ),
                    valueBelowMax(
                        c => c.get('bounds').get('max').value, c => c.get('colormapStepScales').value['requiresValueBelow'],
                        {checkEqual: true}
                    )
                ]
            }
        );
    }

    checkValidConfig() {
        const colormapName: MplColormapName = this.form.controls['colormapName'].value;
        const colormapSteps: number = this.form.controls['colormapSteps'].value;
        const boundedColormapStepScales: BoundedMplColormapStepScale = this.form.controls['colormapStepScales'].value;
        const boundsMin: number = this.form.controls['bounds'].value.min;
        const boundsMax: number = this.form.controls['bounds'].value.max;

        if (!MPL_COLORMAP_NAMES.find(x => x === colormapName)) {
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
        const boundedColormapStepScales: BoundedMplColormapStepScale = this.form.controls['colormapStepScales'].value;
        const boundsMin: number = this.form.controls['bounds'].value.min;
        const boundsMax: number = this.form.controls['bounds'].value.max;

        const colorizerData = MplColormap.createColorizerDataWithName(
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
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
    }

}
