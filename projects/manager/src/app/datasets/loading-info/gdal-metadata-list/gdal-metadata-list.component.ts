import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {GdalDatasetParametersComponent, GdalDatasetParametersForm} from '../gdal-dataset-parameters/gdal-dataset-parameters.component';
import {TimeInterval} from '@geoengine/common';
import moment from 'moment';
import {DataPath} from '@geoengine/openapi-client';

export interface GdalMetadataListForm {
    timeSlices: FormArray<FormGroup<TimeSliceForm>>;
}

export interface TimeSliceForm {
    timeInterval: FormControl<TimeInterval>;
    gdalParameters: FormGroup<GdalDatasetParametersForm>;
    cacheTtl: FormControl<number>;
}

@Component({
    selector: 'geoengine-manager-gdal-metadata-list',
    templateUrl: './gdal-metadata-list.component.html',
    styleUrl: './gdal-metadata-list.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GdalMetadataListComponent {
    form: FormGroup<GdalMetadataListForm> = this.setUpForm();

    @Input() dataPath?: DataPath;

    selectedTimeSlice = 0;

    addTimeSlice(): void {
        // TODO: re-use previous time slice gdal parameters?
        this.form.controls.timeSlices.push(
            new FormGroup<TimeSliceForm>({
                timeInterval: new FormControl(
                    {
                        start: moment.utc(),
                        timeAsPoint: true,
                        end: moment.utc(),
                    },
                    {
                        nonNullable: true,
                        validators: [Validators.required],
                    },
                ),
                gdalParameters: GdalDatasetParametersComponent.setUpPlaceholderForm(),
                cacheTtl: new FormControl<number>(0, {
                    nonNullable: true,
                    validators: [Validators.required],
                }),
            }),
        );
    }

    selectTimeSlice(index: number): void {
        this.selectedTimeSlice = index;
    }

    getTime(i: number): string {
        return this.form.controls.timeSlices.at(i).controls.timeInterval.value.start.format('YYYY-MM-DD HH:mm:ss');
    }

    private setUpForm(): FormGroup<GdalMetadataListForm> {
        // TODO: validate that time slices do not overlap
        const form = new FormGroup<GdalMetadataListForm>({
            timeSlices: new FormArray<FormGroup<TimeSliceForm>>([
                new FormGroup<TimeSliceForm>({
                    timeInterval: new FormControl(
                        {
                            start: moment.utc(),
                            timeAsPoint: true,
                            end: moment.utc(),
                        },
                        {
                            nonNullable: true,
                            validators: [Validators.required],
                        },
                    ),
                    gdalParameters: GdalDatasetParametersComponent.setUpPlaceholderForm(),
                    cacheTtl: new FormControl<number>(0, {
                        nonNullable: true,
                        validators: [Validators.required],
                    }),
                }),
            ]),
        });

        return form;
    }
}
