import {HttpEventType} from '@angular/common/http';
import {Component, ChangeDetectionStrategy, ViewChild, ChangeDetectorRef, OnDestroy} from '@angular/core';
import {FormControl, FormGroup, UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';
import {MatChipInputEvent} from '@angular/material/chips';
import {MatStepper} from '@angular/material/stepper';
import {Subject, Subscription, of, zip} from 'rxjs';
import {map, mergeMap} from 'rxjs/operators';
import {
    MetaDataSuggestionDict,
    OgrSourceDatasetTimeTypeDict,
    OgrSourceDurationSpecDict,
    OgrSourceTimeFormatDict,
    TimeStepGranularityDict,
    UUID,
} from '../../backend/backend.model';
import {NotificationService} from '../../notification.service';
import {ProjectService} from '../../project/project.service';
import {UserService} from '../../users/user.service';
import {
    AddDataset,
    CreateDataset,
    DatasetDefinition,
    MetaDataDefinition,
    MetaDataSuggestion,
    OgrMetaData,
    OgrSourceDatasetTimeType,
    OgrSourceTimeFormat,
    VectorColumnInfo,
} from '@geoengine/openapi-client';
import {DatasetsService, UploadsService} from '@geoengine/common';

interface NameDescription {
    name: FormControl<string>;
    displayName: FormControl<string>;
    description: FormControl<string>;
}

@Component({
    selector: 'geoengine-upload',
    templateUrl: './upload.component.html',
    styleUrls: ['./upload.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
// implements OnDestroy
export class UploadComponent {
    // vectorDataTypes = ['Data', 'MultiPoint', 'MultiLineString', 'MultiPolygon'];
    // timeDurationValueTypes = ['infinite', 'value', 'zero'];
    // timeTypes = ['None', 'Start', 'Start/End', 'Start/Duration'];
    // timeFormats = ['auto', 'unixTimeStamp', 'custom'];
    // timestampTypes = ['epochSeconds', 'epochMilliseconds'];
    // errorHandlings = ['ignore', 'abort'];
    // readonly timeGranularityOptions: Array<TimeStepGranularityDict> = timeStepGranularityOptions;
    // readonly defaultTimeGranularity: TimeStepGranularityDict = 'seconds';
    // @ViewChild(MatStepper) stepper!: MatStepper;
    // progress$ = new Subject<number>();
    // metaDataSuggestion$ = new Subject<MetaDataSuggestionDict>();
    // uploadId?: UUID;
    // datasetName?: UUID;
    // selectedFiles?: Array<File>;
    // selectedTimeType?: string;
    // uploadFiles?: Array<string>;
    // formMetaData: UntypedFormGroup;
    // formNameDescription: FormGroup<NameDescription>;
    // userNamePrefix = '_';
    // uploadFileLayers: Array<string> = [];
    // private displayNameChangeSubscription: Subscription;
    // constructor(
    //     protected datasetsService: DatasetsService,
    //     protected uploadsService: UploadsService,
    //     protected notificationService: NotificationService,
    //     protected projectService: ProjectService,
    //     protected userService: UserService,
    //     protected changeDetectorRef: ChangeDetectorRef,
    // ) {
    //     this.formMetaData = new UntypedFormGroup({
    //         mainFile: new UntypedFormControl('', Validators.required),
    //         layerName: new UntypedFormControl('', Validators.required),
    //         dataType: new UntypedFormControl('', Validators.required),
    //         timeType: new UntypedFormControl('', Validators.required),
    //         timeStartColumn: new UntypedFormControl(''),
    //         timeStartFormat: new UntypedFormControl(''),
    //         timeStartFormatCustom: new UntypedFormControl(''), // TODO: validate format
    //         timeStartFormatUnix: new UntypedFormControl(''),
    //         timeDurationColumn: new UntypedFormControl(''),
    //         timeDurationValue: new UntypedFormControl(1), // TODO: validate is positive integer
    //         timeDurationValueType: new UntypedFormControl('infinite'),
    //         timeDurationGranularity: new UntypedFormControl(this.defaultTimeGranularity),
    //         timeEndColumn: new UntypedFormControl(''),
    //         timeEndFormat: new UntypedFormControl(''),
    //         timeEndFormatCustom: new UntypedFormControl(''), // TODO: validate format
    //         timeEndFormatUnix: new UntypedFormControl(''),
    //         columnsX: new UntypedFormControl(''),
    //         columnsY: new UntypedFormControl(''),
    //         columnsText: new UntypedFormControl(''),
    //         columnsFloat: new UntypedFormControl(''),
    //         columnsInt: new UntypedFormControl(''),
    //         errorHandling: new UntypedFormControl('skip', Validators.required),
    //         spatialReference: new UntypedFormControl('EPSG:4326', Validators.required), // TODO: validate sref string
    //     });
    //     this.formNameDescription = new FormGroup<NameDescription>({
    //         name: new FormControl('', {
    //             nonNullable: true,
    //             validators: [Validators.required, Validators.pattern(/^[a-zA-Z0-9_]+$/), Validators.minLength(1)],
    //         }),
    //         displayName: new FormControl('', {
    //             nonNullable: true,
    //             validators: [Validators.required],
    //         }),
    //         description: new FormControl('', {
    //             nonNullable: true,
    //         }),
    //     });
    //     this.userService.getSessionOnce().subscribe((session) => {
    //         if (session.user) {
    //             this.userNamePrefix = session.user.id;
    //         }
    //     });
    //     /**
    //      * Suggest a name based on the display name
    //      */
    //     this.displayNameChangeSubscription = this.formNameDescription.controls.displayName.valueChanges.subscribe((value) => {
    //         const nameControl = this.formNameDescription.controls.name;
    //         if (nameControl.dirty) {
    //             return;
    //         }
    //         const src = /[^a-zA-Z0-9_]/g;
    //         const target = '_';
    //         const name = value.replace(src, target);
    //         nameControl.setValue(name);
    //     });
    // }
    // ngOnDestroy(): void {
    //     this.displayNameChangeSubscription?.unsubscribe();
    // }
    // changeTimeType(): void {
    //     const form = this.formMetaData.controls;
    //     const timeType = form.timeType.value;
    //     form.timeStartColumn.clearValidators();
    //     form.timeStartFormat.clearValidators();
    //     form.timeStartFormatCustom.clearValidators();
    //     form.timeStartFormatUnix.clearValidators();
    //     form.timeDurationColumn.clearValidators();
    //     form.timeDurationValue.clearValidators();
    //     form.timeDurationValueType.clearValidators();
    //     form.timeDurationGranularity.clearValidators();
    //     form.timeEndColumn.clearValidators();
    //     form.timeEndFormat.clearValidators();
    //     form.timeEndFormatCustom.clearValidators();
    //     form.timeEndFormatUnix.clearValidators();
    //     if (timeType === 'Start') {
    //         form.timeStartColumn.setValidators(Validators.required);
    //         form.timeStartFormat.setValidators(Validators.required);
    //         form.timeDurationValueType.setValidators(Validators.required);
    //     } else if (timeType === 'Start/Duration') {
    //         form.timeStartColumn.setValidators(Validators.required);
    //         form.timeStartFormat.setValidators(Validators.required);
    //         form.timeDurationColumn.setValidators(Validators.required);
    //     } else if (timeType === 'Start/End') {
    //         form.timeStartColumn.setValidators(Validators.required);
    //         form.timeStartFormat.setValidators(Validators.required);
    //         form.timeEndColumn.setValidators(Validators.required);
    //         form.timeEndFormat.setValidators(Validators.required);
    //     }
    //     form.timeStartColumn.updateValueAndValidity();
    //     form.timeStartFormat.updateValueAndValidity();
    //     form.timeStartFormatCustom.updateValueAndValidity();
    //     form.timeStartFormatUnix.updateValueAndValidity();
    //     form.timeDurationColumn.updateValueAndValidity();
    //     form.timeDurationValueType.updateValueAndValidity();
    //     form.timeDurationGranularity.updateValueAndValidity();
    //     form.timeDurationValue.updateValueAndValidity();
    //     form.timeEndColumn.updateValueAndValidity();
    //     form.timeEndFormat.updateValueAndValidity();
    //     form.timeEndFormatCustom.updateValueAndValidity();
    //     form.timeEndFormatUnix.updateValueAndValidity();
    // }
    // changeTimeStartFormat(): void {
    //     const form = this.formMetaData.controls;
    //     if (form.timeStartFormat.value === 'custom') {
    //         form.timeStartFormatCustom.setValidators(Validators.required);
    //     } else {
    //         form.timeStartFormatCustom.clearValidators();
    //     }
    //     form.timeStartFormatCustom.updateValueAndValidity();
    //     if (form.timeStartFormat.value === 'unixTimeStamp') {
    //         form.timeStartFormatUnix.setValidators(Validators.required);
    //     } else {
    //         form.timeStartFormatUnix.clearValidators();
    //     }
    //     form.timeStartFormatUnix.updateValueAndValidity();
    // }
    // changeTimeEndFormat(): void {
    //     const form = this.formMetaData.controls;
    //     if (form.timeEndFormat.value === 'custom') {
    //         form.timeEndFormatCustom.setValidators(Validators.required);
    //     } else {
    //         form.timeEndFormatCustom.clearValidators();
    //     }
    //     form.timeEndFormatCustom.updateValueAndValidity();
    //     if (form.timeEndFormat.value === 'unixTimeStamp') {
    //         form.timeEndFormatUnix.setValidators(Validators.required);
    //     } else {
    //         form.timeEndFormatUnix.clearValidators();
    //     }
    //     form.timeEndFormatUnix.updateValueAndValidity();
    // }
    // changeTimeDurationValueType(): void {
    //     const form = this.formMetaData.controls;
    //     if (form.timeDurationValueType.value === 'value') {
    //         form.timeDurationValue.setValidators(Validators.required);
    //         form.timeDurationGranularity.setValidators(Validators.required);
    //     } else {
    //         form.timeDurationValue.clearValidators();
    //         form.timeDurationGranularity.clearValidators();
    //     }
    //     form.timeDurationValue.updateValueAndValidity();
    //     form.timeDurationGranularity.updateValueAndValidity();
    // }
    // changeMainFile(): void {
    //     if (!this.uploadId) {
    //         return;
    //     }
    //     const form = this.formMetaData.controls;
    //     const mainFile = form.mainFile.value;
    //     const layer = form.layerName.value;
    //     this.uploadsService.getUploadFileLayers(this.uploadId, mainFile).then((layers) => {
    //         this.uploadFileLayers = layers.layers;
    //         if (this.uploadFileLayers.length > 0 && !this.uploadFileLayers.includes(layer)) {
    //             form.layerName.setValue(this.uploadFileLayers[0]);
    //         }
    //         this.changeDetectorRef.markForCheck();
    //     });
    // }
    // removeText(column: string): void {
    //     const columns: Array<string> = this.formMetaData.controls.columnsText.value;
    //     const index = columns.indexOf(column);
    //     if (index > -1) {
    //         columns.splice(index, 1);
    //     }
    // }
    // addText(event: MatChipInputEvent): void {
    //     const columns: Array<string> = this.formMetaData.controls.columnsText.value;
    //     const column = event.value;
    //     const input = event.input;
    //     if (columns.indexOf(column)) {
    //         columns.push(column);
    //     }
    //     if (input) {
    //         input.value = '';
    //     }
    // }
    // removeInt(column: string): void {
    //     const columns: Array<string> = this.formMetaData.controls.columnsInt.value;
    //     const index = columns.indexOf(column);
    //     if (index > -1) {
    //         columns.splice(index, 1);
    //     }
    // }
    // addInt(event: MatChipInputEvent): void {
    //     const columns: Array<string> = this.formMetaData.controls.columnsInt.value;
    //     const column = event.value;
    //     const input = event.input;
    //     if (columns.indexOf(column)) {
    //         columns.push(column);
    //     }
    //     if (input) {
    //         input.value = '';
    //     }
    // }
    // removeFloat(column: string): void {
    //     const columns: Array<string> = this.formMetaData.controls.columnsFloat.value;
    //     const index = columns.indexOf(column);
    //     if (index > -1) {
    //         columns.splice(index, 1);
    //     }
    // }
    // addFloat(event: MatChipInputEvent): void {
    //     const columns: Array<string> = this.formMetaData.controls.columnsFloat.value;
    //     const column = event.value;
    //     const input = event.input;
    //     if (columns.indexOf(column)) {
    //         columns.push(column);
    //     }
    //     if (input) {
    //         input.value = '';
    //     }
    // }
    // upload(): void {
    //     if (!this.selectedFiles) {
    //         return;
    //     }
    //     const form = new FormData();
    //     for (const file of this.selectedFiles) {
    //         form.append('files[]', file, file.name);
    //     }
    //     // this.uploadsService
    //     //     .upload(form)
    //     //     .then((event) => {
    //     //         if (event.type === HttpEventType.UploadProgress) {
    //     //             const fraction = event.total ? event.loaded / event.total : 1;
    //     //             this.progress$.next(Math.round(100 * fraction));
    //     //         } else if (event.type === HttpEventType.Response) {
    //     //             const uploadId = event.body?.id as UUID;
    //     //             this.uploadId = uploadId;
    //     //             if (this.stepper.selected) {
    //     //                 this.stepper.selected.completed = true;
    //     //                 this.stepper.selected.editable = false;
    //     //             }
    //     //             this.stepper.next();
    //     //             this.setUpMetadataSpecification(uploadId);
    //     //         }
    //     //     })
    //     //     .catch((err) => {
    //     //         this.notificationService.error('File upload failed: ' + err.message);
    //     //     });
    // }
    // addToMap(): void {
    //     if (!this.datasetName) {
    //         return;
    //     }
    //     this.datasetsService
    //         .getDataset(this.datasetName)
    //         .then((dataset) => this.datasetService.addDatasetToMap(dataset)
    //         .subscribe());
    // }
    // reloadSuggestion(): void {
    //     this.suggest(this.formMetaData.controls.mainFile.value, this.formMetaData.controls.layerName.value);
    // }
    // submitCreate(): void {
    //     if (!this.uploadId) {
    //         return;
    //     }
    //     const formMeta = this.formMetaData.controls;
    //     const formDataset = this.formNameDescription.controls;
    //     const metaData: MetaDataDefinition = {
    //         type: 'OgrMetaData',
    //         loadingInfo: {
    //             fileName: formMeta.mainFile.value,
    //             layerName: formMeta.layerName.value,
    //             dataType: formMeta.dataType.value,
    //             time: this.getTime(),
    //             columns: {
    //                 x: formMeta.columnsX.value,
    //                 y: formMeta.columnsY.value,
    //                 text: formMeta.columnsText.value,
    //                 _float: formMeta.columnsFloat.value,
    //                 _int: formMeta.columnsInt.value,
    //             },
    //             forceOgrTimeFilter: false,
    //             onError: formMeta.errorHandling.value,
    //         },
    //         resultDescriptor: {
    //             dataType: formMeta.dataType.value,
    //             spatialReference: formMeta.spatialReference.value,
    //             columns: this.getColumnsAsMap(),
    //         },
    //     };
    //     const addData: AddDataset = {
    //         name: this.userNamePrefix + ':' + formDataset.name.value,
    //         displayName: formDataset.displayName.value,
    //         description: formDataset.description.value,
    //         sourceOperator: 'OgrSource',
    //     };
    //     const definition: DatasetDefinition = {
    //         properties: addData,
    //         metaData,
    //     };
    //     const create: CreateDataset = {
    //         dataPath: {
    //             upload: this.uploadId,
    //         },
    //         definition,
    //     };
    //     this.datasetService.createDataset(create).subscribe(
    //         (response) => {
    //             this.datasetName = response.datasetName;
    //             if (this.stepper.selected) {
    //                 this.stepper.selected.completed = true;
    //                 this.stepper.selected.editable = false;
    //             }
    //             const prevStep = this.stepper.steps.get(this.stepper.selectedIndex - 1);
    //             if (prevStep) {
    //                 prevStep.completed = true;
    //                 prevStep.editable = false;
    //             }
    //             this.stepper.next();
    //             this.suggest();
    //         },
    //         (err) => {
    //             this.notificationService.error('Create dataset failed: ' + err.message);
    //         },
    //     );
    // }
    // private setUpMetadataSpecification(uploadId: string): void {
    //     let uploadFiles;
    //     if (this.uploadFiles) {
    //         uploadFiles = of(this.uploadFiles);
    //     } else {
    //         uploadFiles = this.datasetService.getUploadFiles(uploadId).pipe(map((files) => files.files));
    //     }
    //     zip(this.datasetService.suggestMetaData({upload: uploadId}), uploadFiles)
    //         .pipe(
    //             mergeMap(([suggest, files]) =>
    //                 zip(of(suggest), of(files), this.datasetService.getUploadFileLayers(uploadId, suggest.mainFile)),
    //             ),
    //         )
    //         .subscribe(([suggest, files, layers]) => {
    //             this.uploadFiles = files;
    //             this.uploadFileLayers = layers.layers;
    //             this.fillMetaDataForm(suggest);
    //             this.changeDetectorRef.markForCheck();
    //         });
    // }
    // private fillMetaDataForm(suggest: MetaDataSuggestion): void {
    //     const metaData = suggest.metaData as OgrMetaData;
    //     const info = metaData.loadingInfo;
    //     const start = this.getStartTime(info?.time);
    //     const end = this.getEndTime(info?.time);
    //     this.formMetaData.patchValue({
    //         mainFile: suggest.mainFile,
    //         layerName: info?.layerName,
    //         dataType: info?.dataType,
    //         timeType: info ? this.getTimeType(info.time) : 'None',
    //         timeStartColumn: start ? start.startField : '',
    //         timeStartFormat: start ? start.startFormat.format : '',
    //         timeStartFormatCustom: start ? start.startFormat.customFormat : '',
    //         timeStartFormatUnix: start ? start.startFormat.timestampType : '',
    //         timeDurationColumn: info?.time.type === 'startDuration' ? info?.time.durationField : '',
    //         timeDurationValue: info?.time.type === 'start' ? info?.time.duration : 1,
    //         timeDurationValueType: info?.time.type === 'start' ? info?.time.duration.type : 'infinite',
    //         timeEndColumn: end ? end.endField : '',
    //         timeEndFormat: end ? end.endFormat.format : '',
    //         timeEndFormatCustom: end ? end.endFormat.customFormat : '',
    //         timeEndFormatUnix: end ? end.endFormat.timestampType : '',
    //         columnsX: info?.columns?.x,
    //         columnsY: info?.columns?.y,
    //         columnsText: info?.columns?.text,
    //         columnsFloat: info?.columns?.float,
    //         columnsInt: info?.columns?.int,
    //         errorHandling: info?.onError,
    //         spatialReference: suggest.metaData.resultDescriptor.spatialReference,
    //     });
    // }
    // private suggest(mainFile: string | undefined = undefined, layerName: string | undefined = undefined): void {
    //     if (!this.uploadId) {
    //         return;
    //     }
    //     this.datasetsService
    //         .suggestMetaData({upload: this.uploadId, mainFile, layerName})
    //         .then((suggest) => {
    //             this.fillMetaDataForm(suggest);
    //             this.changeDetectorRef.markForCheck();
    //         })
    //         .catch((err) => this.notificationService.error(err.message));
    // }
    // private getStartTime(
    //     time: OgrSourceDatasetTimeType | undefined,
    // ): undefined | {startField: string; startFormat: OgrSourceTimeFormat; custom?: string} {
    //     if (!time || time.type === 'none') {
    //         return undefined;
    //     }
    //     return time;
    // }
    // private getEndTime(
    //     time: OgrSourceDatasetTimeType | undefined,
    // ): undefined | {endField: string; endFormat: OgrSourceTimeFormat custom?: string} {
    //     if (!time || time.type === 'none') {
    //         return undefined;
    //     }
    //     if (time.type === 'startEnd') {
    //         return time;
    //     }
    //     return undefined;
    // }
    // private getColumnsAsMap(): {[key: string]: VectorColumnInfo} {
    //     const formMeta = this.formMetaData.controls;
    //     const columns: {[key: string]: VectorColumnInfo} = {};
    //     for (const column of formMeta.columnsText.value as Array<string>) {
    //         columns[column] = {
    //             dataType: 'text',
    //             measurement: {
    //                 // TODO: incorporate in selection
    //                 type: 'unitless',
    //             },
    //         };
    //     }
    //     for (const column of formMeta.columnsInt.value as Array<string>) {
    //         columns[column] = {
    //             dataType: 'int',
    //             measurement: {
    //                 // TODO: incorporate in selection
    //                 type: 'unitless',
    //             },
    //         };
    //     }
    //     for (const column of formMeta.columnsFloat.value as Array<string>) {
    //         columns[column] = {
    //             dataType: 'float',
    //             measurement: {
    //                 // TODO: incorporate in selection
    //                 type: 'unitless',
    //             },
    //         };
    //     }
    //     return columns;
    // }
    // private getDuration(): OgrSourceDurationSpecDict {
    //     const formMeta = this.formMetaData.controls;
    //     if (formMeta.timeDurationValueType.value === 'zero') {
    //         return {
    //             type: 'zero',
    //         };
    //     } else if (formMeta.timeDurationValueType.value === 'infinite') {
    //         return {
    //             type: 'infinite',
    //         };
    //     } else if (formMeta.timeDurationValueType.value === 'value') {
    //         return {
    //             type: 'value',
    //             granularity: formMeta.timeDurationGranularity.value,
    //             step: formMeta.timeDurationValue.value,
    //         };
    //     }
    //     throw Error('Invalid time duration type');
    // }
    // private getTime(): OgrSourceDatasetTimeType {
    //     const formMeta = this.formMetaData.controls;
    //     let time: OgrSourceDatasetTimeType = {
    //         type: 'none',
    //     };
    //     // if (formMeta.timeType.value === 'Start') {
    //     //     const format: OgrSourceTimeFormat = {
    //     //         format: formMeta.timeStartFormat.value,
    //     //     };
    //     //     if (format.format === 'custom') {
    //     //         format.customFormat = formMeta.timeStartFormatCustom.value;
    //     //     } else if (format.format === 'unixTimeStamp') {
    //     //         format.timestampType = formMeta.timeStartFormatUnix.value;
    //     //     }
    //     //     time = {
    //     //         type: 'start',
    //     //         startField: formMeta.timeStartColumn.value,
    //     //         startFormat: format,
    //     //         duration: this.getDuration(),
    //     //     };
    //     // } else if (formMeta.timeType.value === 'Start/End') {
    //     //     const startFormat: OgrSourceTimeFormat = {
    //     //         format: formMeta.timeStartFormat.value,
    //     //     };
    //     //     if (startFormat.format === 'custom') {
    //     //         startFormat.customFormat = formMeta.timeStartFormatCustom.value;
    //     //     } else if (startFormat.format === 'unixTimeStamp') {
    //     //         startFormat.timestampType = formMeta.timeStartFormatUnix.value;
    //     //     }
    //     //     const endFormat: OgrSourceTimeFormat = {
    //     //         format: formMeta.timeStartFormat.value,
    //     //     };
    //     //     if (endFormat.format === 'custom') {
    //     //         endFormat.customFormat = formMeta.timeEndFormatCustom.value;
    //     //     } else if (endFormat.format === 'unixTimeStamp') {
    //     //         endFormat.timestampType = formMeta.timeEndFormatUnix.value;
    //     //     }
    //     //     time = {
    //     //         type: 'startEnd',
    //     //         startField: formMeta.timeStartColumn.value,
    //     //         startFormat,
    //     //         endField: formMeta.timeEndColumn.value,
    //     //         endFormat,
    //     //     };
    //     // } else if (formMeta.timeType.value === 'Start/Duration') {
    //     //     const format: OgrSourceTimeFormat = {
    //     //         format: formMeta.timeStartFormat.value,
    //     //     };
    //     //     if (format.format === 'custom') {
    //     //         format.customFormat = formMeta.timeStartFormatCustom.value;
    //     //     } else if (format.format === 'unixTimeStamp') {
    //     //         format.timestampType = formMeta.timeStartFormatUnix.value;
    //     //     }
    //     //     time = {
    //     //         type: 'startDuration',
    //     //         startField: formMeta.timeStartColumn.value,
    //     //         startFormat: format,
    //     //         durationField: formMeta.timeDurationColumn.value,
    //     //     };
    //     // }
    //     return time;
    // }
    // private getTimeType(time?: OgrSourceDatasetTimeType): string {
    //     if (!time || time.type === 'none') {
    //         return 'None';
    //     }
    //     if (time.type === 'start') {
    //         return 'Start';
    //     } else if (time.type === 'startDuration') {
    //         return 'Start/Duration';
    //     } else if (time.type === 'startEnd') {
    //         return 'Start/End';
    //     }
    //     return 'None';
    // }
}
