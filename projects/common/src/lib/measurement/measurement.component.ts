import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {
    ClassificationMeasurementWithType,
    ContinuousMeasurementWithType,
    Measurement,
    UnitlessMeasurement,
} from '@geoengine/openapi-client';

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
})
export class MeasurementComponent {
    @Input() measurement!: Measurement;

    @Output() measurementChange = new EventEmitter<Measurement>();

    MeasurementType = MeasurementType;

    classificationMeasurement?: ClassificationMeasurementWithType;
    continousMeasurement?: ContinuousMeasurementWithType;
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

    constructor() {
        if (!this.measurement) {
            this.measurement = {
                type: 'unitless',
            };
        }
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
                if (!this.continousMeasurement) {
                    this.continousMeasurement = {
                        type: 'continuous',
                        measurement: 'continuous',
                    };
                }

                this.measurement = this.continousMeasurement;
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
}
