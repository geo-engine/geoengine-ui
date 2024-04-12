import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {GdalDatasetParametersComponent, GdalDatasetParametersForm} from '../gdal-dataset-parameters/gdal-dataset-parameters.component';
import {DatasetsService, TimeInterval, errorToText} from '@geoengine/common';
import moment from 'moment';
import {
    DataPath,
    GdalDatasetParameters,
    GdalLoadingInfoTemporalSlice,
    GdalMetaDataList,
    RasterDataType,
    RasterResultDescriptor,
} from '@geoengine/openapi-client';
import {MatSnackBar} from '@angular/material/snack-bar';

export interface GdalMetadataListForm {
    mainFile: FormControl<string>;
    timeSlices: FormArray<FormGroup<TimeSliceForm>>;
    rasterResultDescriptor: FormGroup<RasterResultDescriptorForm>;
}

export interface TimeSliceForm {
    time: FormControl<TimeInterval>;
    gdalParameters: FormGroup<GdalDatasetParametersForm>;
    cacheTtl: FormControl<number>;
}

export interface RasterResultDescriptorForm {
    bandName: FormControl<string>;
    dataType: FormControl<RasterDataType>;
    spatialReference: FormControl<string>;
}

@Component({
    selector: 'geoengine-manager-gdal-metadata-list',
    templateUrl: './gdal-metadata-list.component.html',
    styleUrl: './gdal-metadata-list.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GdalMetadataListComponent {
    RasterDataTypes = Object.values(RasterDataType);

    form: FormGroup<GdalMetadataListForm> = this.setUpForm();

    @Input() dataPath?: DataPath;

    selectedTimeSlice = 0;

    constructor(
        private readonly datasetsService: DatasetsService,
        private readonly snackBar: MatSnackBar,
    ) {}

    addTimeSlicePlaceholder(): void {
        this.addTimeSlice(GdalDatasetParametersComponent.placeHolderGdalParams());
    }

    addTimeSlice(gdalParams: GdalDatasetParameters): void {
        // TODO: re-use previous time slice gdal parameters?
        this.form.controls.timeSlices.push(
            new FormGroup<TimeSliceForm>({
                time: new FormControl(
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
                gdalParameters: GdalDatasetParametersComponent.setUpForm(gdalParams),
                cacheTtl: new FormControl<number>(0, {
                    nonNullable: true,
                    validators: [Validators.required],
                }),
            }),
        );
        this.selectTimeSlice(this.form.controls.timeSlices.length - 1);
    }

    removeTimeSlice(): void {
        this.form.controls.timeSlices.removeAt(this.selectedTimeSlice);
        if (this.selectedTimeSlice >= this.form.controls.timeSlices.length) {
            this.selectedTimeSlice = this.form.controls.timeSlices.length - 1;
        }
        this.selectTimeSlice(this.selectedTimeSlice);
    }

    selectTimeSlice(index: number): void {
        this.selectedTimeSlice = index;
    }

    getTime(i: number): string {
        return this.form.controls.timeSlices.at(i).controls.time.value.start.format('YYYY-MM-DD HH:mm:ss');
    }

    getParams(): GdalLoadingInfoTemporalSlice[] {
        return this.form.controls.timeSlices.value.map((slice) => {
            return {
                time: {
                    start: slice.time!.start.valueOf(),
                    end: slice.time!.end.valueOf(),
                },
                gdalParameters: slice.gdalParameters,
                cacheTtl: slice.cacheTtl,
            };
        });
    }

    async suggest(): Promise<void> {
        if (!this.dataPath) {
            this.snackBar.open('No data path selected.', 'Close', {panelClass: ['error-snackbar']});
            return;
        }

        try {
            const suggestion = await this.datasetsService.suggestMetaData({
                suggestMetaData: {
                    dataPath: this.dataPath,
                    mainFile: this.form.controls.mainFile.value,
                },
            });

            if (suggestion.metaData.type !== 'GdalMetaDataList') {
                this.snackBar.open(`Metadata suggestion is not of type "GdalMetaDataList" but ${suggestion.metaData.type}`, 'Close', {
                    panelClass: ['error-snackbar'],
                });
                return;
            }

            const gdalMetaDataList = suggestion.metaData as GdalMetaDataList;
            const slices = gdalMetaDataList.params;

            if (slices.length === 0) {
                this.snackBar.open('No time slices found in metadata suggestion.', 'Close', {panelClass: ['error-snackbar']});
                return;
            }

            const firstSlice = slices[0];
            const gdalParams = firstSlice.params;

            if (!gdalParams) {
                this.snackBar.open('No gdal parameters found in metadata suggestion.', 'Close', {panelClass: ['error-snackbar']});
                return;
            }

            if (this.form.controls.timeSlices.length === 0) {
                this.addTimeSlice(gdalParams);
            } else {
                this.form.controls.timeSlices.at(this.selectedTimeSlice).controls.gdalParameters =
                    GdalDatasetParametersComponent.setUpForm(gdalParams);
            }
            this.setResultsDescriptor(gdalMetaDataList.resultDescriptor);
        } catch (error) {
            const errorMessage = await errorToText(error, 'Metadata suggestion failed.');
            this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
        }
    }

    setResultsDescriptor(resultDescriptor: RasterResultDescriptor): void {
        this.form.controls.rasterResultDescriptor.controls.bandName.setValue(resultDescriptor.bands[0].name);
        this.form.controls.rasterResultDescriptor.controls.dataType.setValue(resultDescriptor.dataType);
        this.form.controls.rasterResultDescriptor.controls.spatialReference.setValue(resultDescriptor.spatialReference);
    }

    private setUpForm(): FormGroup<GdalMetadataListForm> {
        // TODO: validate that time slices do not overlap
        const form = new FormGroup<GdalMetadataListForm>({
            mainFile: new FormControl<string>('', {
                nonNullable: true,
                validators: [Validators.required],
            }),
            timeSlices: new FormArray<FormGroup<TimeSliceForm>>([
                new FormGroup<TimeSliceForm>({
                    time: new FormControl(
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
            rasterResultDescriptor: new FormGroup<RasterResultDescriptorForm>({
                bandName: new FormControl('', {
                    nonNullable: true,
                    validators: [Validators.required],
                }),
                dataType: new FormControl(RasterDataType.U8, {
                    nonNullable: true,
                    validators: [Validators.required],
                }),
                spatialReference: new FormControl('', {
                    nonNullable: true,
                    validators: [Validators.required],
                }),
            }),
        });

        return form;
    }
}
