import {HttpEventType} from '@angular/common/http';
import {Component, ChangeDetectionStrategy, ViewChild, ChangeDetectorRef, OnDestroy} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatStepper} from '@angular/material/stepper';
import {Subject, Subscription} from 'rxjs';
import {mergeMap} from 'rxjs/operators';
import {UUID} from '../../backend/backend.model';
import {NotificationService} from '../../notification.service';
import {ProjectService} from '../../project/project.service';
import {UserService} from '../../users/user.service';
import {DatasetsService, OgrDatasetComponent, UploadsService, timeStepGranularityOptions} from '@geoengine/common';
import {DatasetService} from '../dataset.service';
import {AddDataset, DatasetDefinition, MetaDataDefinition, MetaDataSuggestion, TimeGranularity} from '@geoengine/openapi-client';

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
export class UploadComponent implements OnDestroy {
    vectorDataTypes = ['Data', 'MultiPoint', 'MultiLineString', 'MultiPolygon'];
    timeDurationValueTypes = ['infinite', 'value', 'zero'];
    timeTypes = ['None', 'Start', 'Start/End', 'Start/Duration'];
    timeFormats = ['auto', 'unixTimeStamp', 'custom'];
    timestampTypes = ['epochSeconds', 'epochMilliseconds'];
    errorHandlings = ['ignore', 'abort'];
    readonly timeGranularityOptions: Array<TimeGranularity> = timeStepGranularityOptions;

    @ViewChild(MatStepper) stepper!: MatStepper;
    @ViewChild(OgrDatasetComponent) ogrDatasetComponent!: OgrDatasetComponent;

    progress$ = new Subject<number>();
    metaDataSuggestion$ = new Subject<MetaDataSuggestion>();

    uploadId?: UUID;
    datasetName?: UUID;
    selectedFiles?: Array<File>;
    selectedTimeType?: string;

    uploadFiles?: Array<string>;

    formNameDescription: FormGroup<NameDescription>;

    userNamePrefix = '_';

    uploadFileLayers: Array<string> = [];

    private displayNameChangeSubscription: Subscription;

    constructor(
        protected datasetsService: DatasetsService,
        protected uploadsService: UploadsService,
        protected notificationService: NotificationService,
        protected projectService: ProjectService,
        protected userService: UserService,
        protected changeDetectorRef: ChangeDetectorRef,
        protected datasetService: DatasetService,
    ) {
        this.formNameDescription = new FormGroup<NameDescription>({
            name: new FormControl('', {
                nonNullable: true,
                validators: [Validators.required, Validators.pattern(/^[a-zA-Z0-9_]+$/), Validators.minLength(1)],
            }),
            displayName: new FormControl('', {
                nonNullable: true,
                validators: [Validators.required],
            }),
            description: new FormControl('', {
                nonNullable: true,
            }),
        });

        this.userService.getSessionOnce().subscribe((session) => {
            if (session.user) {
                this.userNamePrefix = session.user.id;
            }
        });

        /**
         * Suggest a name based on the display name
         */
        this.displayNameChangeSubscription = this.formNameDescription.controls.displayName.valueChanges.subscribe((value) => {
            const nameControl = this.formNameDescription.controls.name;

            if (nameControl.dirty) {
                return;
            }

            const src = /[^a-zA-Z0-9_]/g;
            const target = '_';

            const name = value.replace(src, target);

            nameControl.setValue(name);
        });
    }

    ngOnDestroy(): void {
        this.displayNameChangeSubscription?.unsubscribe();
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
                }
            },
            (err) => {
                this.notificationService.error('File upload failed: ' + err.message);
            },
        );
    }

    addToMap(): void {
        if (!this.datasetName) {
            return;
        }

        this.datasetService
            .getDataset(this.datasetName)
            .pipe(mergeMap((dataset) => this.datasetService.addDatasetToMap(dataset)))
            .subscribe();
    }

    async submitCreate(): Promise<void> {
        if (!this.uploadId) {
            return;
        }

        const formDataset = this.formNameDescription.controls;

        const metaData: MetaDataDefinition = this.ogrDatasetComponent.getMetaData();

        const addData: AddDataset = {
            name: this.userNamePrefix + ':' + formDataset.name.value,
            displayName: formDataset.displayName.value,
            description: formDataset.description.value,
            sourceOperator: 'OgrSource',
        };

        const definition: DatasetDefinition = {
            properties: addData,
            metaData,
        };

        try {
            const datasetName = await this.datasetsService.createDataset(
                {
                    upload: this.uploadId,
                },
                definition,
            );

            this.datasetName = datasetName;
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
        } catch (err) {
            this.notificationService.error('Create dataset failed: ' + err);
            return;
        }
    }

    get formMetaData(): FormGroup {
        if (!this.ogrDatasetComponent) {
            return new FormGroup({});
        }
        return this.ogrDatasetComponent.formMetaData;
    }
}
