import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {ClassificationMeasurement, ContinuousMeasurement, Measurement, UnitlessMeasurement} from '@geoengine/openapi-client';
import {MATERIAL_MODULES} from '../common.module';
import {CommonModule as AngularCommonModule} from '@angular/common';

enum MeasurementType {
    Classification = 'classification',
    Continuous = 'continuous',
    Unitless = 'unitless',
}

interface AddClassForm {
    key: FormControl<string>;
    value: FormControl<string>;
}

@Component({
    selector: 'geoengine-measurement',
    templateUrl: './measurement.component.html',
    styleUrl: './measurement.component.css',
    imports: [MATERIAL_MODULES, FormsModule, ReactiveFormsModule, AngularCommonModule],
})
export class MeasurementComponent implements OnChanges {
    @Input() measurement!: Measurement;

    @Output() measurementChange = new EventEmitter<Measurement>();
    @Output() onInputChange = new EventEmitter<Event>();

    MeasurementType = MeasurementType;

    classificationMeasurement?: ClassificationMeasurement;
    continuousMeasurement?: ContinuousMeasurement;
    unitlessMeasurement?: UnitlessMeasurement;

    addClassForm: FormGroup<AddClassForm> = new FormGroup<AddClassForm>({
        key: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.minLength(1)],
        }),
        value: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.minLength(1)],
        }),
    });

    ngOnChanges() {
        if (!this.measurement) {
            this.measurement = {
                type: 'unitless',
            };
        }
        this.initMeasurement(this.measurement);
    }

    public reset() {
        this.classificationMeasurement = undefined;
        this.continuousMeasurement = undefined;
        this.unitlessMeasurement = undefined;
    }

    getMeasurementType(): MeasurementType {
        switch (this.measurement.type) {
            case 'classification':
                return MeasurementType.Classification;
            case 'continuous':
                return MeasurementType.Continuous;
            case 'unitless':
                return MeasurementType.Unitless;
        }
    }

    /**
     * If created with a measurement as @Input, set the appropriate fields
     * for Classification and Continuous MeasurementType's.
     */
    private initMeasurement(measurement: Measurement): void {
        switch (measurement.type) {
            case MeasurementType.Classification:
                this.classificationMeasurement = measurement;
                break;
            case MeasurementType.Continuous:
                this.continuousMeasurement = measurement;
                break;
            case MeasurementType.Unitless:
                this.unitlessMeasurement = {type: 'unitless'};
                break;
        }
        this.measurement = measurement;
    }

    updateMeasurementType(type: MeasurementType): void {
        switch (type) {
            case MeasurementType.Classification:
                if (!this.classificationMeasurement) {
                    this.classificationMeasurement = {
                        type: 'classification',
                        measurement: 'classification',
                        classes: {},
                    };
                }

                this.measurement = this.classificationMeasurement;
                break;
            case MeasurementType.Continuous:
                if (!this.continuousMeasurement) {
                    this.continuousMeasurement = {
                        type: 'continuous',
                        measurement: 'continuous',
                    };
                }

                this.measurement = this.continuousMeasurement;
                break;
            case MeasurementType.Unitless:
                if (!this.unitlessMeasurement) {
                    this.unitlessMeasurement = {
                        type: 'unitless',
                    };
                }

                this.measurement = {
                    type: 'unitless',
                };
                break;
        }
        this.measurementChange.emit(this.measurement);
    }

    removeClass(key: string) {
        if (!this.classificationMeasurement) {
            return;
        }

        delete this.classificationMeasurement.classes[key];
    }

    addClass() {
        if (!this.classificationMeasurement) {
            return;
        }

        const key = this.addClassForm.controls.key.value;
        const value = this.addClassForm.controls.value.value;

        this.classificationMeasurement.classes[key] = value;

        this.addClassForm.reset();
        this.addClassForm.markAsPristine();
    }

    inputChange(content: Event) {
        this.onInputChange.emit(content);
    }
}
