import {HttpEventType} from '@angular/common/http';
import {Component, ChangeDetectionStrategy, ViewChild, ChangeDetectorRef} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatChipInputEvent} from '@angular/material/chips';
import {MatVerticalStepper} from '@angular/material/stepper';
import {Subject} from 'rxjs';
import {mergeMap} from 'rxjs/operators';
import {
    AddDatasetDict,
    CreateDatasetDict,
    DatasetDefinitionDict,
    DatasetIdDict,
    MetaDataDefinitionDict,
    MetaDataSuggestionDict,
    OgrSourceDatasetTimeTypeDict,
    OgrSourceTimeFormatDict,
    UUID,
} from '../../backend/backend.model';
import {NotificationService} from '../../notification.service';
import {ProjectService} from '../../project/project.service';
import {DatasetService} from '../dataset.service';

@Component({
    selector: 'wave-upload',
    templateUrl: './upload.component.html',
    styleUrls: ['./upload.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadComponent {
    vectorDataTypes = ['Data', 'MultiPoint', 'MultiLineString', 'MultiPolygon'];
    timeTypes = ['None', 'Start', 'Start/End', 'Start/Duration'];
    timeFormats = ['iso', 'seconds', 'custom'];
    errorHandlings = ['skip', 'abort', 'keep'];

    @ViewChild(MatVerticalStepper) stepper!: MatVerticalStepper;

    progress$ = new Subject<number>();
    metaDataSuggestion$ = new Subject<MetaDataSuggestionDict>();

    uploadId?: UUID;
    datasetId?: DatasetIdDict;
    selectedFiles?: Array<File>;
    selectedTimeType?: string;

    formMetaData: FormGroup;
    formNameDescription: FormGroup;

    constructor(
        protected datasetService: DatasetService,
        protected notificationService: NotificationService,
        protected projectService: ProjectService,
        protected changeDetectorRef: ChangeDetectorRef,
    ) {
        this.formMetaData = new FormGroup({
            main_file: new FormControl('', Validators.required),
            layer_name: new FormControl('', Validators.required),
            data_type: new FormControl('', Validators.required),
            time_type: new FormControl('', Validators.required),
            time_start_column: new FormControl(''),
            time_start_format: new FormControl(''),
            time_start_format_custom: new FormControl(''), // TODO: validate format
            time_duration_column: new FormControl(''),
            time_duration_value: new FormControl(0), // TODO: validate is positive integer
            time_end_column: new FormControl(''),
            time_end_format: new FormControl(''),
            time_end_format_custom: new FormControl(''), // TODO: validate format
            columns_x: new FormControl(''),
            columns_y: new FormControl(''),
            columns_textual: new FormControl(''),
            columns_float: new FormControl(''),
            columns_int: new FormControl(''),
            error_handling: new FormControl('skip', Validators.required),
            spatial_reference: new FormControl('EPSG:4326', Validators.required), // TODO: validate sref string
        });

        this.formNameDescription = new FormGroup({
            name: new FormControl('', Validators.required),
            description: new FormControl(''),
        });
    }

    changeTimeType(): void {
        const form = this.formMetaData.controls;
        const timeType = form.time_type.value;

        form.time_start_column.clearValidators();
        form.time_start_format.clearValidators();
        form.time_start_format_custom.clearValidators();
        form.time_duration_column.clearValidators();
        form.time_duration_value.clearValidators();
        form.time_end_column.clearValidators();
        form.time_end_format.clearValidators();
        form.time_end_format_custom.clearValidators();

        if (timeType === 'Start') {
            form.time_start_column.setValidators(Validators.required);
            form.time_start_format.setValidators(Validators.required);
            form.time_duration_value.setValidators(Validators.required);
        } else if (timeType === 'Start/Duration') {
            form.time_start_column.setValidators(Validators.required);
            form.time_start_format.setValidators(Validators.required);
            form.time_duration_column.setValidators(Validators.required);
        } else if (timeType === 'Start/End') {
            form.time_start_column.setValidators(Validators.required);
            form.time_start_format.setValidators(Validators.required);
            form.time_end_column.setValidators(Validators.required);
            form.time_end_format.setValidators(Validators.required);
        }

        form.time_start_column.updateValueAndValidity();
        form.time_start_format.updateValueAndValidity();
        form.time_start_format_custom.updateValueAndValidity();
        form.time_duration_column.updateValueAndValidity();
        form.time_duration_value.updateValueAndValidity();
        form.time_end_column.updateValueAndValidity();
        form.time_end_format.updateValueAndValidity();
        form.time_end_format_custom.updateValueAndValidity();
    }

    changeTimeStartFormat(): void {
        const form = this.formMetaData.controls;
        if (form.time_start_format.value === 'Custom') {
            form.time_start_format_custom.setValidators(Validators.required);
        } else {
            form.time_start_format_custom.clearValidators();
        }
    }

    changeTimeEndFormat(): void {
        const form = this.formMetaData.controls;
        if (form.time_end_format.value === 'Custom') {
            form.time_end_format_custom.setValidators(Validators.required);
        } else {
            form.time_end_format_custom.clearValidators();
        }
    }

    removeTextual(column: string): void {
        const columns: Array<string> = this.formMetaData.controls.columns_textual.value;

        const index = columns.indexOf(column);
        if (index > -1) {
            columns.splice(index, 1);
        }
    }

    addTextual(event: MatChipInputEvent): void {
        const columns: Array<string> = this.formMetaData.controls.columns_textual.value;
        const column = event.value;
        const input = event.input;

        if (columns.indexOf(column)) {
            columns.push(column);
        }

        if (input) {
            input.value = '';
        }
    }

    removeInt(column: string): void {
        const columns: Array<string> = this.formMetaData.controls.columns_int.value;

        const index = columns.indexOf(column);
        if (index > -1) {
            columns.splice(index, 1);
        }
    }

    addInt(event: MatChipInputEvent): void {
        const columns: Array<string> = this.formMetaData.controls.columns_int.value;
        const column = event.value;
        const input = event.input;

        if (columns.indexOf(column)) {
            columns.push(column);
        }

        if (input) {
            input.value = '';
        }
    }

    removeFloat(column: string): void {
        const columns: Array<string> = this.formMetaData.controls.columns_float.value;

        const index = columns.indexOf(column);
        if (index > -1) {
            columns.splice(index, 1);
        }
    }

    addFloat(event: MatChipInputEvent): void {
        const columns: Array<string> = this.formMetaData.controls.columns_float.value;
        const column = event.value;
        const input = event.input;

        if (columns.indexOf(column)) {
            columns.push(column);
        }

        if (input) {
            input.value = '';
        }
    }

    selectFiles(target: HTMLInputElement | null): void {
        const fileList = target?.files;

        if (!fileList) {
            return;
        }

        this.selectedFiles = Array.from(fileList);
    }

    upload(): void {
        if (!this.selectedFiles) {
            return;
        }

        const form = new FormData();

        for (const file of this.selectedFiles) {
            form.append('files[]', file, file.name);
        }

        this.datasetService.upload(form).subscribe(
            (event) => {
                if (event.type === HttpEventType.UploadProgress) {
                    const fraction = event.total ? event.loaded / event.total : 1;
                    this.progress$.next(Math.round(100 * fraction));
                } else if (event.type === HttpEventType.Response) {
                    const uploadId = event.body?.id as UUID;
                    this.uploadId = uploadId;
                    this.stepper.selected.completed = true;
                    this.stepper.selected.editable = false;
                    this.stepper.next();

                    this.suggest();
                }
            },
            (err) => {
                this.notificationService.error('File upload failed: ' + err.message);
            },
        );
    }

    addToMap(): void {
        if (!this.datasetId) {
            return;
        }

        this.datasetService
            .getDataset(this.datasetId)
            .pipe(mergeMap((dataset) => this.datasetService.addDatasetToMap(dataset)))
            .subscribe();
    }

    reloadSuggestion(): void {
        this.suggest(this.formMetaData.controls.main_file.value);
    }

    submitCreate(): void {
        if (!this.uploadId) {
            return;
        }

        const formMeta = this.formMetaData.controls;
        const formDataset = this.formNameDescription.controls;

        const metaData: MetaDataDefinitionDict = {
            OgrMetaData: {
                loading_info: {
                    file_name: formMeta.main_file.value,
                    layer_name: formMeta.layer_name.value,
                    data_type: formMeta.data_type.value,
                    time: this.getTime(),
                    columns: {
                        x: formMeta.columns_x.value,
                        y: formMeta.columns_y.value,
                        textual: formMeta.columns_textual.value,
                        float: formMeta.columns_float.value,
                        int: formMeta.columns_int.value,
                    },
                    default_geometry: undefined, // TODO
                    force_ogr_time_filter: false,
                    on_error: formMeta.error_handling.value,
                    provenance: undefined, // TODO
                },
                result_descriptor: {
                    data_type: formMeta.data_type.value,
                    spatial_reference: formMeta.spatial_reference.value,
                    columns: this.getColumnsAsMap(),
                },
            },
        };

        const addData: AddDatasetDict = {
            name: formDataset.name.value,
            description: formDataset.description.value,
            source_operator: 'OgrSource',
        };

        const definition: DatasetDefinitionDict = {
            properties: addData,
            meta_data: metaData,
        };

        const create: CreateDatasetDict = {
            upload: this.uploadId,
            definition,
        };

        this.datasetService.createDataset(create).subscribe(
            (response) => {
                this.datasetId = response.id;
                this.stepper.selected.completed = true;
                this.stepper.selected.editable = false;
                const prevStep = this.stepper.steps.get(this.stepper.selectedIndex - 1);
                if (prevStep) {
                    prevStep.completed = true;
                    prevStep.editable = false;
                }

                this.stepper.next();

                this.suggest();
            },
            (err) => {
                this.notificationService.error('Create dataset failed: ' + err.message);
            },
        );
    }

    private suggest(mainFile: string | undefined = undefined): void {
        if (!this.uploadId) {
            return;
        }

        this.datasetService.suggestMetaData({upload: this.uploadId, main_file: mainFile}).subscribe(
            (suggest) => {
                const info = suggest.meta_data.OgrMetaData?.loading_info;
                const start = this.getStartTime(info?.time);
                const end = this.getEndTime(info?.time);
                this.formMetaData.patchValue({
                    main_file: suggest.main_file,
                    layer_name: info?.layer_name,
                    data_type: info?.data_type,
                    time_type: info ? this.getTimeType(info.time) : 'None',
                    time_start_column: start ? start.start_field : '',
                    time_start_format: start ? start.start_format.format : '',
                    time_start_format_custom: start ? start.start_format.custom_format : '',
                    time_duration_column: info?.time !== 'none' ? info?.time['start+duration']?.duration_field : '',
                    time_duration_value: info?.time !== 'none' ? info?.time.start?.duration : 0,
                    time_end_column: end ? end.end_field : '',
                    time_end_format: end ? end.end_format.format : '',
                    time_end_format_custom: end ? end.end_format.custom_format : '',
                    columns_x: info?.columns?.x,
                    columns_y: info?.columns?.y,
                    columns_textual: info?.columns?.textual,
                    columns_float: info?.columns?.float,
                    columns_int: info?.columns?.int,
                    error_handling: info?.on_error,
                    spatial_reference: suggest.meta_data.OgrMetaData?.result_descriptor.spatial_reference,
                });
                this.changeDetectorRef.markForCheck();
            },
            (err) => this.notificationService.error(err.message),
        );
    }

    private getStartTime(
        time: OgrSourceDatasetTimeTypeDict | undefined | 'none',
    ): undefined | {start_field: string; start_format: OgrSourceTimeFormatDict; custom?: string} {
        if (!time || time === 'none') {
            return undefined;
        }

        if (time.start) {
            return time.start;
        } else if (time['start+duration']) {
            return time['start+duration'];
        } else if (time['start+end']) {
            return time['start+end'];
        }

        return undefined;
    }

    private getEndTime(
        time: OgrSourceDatasetTimeTypeDict | undefined | 'none',
    ): undefined | {end_field: string; end_format: OgrSourceTimeFormatDict; custom?: string} {
        if (!time || time === 'none') {
            return undefined;
        }

        if (time['start+end']) {
            return time['start+end'];
        }

        return undefined;
    }

    private getColumnsAsMap(): {[key: string]: 'categorical' | 'int' | 'float' | 'text'} {
        const formMeta = this.formMetaData.controls;
        const columns: {[key: string]: 'categorical' | 'int' | 'float' | 'text'} = {};

        for (const column of formMeta.columns_textual.value as Array<string>) {
            columns[column] = 'text';
        }

        for (const column of formMeta.columns_int.value as Array<string>) {
            columns[column] = 'int';
        }

        for (const column of formMeta.columns_float.value as Array<string>) {
            columns[column] = 'float';
        }
        return columns;
    }

    private getTime(): 'none' | OgrSourceDatasetTimeTypeDict {
        const formMeta = this.formMetaData.controls;
        let time: 'none' | OgrSourceDatasetTimeTypeDict = 'none';

        if (formMeta.time_type.value === 'Start') {
            const format: OgrSourceTimeFormatDict = {
                format: formMeta.time_start_format.value.toLowerCase(),
            };

            if (format.format === 'custom') {
                format.custom_format = formMeta.time_start_format_custom.value;
            }

            time = {
                start: {
                    start_field: formMeta.time_start_column.value,
                    start_format: format,
                    duration: formMeta.time_duration_value.value,
                },
            };
        } else if (formMeta.time_type.value === 'Start/End') {
            const startFormat: OgrSourceTimeFormatDict = {
                format: formMeta.time_start_format.value.toLowerCase(),
            };

            if (startFormat.format === 'custom') {
                startFormat.custom_format = formMeta.time_start_format_custom.value;
            }

            const endFormat: OgrSourceTimeFormatDict = {
                format: formMeta.time_start_format.value.toLowerCase(),
            };

            if (endFormat.format === 'custom') {
                endFormat.custom_format = formMeta.time_start_format_custom.value;
            }

            time = {
                'start+end': {
                    start_field: formMeta.time_start_column.value,
                    start_format: startFormat,
                    end_field: formMeta.time_end_column.value,
                    end_format: endFormat,
                },
            };
        } else if (formMeta.time_type.value === 'Start/Duration') {
            const format: OgrSourceTimeFormatDict = {
                format: formMeta.time_start_format.value.toLowerCase(),
            };

            if (format.format === 'custom') {
                format.custom_format = formMeta.time_start_format_custom.value;
            }

            time = {
                'start+duration': {
                    start_field: formMeta.time_start_column.value,
                    start_format: format,
                    duration_field: formMeta.time_duration_column.value,
                },
            };
        }
        return time;
    }

    private getTimeType(time: 'none' | OgrSourceDatasetTimeTypeDict): string {
        if (time === 'none') {
            return 'None';
        }
        if (time.start) {
            return 'Start';
        } else if (time['start+duration']) {
            return 'Start/Duration';
        } else if (time['start+end']) {
            return 'Start/End';
        }
        return 'None';
    }
}
