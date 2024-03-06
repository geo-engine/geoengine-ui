import {Component, EventEmitter, Input, Output} from '@angular/core';
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
}
