import {Component} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {GdalDatasetParametersComponent, GdalDatasetParametersForm} from '../gdal-dataset-parameters/gdal-dataset-parameters.component';
import {TimeIntervalForm} from '@geoengine/common';
import moment from 'moment';

export interface GdalMetadataListForm {
    timeSlices: FormArray<FormGroup<TimeSliceForm>>;
}

export interface TimeSliceForm {
    timeInterval: FormGroup<TimeIntervalForm>;
    gdalParameters: FormGroup<GdalDatasetParametersForm>;
    cacheTtl: FormControl<number>;
}

@Component({
    selector: 'geoengine-manager-gdal-metadata-list',
    templateUrl: './gdal-metadata-list.component.html',
    styleUrl: './gdal-metadata-list.component.scss',
})
export class GdalMetadataListComponent {
    form: FormGroup<GdalMetadataListForm> = this.setUpForm();

    selectedTimeSlice?: FormGroup<TimeSliceForm>;

    constructor() {
        this.selectTimeSlice(0);
    }

    updateTime(v: any): void {
        console.log(v);
    }

    addTimeSlice(): void {
        // TODO: re-use previous time slice gdal parameters?
        this.form.controls.timeSlices.push(
            new FormGroup<TimeSliceForm>({
                timeInterval: new FormGroup<TimeIntervalForm>({
                    start: new FormControl(moment.utc(), {
                        nonNullable: true,
                        validators: [Validators.required],
                    }),
                    timeAsPoint: new FormControl(true, {
                        nonNullable: true,
                        validators: [Validators.required],
                    }),
                    end: new FormControl(moment.utc(), {
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
        this.selectedTimeSlice = this.form.controls.timeSlices.at(index);
    }

    private setUpForm(): FormGroup<GdalMetadataListForm> {
        // TODO: validate that time slices do not overlap
        return new FormGroup<GdalMetadataListForm>({
            timeSlices: new FormArray<FormGroup<TimeSliceForm>>([
                new FormGroup<TimeSliceForm>({
                    timeInterval: new FormGroup<TimeIntervalForm>({
                        start: new FormControl(moment.utc(), {
                            nonNullable: true,
                            validators: [Validators.required],
                        }),
                        timeAsPoint: new FormControl(true, {
                            nonNullable: true,
                            validators: [Validators.required],
                        }),
                        end: new FormControl(moment.utc(), {
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
