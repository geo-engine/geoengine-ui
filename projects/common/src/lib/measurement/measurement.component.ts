import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {ClassificationMeasurement, ContinuousMeasurement, Measurement, UnitlessMeasurement} from '@geoengine/openapi-client';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {MatButtonToggle, MatButtonToggleGroup} from '@angular/material/button-toggle';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatIcon} from '@angular/material/icon';
import {MatInput} from '@angular/material/input';
import {MatIconButton} from '@angular/material/button';

enum MeasurementType {
    Classification = 'classification',
    Continuous = 'continuous',
    Unitless = 'unitless',
}

interface AddClassForm {
    key: FormControl<string>;
    value: FormControl<string>;
}

interface ClassForms {
    classes: FormArray<FormGroup<AddClassForm>>;
}

@Component({
    selector: 'geoengine-measurement',
    templateUrl: './measurement.component.html',
    styleUrl: './measurement.component.css',
    imports: [
        FormsModule,
        ReactiveFormsModule,
        AngularCommonModule,
        MatButtonToggle,
        MatFormField,
        MatLabel,
        MatIcon,
        MatButtonToggleGroup,
        MatInput,
        MatIconButton,
    ],
})
export class MeasurementComponent implements OnChanges {
    @Input() measurement!: Measurement;

    @Output() measurementChange = new EventEmitter<Measurement>();
    @Output() onInputChange = new EventEmitter<Event>();

    MeasurementType = MeasurementType;

    classificationMeasurement?: ClassificationMeasurement;
    continuousMeasurement?: ContinuousMeasurement;
    unitlessMeasurement?: UnitlessMeasurement;

    addClassForm: FormGroup<ClassForms> = new FormGroup({
        classes: new FormArray<FormGroup<AddClassForm>>([]),
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

    get classes(): FormArray<FormGroup<AddClassForm>> {
        return this.addClassForm.controls.classes;
    }

    newClassRow(key: string | null = null, label: string | null = null): FormGroup<AddClassForm> {
        return new FormGroup<AddClassForm>({
            key: new FormControl(key ?? '', {
                nonNullable: true,
                validators: [Validators.required, Validators.minLength(1)],
            }),
            value: new FormControl(label ?? '', {
                nonNullable: true,
                validators: [Validators.required, Validators.minLength(1)],
            }),
        });
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

    public clearClasses(): void {
        this.classes.clear();
    }

    /**
     * If created with a measurement as @Input, set the appropriate fields
     * for Classification and Continuous MeasurementType's.
     */
    private initMeasurement(measurement: Measurement): void {
        switch (measurement.type) {
            case MeasurementType.Classification:
                this.classificationMeasurement = measurement;
                this.pushEmptyClassValue();
                for (let classesKey in this.classificationMeasurement.classes) {
                    const value = this.classificationMeasurement.classes[classesKey];
                    this.addClassForm.controls.classes.push(this.newClassRow(classesKey, value));
                }
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

    private pushEmptyClassValue() {
        if (!this.classificationMeasurement) {
            return;
        }
        if (Object.keys(this.classificationMeasurement.classes).length == 0 && this.addClassForm.controls.classes.length < 1) {
            // there must always be one of those forms, s.t.
            // users can always enter some first class.
            // This is not necessary if there are some classes already in the system
            this.addClassForm.controls.classes.push(this.newClassRow());
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
                this.pushEmptyClassValue();
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

    removeClass(index: number) {
        if (!this.classificationMeasurement) {
            return;
        }

        const key = this.addClassForm.controls.classes.at(index).controls.key.value;
        this.addClassForm.controls.classes.removeAt(index);
        delete this.classificationMeasurement.classes[key];
        // notify observers to mark forms as dirty
        this.onInputChange.emit();
    }

    protected isLast(i: number): boolean {
        return this.addClassForm.controls.classes.length - 1 === i;
    }

    addClass(i: number) {
        if (!this.classificationMeasurement) {
            return;
        }

        const key = this.addClassForm.controls.classes.at(i).value.key;
        const value = this.addClassForm.controls.classes.at(i).value.value;
        // x == null is sufficient to test for both null and undefined
        if (!(key == null || value == null)) {
            this.classificationMeasurement.classes[key] = value;
        }
        this.addClassForm.controls.classes.push(this.newClassRow());
    }

    inputChange(content: Event) {
        this.onInputChange.emit(content);
    }

    onClassValueChange(content: Event, i: number) {
        // Save the currently edited class to the measurement iff it is valid
        if (i != undefined && this.addClassForm.controls.classes.at(i).valid && this.classificationMeasurement) {
            const key = this.addClassForm.controls.classes.at(i).value.key!;
            const old = this.classificationMeasurement.classes[key];
            delete this.classificationMeasurement.classes[key];
            const value = content.target as HTMLInputElement;
            this.classificationMeasurement.classes[value.value] = old;
        }
        this.onInputChange.emit(content);
    }

    onClassLabelChange(content: Event, i: number) {
        // Save the currently edited class to the measurement iff it is valid
        if (i != undefined && this.addClassForm.controls.classes.at(i).valid && this.classificationMeasurement) {
            const key = this.addClassForm.controls.classes.at(i).value.key!;
            const value = content.target as HTMLInputElement;
            this.classificationMeasurement.classes[key] = value.value;
        }
        this.onInputChange.emit(content);
    }
}
