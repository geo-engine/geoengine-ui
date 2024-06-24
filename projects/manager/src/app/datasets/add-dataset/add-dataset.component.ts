import {Component, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ConfirmationComponent, DatasetsService, errorToText} from '@geoengine/common';
import {DataPath, MetaDataDefinition} from '@geoengine/openapi-client';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {filter, firstValueFrom, merge} from 'rxjs';
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
    dataPath: FormControl<string>;
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
        dataPath: new FormControl('', {
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
    }

    dataPath(): DataPath {
        if (this.form.controls.dataPathType.value === DataPaths.Upload) {
            return {upload: this.form.controls.dataPath.value};
        } else {
            return {volume: this.form.controls.dataPath.value};
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
        return this.form.pristine || this.form.invalid || (this.gdalMetaDataList?.form?.invalid ?? false);
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
        } else {
            try {
                metaData = JSON.parse(this.form.controls.rawLoadingInfo.value) as MetaDataDefinition;
            } catch (e) {
                this.snackBar.open('Invalid loading information.', 'Close', {panelClass: ['error-snackbar']});
                return;
            }

            sourceOperator = 'OgrSource';
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
            const datasetName = await this.datasetsService.createDataset(this.getDataPath(), definition);
            this.dialogRef.close(datasetName);
        } catch (error) {
            const errorMessage = await errorToText(error, 'Creating dataset failed.');
            this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
        }
    }

    private getDataPath(): DataPath {
        if (this.form.value.dataPathType === DataPaths.Upload) {
            return {
                upload: this.form.value.dataPath ?? '',
            };
        } else {
            return {
                volume: this.form.value.dataPath ?? '',
            };
        }
    }
}
