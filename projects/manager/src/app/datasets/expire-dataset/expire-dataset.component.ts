import {Component, EventEmitter, Input, Output} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import moment, {Moment} from 'moment/moment';
import {FormControl, FormGroup, UntypedFormBuilder, Validators} from '@angular/forms';
import {DatasetsService, ConfirmationComponent, errorToText} from '@geoengine/common';
import {DatasetDeletionType, ExpirationWithType} from '@geoengine/openapi-client';
import {firstValueFrom} from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar';
import {AppConfig} from '../../app-config.service';

export interface ExpirationForm {
    deleteRecord: FormControl<boolean>;
    setExpire: FormControl<boolean>;
    expirationTime: FormControl<Moment>;
}

@Component({
    selector: 'geoengine-expire-dataset',
    templateUrl: './expire-dataset.component.html',
    styleUrl: './expire-dataset.component.scss',
})
export class ExpireDatasetComponent {
    @Input() datasetName!: string;
    @Output() datasetDeleted = new EventEmitter<void>();

    advancedDeletion: boolean;
    deletionForm: FormGroup<ExpirationForm>;

    constructor(
        private formBuilder: UntypedFormBuilder,
        private readonly datasetsService: DatasetsService,
        private readonly snackBar: MatSnackBar,
        private readonly dialog: MatDialog,
        private readonly config: AppConfig,
    ) {
        this.advancedDeletion = false;
        this.deletionForm = this.formBuilder.group({
            deleteRecord: [false, Validators.required],
            setExpire: [false, Validators.required],
            expirationTime: [moment.utc(), [Validators.required]],
        });
    }

    async deleteDatasetFair(): Promise<void> {
        const dialogRef = this.dialog.open(ConfirmationComponent, {
            data: {message: 'Confirm the deletion of the dataset. This cannot be undone.'},
        });

        const confirm = await firstValueFrom(dialogRef.afterClosed());

        if (!confirm) {
            return;
        }

        try {
            let directDelete = true;
            if (this.advancedDeletion) {
                const formResult = this.getFormResult();
                directDelete = formResult.deletionTimestamp == undefined;
                await this.datasetsService.expireDataset(this.datasetName, formResult);
            } else {
                await this.datasetsService.deleteDataset(this.datasetName);
            }
            this.snackBar.open('Dataset successfully deleted.', 'Close', {duration: this.config.DEFAULTS.SNACKBAR_DURATION});
            if (directDelete) this.datasetDeleted.emit();
        } catch (error) {
            const errorMessage = await errorToText(error, 'Deleting dataset failed.');
            this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
        }
    }

    private getFormResult(): ExpirationWithType {
        const values = this.deletionForm.controls;
        const deletionType = values.deleteRecord.value ? DatasetDeletionType.DeleteRecordAndData : DatasetDeletionType.DeleteData;

        if (values.setExpire.value) {
            return {
                deletionType: deletionType,
                deletionTimestamp: values.expirationTime.value.toDate(),
                type: 'setExpire',
            };
        } else {
            return {
                deletionType: deletionType,
                type: 'setExpire',
            };
        }
    }
}
