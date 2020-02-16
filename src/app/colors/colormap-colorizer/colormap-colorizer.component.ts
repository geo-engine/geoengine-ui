import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component, ElementRef, EventEmitter,
    Input,
    OnChanges, OnDestroy,
    Output,
    SimpleChanges
} from '@angular/core';
import {ColorizerData} from '../colorizer-data.model';
import {
    BoundedMplColormapStepScale,
    COLORMAP_STEP_SCALES_WITH_BOUNDS,
    MPL_COLORMAP_NAMES,
    MplColormap,
    MplColormapName
} from '../mpl-colormaps/mpl-colormap.model';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {WaveValidators} from '../../util/form.validators';
import {BehaviorSubject, Subscription} from 'rxjs';
import {LayoutService} from '../../layout.service';

@Component({
    selector: 'wave-colormap-colorizer',
    templateUrl: 'colormap-colorizer.component.html',
    styleUrls: ['colormap-colorizer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColormapColorizerComponent implements OnChanges, AfterViewInit, OnDestroy {

    @Output() colormapColorizerData = new EventEmitter<ColorizerData>();
    @Input() defaultNumberOfSteps = 16;
    @Input() maxColormapSteps = 16;

    colormapNames = MPL_COLORMAP_NAMES;
    boundedColormapStepScales = COLORMAP_STEP_SCALES_WITH_BOUNDS;

    form: FormGroup;
    dataLoading$ = new BehaviorSubject(false);
    histogramWidth: number;
    histogramHeight: number;
    private subscriptions: Array<Subscription> = new Array<Subscription>();

    constructor(
        private changeDetectorRef: ChangeDetectorRef,
        private formBuilder: FormBuilder,
        private elementRef: ElementRef,
    ) {
        this.form = formBuilder.group({
            bounds: formBuilder.group({
                min: [undefined],
                max: [undefined]
            }, {
                validator: WaveValidators.minAndMax('min', 'max')
            }),
            colormapName: [this.colormapNames[0], [Validators.required]],
            colormapSteps: [this.defaultNumberOfSteps, [Validators.required, Validators.min(2)]],
            colormapStepScales: [this.boundedColormapStepScales[0]]
        });
    }

    ngAfterViewInit() {
        // calculate size for histogram
        const formStyle = getComputedStyle(this.elementRef.nativeElement.querySelector('form'));
        const formWidth = parseInt(formStyle.width, 10) - 2 * LayoutService.remInPx() - LayoutService.scrollbarWidthPx();
        const formHeight = parseInt(formStyle.height, 10) - 2 * LayoutService.remInPx();

        this.histogramWidth = formWidth;
        this.histogramHeight = Math.max(formHeight / 3, formWidth / 3);

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
        if (boundedColormapStepScales.mustBeGreaterThanValue && boundsMin <= boundedColormapStepScales.mustBeGreaterThanValue) {
            return false;
        }
        if (boundedColormapStepScales.mustBeBelowValue && boundsMax >= boundedColormapStepScales.mustBeBelowValue) {
            return false;
        }
        return true;
    }

    generateAndApplyNewColorTable(event: any) {
        if (!this.checkValidConfig()) {
            throw new Error('invalid colormap colorizer generation input');
        }

        const colormapName: MplColormapName = this.form.controls['colormapName'].value;
        const colormapSteps: number = this.form.controls['colormapSteps'].value;
        const boundedColormapStepScales: BoundedMplColormapStepScale = this.form.controls['colormapStepScales'].value;
        const boundsMin: number = this.form.controls['bounds'].value.min;
        const boundsMax: number = this.form.controls['bounds'].value.max;

        const colorizerData = MplColormap.creatColorizerDataWithName(
            colormapName, boundsMin, boundsMax, colormapSteps, boundedColormapStepScales.stepScaleName
        );
        this.colormapColorizerData.emit(colorizerData);
    }

    ngOnDestroy() {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
    }

    ngOnChanges(changes: SimpleChanges) {
        for (let propName in changes) { // tslint:disable-line:forin
            switch (propName) {
                default: {// DO NOTHING
                }

            }
        }
    }
}
