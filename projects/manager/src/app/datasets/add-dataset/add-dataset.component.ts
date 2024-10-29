import {Component, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ConfirmationComponent, DatasetsService, errorToText, OgrDatasetComponent} from '@geoengine/common';
import {DataPath, MetaDataDefinition, Volume as VolumeDict} from '@geoengine/openapi-client';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {BehaviorSubject, filter, firstValueFrom, merge} from 'rxjs';
import {GdalMetadataListComponent} from '../loading-info/gdal-metadata-list/gdal-metadata-list.component';

enum DataPaths {
    Upload,
    Volume,
}

enum DataTypes {
    Raster,
    Vector,
}

export interface AddDatasetForm {
    name: FormControl<string>;
    displayName: FormControl<string>;
    dataPathType: FormControl<DataPaths>;
    uploadId: FormControl<string>;
    volumeName: FormControl<string>;
    dataType: FormControl<DataTypes>;
    rawLoadingInfo: FormControl<string>;
}

@Component({
    selector: 'geoengine-manager-add-dataset',
    templateUrl: './add-dataset.component.html',
    styleUrl: './add-dataset.component.scss',
})
export class AddDatasetComponent {
    DataPaths = DataPaths;
    DataTypes = DataTypes;

    @ViewChild(GdalMetadataListComponent) gdalMetaDataList?: GdalMetadataListComponent;
    @ViewChild(OgrDatasetComponent) ogrDatasetComponent?: OgrDatasetComponent;

    volumes$ = new BehaviorSubject<VolumeDict[]>([]);

    form: FormGroup<AddDatasetForm> = new FormGroup<AddDatasetForm>({
        name: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.pattern(/^[a-zA-Z0-9_]+$/), Validators.minLength(3)],
        }),
        displayName: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required],
        }),
        dataPathType: new FormControl(DataPaths.Volume, {
            nonNullable: true,
            validators: [Validators.required],
        }),
        uploadId: new FormControl('', {
            nonNullable: true,
            validators: [],
        }),
        volumeName: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required],
        }),
        dataType: new FormControl(DataTypes.Raster, {
            nonNullable: true,
            validators: [Validators.required],
        }),
        rawLoadingInfo: new FormControl('', {
            nonNullable: true,
        }),
    });

    constructor(
        private readonly datasetsService: DatasetsService,
        private readonly snackBar: MatSnackBar,
        private readonly dialogRef: MatDialogRef<AddDatasetComponent>,
        private readonly dialog: MatDialog,
    ) {
        merge(this.dialogRef.backdropClick(), this.dialogRef.keydownEvents().pipe(filter((event) => event.key === 'Escape'))).subscribe(
            async (event) => {
                event.stopPropagation();

                if (this.form.pristine) {
                    this.dialogRef.close();
                    return;
                }

                const confirmDialogRef = this.dialog.open(ConfirmationComponent, {
                    data: {message: 'Do you really want to stop creating the dataset? All changes will be lost.'},
                });

                const confirm = await firstValueFrom(confirmDialogRef.afterClosed());

                if (confirm) {
                    this.dialogRef.close();
                }
            },
        );

        this.datasetsService.getVolumes().then((volumes) => {
            this.volumes$.next(volumes);
        });
    }

    dataPath(): DataPath {
        switch (this.form.controls.dataPathType.value) {
            case DataPaths.Upload:
                return {upload: this.form.controls.uploadId.value};
            case DataPaths.Volume:
                return {volume: this.form.controls.volumeName.value};
        }
    }

    updateDataPathType(): void {
        switch (this.form.controls.dataPathType.value) {
            case DataPaths.Upload:
                this.form.controls.uploadId.setValidators([Validators.required]);
                this.form.controls.uploadId.updateValueAndValidity();
                this.form.controls.volumeName.clearValidators();
                this.form.controls.volumeName.updateValueAndValidity();
                break;
            case DataPaths.Volume:
                this.form.controls.volumeName.setValidators([Validators.required]);
                this.form.controls.volumeName.updateValueAndValidity();
                this.form.controls.uploadId.clearValidators();
                this.form.controls.uploadId.updateValueAndValidity();
                break;
        }
    }

    updateDataType(): void {
        if (this.form.controls.dataType.value === DataTypes.Raster) {
            this.form.controls.rawLoadingInfo.clearValidators();
        } else {
            this.form.controls.rawLoadingInfo.setValidators([Validators.required]);
        }
    }

    isCreateDisabled(): boolean {
        const general = this.form.pristine || this.form.invalid;

        const raster = this.form.controls.dataType.value === DataTypes.Raster && (this.gdalMetaDataList?.form?.invalid ?? false);

        const vector = this.form.controls.dataType.value === DataTypes.Vector && (this.ogrDatasetComponent?.formMetaData?.invalid ?? false);

        return general || raster || vector;
    }

    async createDataset(): Promise<void> {
        if (!this.form.valid) {
            return;
        }

        let sourceOperator = undefined;
        let metaData: MetaDataDefinition | undefined = undefined;

        if (this.form.controls.dataType.value === DataTypes.Raster) {
            if (!this.gdalMetaDataList) {
                return;
            }

            metaData = this.gdalMetaDataList.getMetaData();

            sourceOperator = 'GdalSource';
        } else if (this.form.controls.dataType.value === DataTypes.Vector) {
            if (!this.ogrDatasetComponent) {
                return;
            }

            metaData = this.ogrDatasetComponent.getMetaData();

            sourceOperator = 'OgrSource';
        } else {
            return;
        }

        if (!metaData) {
            this.snackBar.open('Invalid loading information.', 'Close', {panelClass: ['error-snackbar']});
            return;
        }

        const definition = {
            metaData,
            properties: {
                name: this.form.controls.name.value,
                displayName: this.form.controls.displayName.value,
                description: '',
                sourceOperator,
            },
        };

        try {
            const datasetName = await this.datasetsService.createDataset(this.dataPath(), definition);
            this.dialogRef.close(datasetName);
        } catch (error) {
            const errorMessage = await errorToText(error, 'Creating dataset failed.');
            this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
        }
    }
}
