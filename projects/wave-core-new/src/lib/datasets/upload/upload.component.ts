import {HttpEventType} from '@angular/common/http';
import {Component, ChangeDetectionStrategy, ViewChild, ChangeDetectorRef} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatChipInputEvent} from '@angular/material/chips';
import {MatStepper} from '@angular/material/stepper';
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
    OgrSourceDurationSpecDict,
    OgrSourceTimeFormatDict,
    TimeStepGranularityDict,
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
    timeDurationValueTypes = ['infinite', 'value', 'zero'];
    timeTypes = ['None', 'Start', 'Start/End', 'Start/Duration'];
    timeFormats = ['auto', 'unixTimeStamp', 'custom'];
    timestampTypes = ['epochSeconds', 'epochMilliseconds'];
    errorHandlings = ['ignore', 'abort'];
    readonly timeGranularityOptions: Array<TimeStepGranularityDict> = ['millis', 'seconds', 'minutes', 'hours', 'days', 'months', 'years'];
    readonly defaultTimeGranularity: TimeStepGranularityDict = 'seconds';

    @ViewChild(MatStepper) stepper!: MatStepper;

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
            mainFile: new FormControl('', Validators.required),
            layerName: new FormControl('', Validators.required),
            dataType: new FormControl('', Validators.required),
            timeType: new FormControl('', Validators.required),
            timeStartColumn: new FormControl(''),
            timeStartFormat: new FormControl(''),
            timeStartFormatCustom: new FormControl(''), // TODO: validate format
            timeStartFormatUnix: new FormControl(''),
            timeDurationColumn: new FormControl(''),
            timeDurationValue: new FormControl(1), // TODO: validate is positive integer
            timeDurationValueType: new FormControl('infinite'),
            timeDurationGranularity: new FormControl(this.defaultTimeGranularity),
            timeEndColumn: new FormControl(''),
            timeEndFormat: new FormControl(''),
            timeEndFormatCustom: new FormControl(''), // TODO: validate format
            timeEndFormatUnix: new FormControl(''),
            columnsX: new FormControl(''),
            columnsY: new FormControl(''),
            columnsText: new FormControl(''),
            columnsFloat: new FormControl(''),
            columnsInt: new FormControl(''),
            errorHandling: new FormControl('skip', Validators.required),
            spatialReference: new FormControl('EPSG:4326', Validators.required), // TODO: validate sref string
        });

        this.formNameDescription = new FormGroup({
            name: new FormControl('', Validators.required),
            description: new FormControl(''),
        });
    }

    changeTimeType(): void {
        const form = this.formMetaData.controls;
        const timeType = form.timeType.value;

        form.timeStartColumn.clearValidators();
        form.timeStartFormat.clearValidators();
        form.timeStartFormatCustom.clearValidators();
        form.timeStartFormatUnix.clearValidators();
        form.timeDurationColumn.clearValidators();
        form.timeDurationValue.clearValidators();
        form.timeDurationValueType.clearValidators();
        form.timeDurationGranularity.clearValidators();
        form.timeEndColumn.clearValidators();
        form.timeEndFormat.clearValidators();
        form.timeEndFormatCustom.clearValidators();
        form.timeEndFormatUnix.clearValidators();

        if (timeType === 'Start') {
            form.timeStartColumn.setValidators(Validators.required);
            form.timeStartFormat.setValidators(Validators.required);
            form.timeDurationValueType.setValidators(Validators.required);
        } else if (timeType === 'Start/Duration') {
            form.timeStartColumn.setValidators(Validators.required);
            form.timeStartFormat.setValidators(Validators.required);
            form.timeDurationColumn.setValidators(Validators.required);
        } else if (timeType === 'Start/End') {
            form.timeStartColumn.setValidators(Validators.required);
            form.timeStartFormat.setValidators(Validators.required);
            form.timeEndColumn.setValidators(Validators.required);
            form.timeEndFormat.setValidators(Validators.required);
        }

        form.timeStartColumn.updateValueAndValidity();
        form.timeStartFormat.updateValueAndValidity();
        form.timeStartFormatCustom.updateValueAndValidity();
        form.timeStartFormatUnix.updateValueAndValidity();
        form.timeDurationColumn.updateValueAndValidity();
        form.timeDurationValueType.updateValueAndValidity();
        form.timeDurationGranularity.updateValueAndValidity();
        form.timeDurationValue.updateValueAndValidity();
        form.timeEndColumn.updateValueAndValidity();
        form.timeEndFormat.updateValueAndValidity();
        form.timeEndFormatCustom.updateValueAndValidity();
        form.timeEndFormatUnix.updateValueAndValidity();
    }

    changeTimeStartFormat(): void {
        const form = this.formMetaData.controls;

        if (form.timeStartFormat.value === 'custom') {
            form.timeStartFormatCustom.setValidators(Validators.required);
        } else {
            form.timeStartFormatCustom.clearValidators();
        }
        form.timeStartFormatCustom.updateValueAndValidity();

        if (form.timeStartFormat.value === 'unixTimeStamp') {
            form.timeStartFormatUnix.setValidators(Validators.required);
        } else {
            form.timeStartFormatUnix.clearValidators();
        }
        form.timeStartFormatUnix.updateValueAndValidity();
    }

    changeTimeEndFormat(): void {
        const form = this.formMetaData.controls;

        if (form.timeEndFormat.value === 'custom') {
            form.timeEndFormatCustom.setValidators(Validators.required);
        } else {
            form.timeEndFormatCustom.clearValidators();
        }
        form.timeEndFormatCustom.updateValueAndValidity();

        if (form.timeEndFormat.value === 'unixTimeStamp') {
            form.timeEndFormatUnix.setValidators(Validators.required);
        } else {
            form.timeEndFormatUnix.clearValidators();
        }
        form.timeEndFormatUnix.updateValueAndValidity();
    }

    changeTimeDurationValueType(): void {
        const form = this.formMetaData.controls;
        if (form.timeDurationValueType.value === 'value') {
            form.timeDurationValue.setValidators(Validators.required);
            form.timeDurationGranularity.setValidators(Validators.required);
        } else {
            form.timeDurationValue.clearValidators();
            form.timeDurationGranularity.clearValidators();
        }
        form.timeDurationValue.updateValueAndValidity();
        form.timeDurationGranularity.updateValueAndValidity();
    }

    removeText(column: string): void {
        const columns: Array<string> = this.formMetaData.controls.columnsText.value;

        const index = columns.indexOf(column);
        if (index > -1) {
            columns.splice(index, 1);
        }
    }

    addText(event: MatChipInputEvent): void {
        const columns: Array<string> = this.formMetaData.controls.columnsText.value;
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
        const columns: Array<string> = this.formMetaData.controls.columnsInt.value;

        const index = columns.indexOf(column);
        if (index > -1) {
            columns.splice(index, 1);
        }
    }

    addInt(event: MatChipInputEvent): void {
        const columns: Array<string> = this.formMetaData.controls.columnsInt.value;
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
        const columns: Array<string> = this.formMetaData.controls.columnsFloat.value;

        const index = columns.indexOf(column);
        if (index > -1) {
            columns.splice(index, 1);
        }
    }

    addFloat(event: MatChipInputEvent): void {
        const columns: Array<string> = this.formMetaData.controls.columnsFloat.value;
        const column = event.value;
        const input = event.input;

        if (columns.indexOf(column)) {
            columns.push(column);
        }

        if (input) {
            input.value = '';
        }
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
                    if (this.stepper.selected) {
                        this.stepper.selected.completed = true;
                        this.stepper.selected.editable = false;
                    }
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
        this.suggest(this.formMetaData.controls.mainFile.value);
    }

    submitCreate(): void {
        if (!this.uploadId) {
            return;
        }

        const formMeta = this.formMetaData.controls;
        const formDataset = this.formNameDescription.controls;

        const metaData: MetaDataDefinitionDict = {
            type: 'OgrMetaData',
            loadingInfo: {
                fileName: formMeta.mainFile.value,
                layerName: formMeta.layerName.value,
                dataType: formMeta.dataType.value,
                time: this.getTime(),
                columns: {
                    x: formMeta.columnsX.value,
                    y: formMeta.columnsY.value,
                    text: formMeta.columnsText.value,
                    float: formMeta.columnsFloat.value,
                    int: formMeta.columnsInt.value,
                },
                forceOgrTimeFilter: false,
                onError: formMeta.errorHandling.value,
            },
            resultDescriptor: {
                type: 'vector',
                dataType: formMeta.dataType.value,
                spatialReference: formMeta.spatialReference.value,
                columns: this.getColumnsAsMap(),
            },
        };

        const addData: AddDatasetDict = {
            name: formDataset.name.value,
            description: formDataset.description.value,
            sourceOperator: 'OgrSource',
        };

        const definition: DatasetDefinitionDict = {
            properties: addData,
            metaData,
        };

        const create: CreateDatasetDict = {
            upload: this.uploadId,
            definition,
        };

        this.datasetService.createDataset(create).subscribe(
            (response) => {
                this.datasetId = response.id;
                if (this.stepper.selected) {
                    this.stepper.selected.completed = true;
                    this.stepper.selected.editable = false;
                }
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

        this.datasetService.suggestMetaData({upload: this.uploadId, mainFile}).subscribe(
            (suggest) => {
                const info = suggest.metaData.loadingInfo;
                const start = this.getStartTime(info?.time);
                const end = this.getEndTime(info?.time);
                this.formMetaData.patchValue({
                    mainFile: suggest.mainFile,
                    layerName: info?.layerName,
                    dataType: info?.dataType,
                    timeType: info ? this.getTimeType(info.time) : 'None',
                    timeStartColumn: start ? start.startField : '',
                    timeStartFormat: start ? start.startFormat.format : '',
                    timeStartFormatCustom: start ? start.startFormat.customFormat : '',
                    timeStartFormatUnix: start ? start.startFormat.timestampType : '',
                    timeDurationColumn: info?.time.type === 'start+duration' ? info?.time.durationField : '',
                    timeDurationValue: info?.time.type === 'start' ? info?.time.duration : 1,
                    timeDurationValueType: info?.time.type === 'start' ? info?.time.duration.type : 'infinite',
                    timeEndColumn: end ? end.endField : '',
                    timeEndFormat: end ? end.endFormat.format : '',
                    timeEndFormatCustom: end ? end.endFormat.customFormat : '',
                    timeEndFormatUnix: end ? end.endFormat.timestampType : '',
                    columnsX: info?.columns?.x,
                    columnsY: info?.columns?.y,
                    columnsText: info?.columns?.text,
                    columnsFloat: info?.columns?.float,
                    columnsInt: info?.columns?.int,
                    errorHandling: info?.onError,
                    spatialReference: suggest.metaData.resultDescriptor.spatialReference,
                });
                this.changeDetectorRef.markForCheck();
            },
            (err) => this.notificationService.error(err.message),
        );
    }

    private getStartTime(
        time: OgrSourceDatasetTimeTypeDict | undefined,
    ): undefined | {startField: string; startFormat: OgrSourceTimeFormatDict; custom?: string} {
        if (!time || time.type === 'none') {
            return undefined;
        }

        return time;
    }

    private getEndTime(
        time: OgrSourceDatasetTimeTypeDict | undefined,
    ): undefined | {endField: string; endFormat: OgrSourceTimeFormatDict; custom?: string} {
        if (!time || time.type === 'none') {
            return undefined;
        }

        if (time.type === 'start+end') {
            return time;
        }

        return undefined;
    }

    private getColumnsAsMap(): {[key: string]: 'categorical' | 'int' | 'float' | 'text'} {
        const formMeta = this.formMetaData.controls;
        const columns: {[key: string]: 'categorical' | 'int' | 'float' | 'text'} = {};

        for (const column of formMeta.columnsText.value as Array<string>) {
            columns[column] = 'text';
        }

        for (const column of formMeta.columnsInt.value as Array<string>) {
            columns[column] = 'int';
        }

        for (const column of formMeta.columnsFloat.value as Array<string>) {
            columns[column] = 'float';
        }
        return columns;
    }

    private getDuration(): OgrSourceDurationSpecDict {
        const formMeta = this.formMetaData.controls;

        if (formMeta.timeDurationValueType.value === 'zero') {
            return {
                type: 'zero',
            };
        } else if (formMeta.timeDurationValueType.value === 'infinite') {
            return {
                type: 'infinite',
            };
        } else if (formMeta.timeDurationValueType.value === 'value') {
            return {
                type: 'value',
                granularity: formMeta.timeDurationGranularity.value,
                step: formMeta.timeDurationValue.value,
            };
        }

        throw Error('Invalid time duration type');
    }

    private getTime(): OgrSourceDatasetTimeTypeDict {
        const formMeta = this.formMetaData.controls;
        let time: OgrSourceDatasetTimeTypeDict = {
            type: 'none',
        };

        if (formMeta.timeType.value === 'Start') {
            const format: OgrSourceTimeFormatDict = {
                format: formMeta.timeStartFormat.value,
            };

            if (format.format === 'custom') {
                format.customFormat = formMeta.timeStartFormatCustom.value;
            } else if (format.format === 'unixTimeStamp') {
                format.timestampType = formMeta.timeStartFormatUnix.value;
            }

            time = {
                type: 'start',
                startField: formMeta.timeStartColumn.value,
                startFormat: format,
                duration: this.getDuration(),
            };
        } else if (formMeta.timeType.value === 'Start/End') {
            const startFormat: OgrSourceTimeFormatDict = {
                format: formMeta.timeStartFormat.value,
            };

            if (startFormat.format === 'custom') {
                startFormat.customFormat = formMeta.timeStartFormatCustom.value;
            } else if (startFormat.format === 'unixTimeStamp') {
                startFormat.timestampType = formMeta.timeStartFormatUnix.value;
            }

            const endFormat: OgrSourceTimeFormatDict = {
                format: formMeta.timeStartFormat.value,
            };

            if (endFormat.format === 'custom') {
                endFormat.customFormat = formMeta.timeEndFormatCustom.value;
            } else if (endFormat.format === 'unixTimeStamp') {
                endFormat.timestampType = formMeta.timeEndFormatUnix.value;
            }

            time = {
                type: 'start+end',
                startField: formMeta.timeStartColumn.value,
                startFormat,
                endField: formMeta.timeEndColumn.value,
                endFormat,
            };
        } else if (formMeta.timeType.value === 'Start/Duration') {
            const format: OgrSourceTimeFormatDict = {
                format: formMeta.timeStartFormat.value,
            };

            if (format.format === 'custom') {
                format.customFormat = formMeta.timeStartFormatCustom.value;
            } else if (format.format === 'unixTimeStamp') {
                format.timestampType = formMeta.timeStartFormatUnix.value;
            }

            time = {
                type: 'start+duration',
                startField: formMeta.timeStartColumn.value,
                startFormat: format,
                durationField: formMeta.timeDurationColumn.value,
            };
        }
        return time;
    }

    private getTimeType(time: OgrSourceDatasetTimeTypeDict): string {
        if (time.type === 'none') {
            return 'None';
        }
        if (time.type === 'start') {
            return 'Start';
        } else if (time.type === 'start+duration') {
            return 'Start/Duration';
        } else if (time.type === 'start+end') {
            return 'Start/End';
        }
        return 'None';
    }
}
