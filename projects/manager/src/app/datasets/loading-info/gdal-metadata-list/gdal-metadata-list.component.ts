import {Component} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {GdalDatasetParametersComponent, GdalDatasetParametersForm} from '../gdal-dataset-parameters/gdal-dataset-parameters.component';

export interface GdalMetadataListForm {
    timeSlices: FormArray<FormGroup<TimeSliceForm>>;
}

export interface TimeSliceForm {
    timeInterval: FormGroup<TimeIntervalForm>;
    gdalParameters: FormGroup<GdalDatasetParametersForm>;
    cacheTtl: FormControl<number>;
}

export interface TimeIntervalForm {
    start: FormControl<string>; // TODO
    end: FormControl<string>;
}

@Component({
    selector: 'geoengine-manager-gdal-metadata-list',
    templateUrl: './gdal-metadata-list.component.html',
    styleUrl: './gdal-metadata-list.component.scss',
})
export class GdalMetadataListComponent {
    form: FormGroup<GdalMetadataListForm> = this.setUpForm();

    selectedGdalParameters?: FormGroup<GdalDatasetParametersForm>;

    constructor() {
        this.selectTimeSlice(0);
    }

    addTimeSlice(): void {
        // TODO: re-use previous time slice gdal parameters?
        this.form.controls.timeSlices.push(
            new FormGroup<TimeSliceForm>({
                timeInterval: new FormGroup<TimeIntervalForm>({
                    start: new FormControl<string>('', {
                        nonNullable: true,
                        validators: [Validators.required],
                    }),
                    end: new FormControl<string>('', {
                        nonNullable: true,
                        validators: [Validators.required],
                    }),
                }),
                gdalParameters: GdalDatasetParametersComponent.setUpPlaceholderForm(),
                cacheTtl: new FormControl<number>(0, {
                    nonNullable: true,
                    validators: [Validators.required],
                }),
            }),
        );
    }

    selectTimeSlice(index: number): void {
        this.selectedGdalParameters = this.form.controls.timeSlices.at(index).controls.gdalParameters;
    }

    private setUpForm(): FormGroup<GdalMetadataListForm> {
        return new FormGroup<GdalMetadataListForm>({
            timeSlices: new FormArray<FormGroup<TimeSliceForm>>([
                new FormGroup<TimeSliceForm>({
                    timeInterval: new FormGroup<TimeIntervalForm>({
                        start: new FormControl<string>('', {
                            nonNullable: true,
                            validators: [Validators.required],
                        }),
                        end: new FormControl<string>('', {
                            nonNullable: true,
                            validators: [Validators.required],
                        }),
                    }),
                    gdalParameters: GdalDatasetParametersComponent.setUpPlaceholderForm(),
                    cacheTtl: new FormControl<number>(0, {
                        nonNullable: true,
                        validators: [Validators.required],
                    }),
                }),
            ]),
        });
    }
}
