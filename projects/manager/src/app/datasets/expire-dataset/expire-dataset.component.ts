import {AfterViewInit, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import moment, {Moment} from 'moment/moment';
import {FormControl, FormGroup, UntypedFormBuilder, Validators} from '@angular/forms';
import {DatasetsService, ConfirmationComponent, errorToText} from '@geoengine/common';
import {DatasetAccessStatusResponse, DatasetDeletionType, ExpirationWithType, Permission} from '@geoengine/openapi-client';
import {firstValueFrom} from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar';
import {AppConfig} from '../../app-config.service';

export interface ExpirationForm {
    deleteRecord: FormControl<boolean>;
    setExpire: FormControl<boolean>;
    expirationTime: FormControl<Moment>;
}

export enum DeletionStatus {
    Available,
    Expires,
    Deleted,
}

@Component({
    selector: 'geoengine-expire-dataset',
    templateUrl: './expire-dataset.component.html',
    styleUrl: './expire-dataset.component.scss',
})
export class ExpireDatasetComponent implements AfterViewInit, OnChanges {
    @Input() datasetName?: string;
    @Output() datasetDeleted = new EventEmitter<void>();

    datasetStatus: DatasetAccessStatusResponse | undefined;
    deletionForm!: FormGroup<ExpirationForm>;

    constructor(
        private formBuilder: UntypedFormBuilder,
        private readonly datasetsService: DatasetsService,
        private readonly snackBar: MatSnackBar,
        private readonly dialog: MatDialog,
        private readonly config: AppConfig,
    ) {}

    ngAfterViewInit(): void {
        this.setupStatus();
    }

    async ngOnChanges(changes: SimpleChanges): Promise<void> {
        if (changes.datasetName) {
            this.datasetName = changes.datasetName.currentValue;
            this.setupStatus();
        }
    }

    async setupStatus(): Promise<void> {
        if (!this.datasetName) {
            return;
        }

        this.datasetStatus = await this.datasetsService.getDatasetStatus(this.datasetName);
        const expiration = this.datasetStatus.expiration;
        let deleteRecord = false;
        if (expiration) {
            deleteRecord = expiration.deletionType == DatasetDeletionType.DeleteRecordAndData;
        }
        let time = moment.utc();
        if (expiration && expiration.deletionTimestamp) {
            time = moment(expiration.deletionTimestamp);
        }
        this.deletionForm = this.formBuilder.group({
            deleteRecord: [deleteRecord, Validators.required],
            setExpire: [{value: expiration != null, disabled: !this.datasetStatus.isAvailable}, Validators.required],
            expirationTime: [time, [Validators.required]],
        });
    }

    canDelete(): boolean {
        return this.datasetStatus != null && this.datasetStatus.permissions.includes(Permission.Owner);
    }

    isUserUpload(): boolean {
        return this.datasetStatus != null && this.datasetStatus.isUserUpload;
    }

    expires(): boolean {
        return this.datasetStatus != null && this.datasetStatus.isAvailable && this.datasetStatus.expiration != null;
    }

    getStatusString(): string {
        if (this.datasetStatus) {
            if (this.datasetStatus.isAvailable && this.datasetStatus.expiration) {
                return DeletionStatus[DeletionStatus.Expires];
            } else if (this.datasetStatus.expiration) {
                return DeletionStatus[DeletionStatus.Deleted];
            } else {
                return DeletionStatus[DeletionStatus.Available];
            }
        }
        return 'Unknown';
    }

    async deleteDatasetBasic(): Promise<void> {
        if (!this.datasetName) {
            return;
        }

        await this.datasetsService.deleteDataset(this.datasetName);
        this.snackBar.open('Dataset successfully deleted.', 'Close', {duration: this.config.DEFAULTS.SNACKBAR_DURATION});
        this.datasetDeleted.emit();
    }

    async resetDeletion(): Promise<void> {
        if (this.datasetName && this.datasetStatus && this.datasetStatus.isAvailable) {
            try {
                await this.datasetsService.expireDataset(this.datasetName, {type: 'unsetExpire'});
                this.setupStatus();
            } catch (error) {
                const errorMessage = await errorToText(error, 'Reset deletion failed.');
                this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
            }
        }
    }

    async deleteDatasetAdvanced(): Promise<void> {
        if (!this.datasetName) {
            return;
        }

        const dialogRef = this.dialog.open(ConfirmationComponent, {
            data: {message: 'Confirm the deletion of the dataset. This cannot be undone.'},
        });

        const confirm = await firstValueFrom(dialogRef.afterClosed());

        if (!confirm) {
            return;
        }

        try {
            let directDelete = true;
            const formResult = this.getFormResult();
            directDelete = formResult.deletionTimestamp == undefined && formResult.deletionType == DatasetDeletionType.DeleteRecordAndData;
            await this.datasetsService.expireDataset(this.datasetName, formResult);
            if (directDelete) {
                this.snackBar.open('Dataset successfully deleted.', 'Close', {duration: this.config.DEFAULTS.SNACKBAR_DURATION});
                this.datasetDeleted.emit();
            } else {
                this.setupStatus();
                this.snackBar.open('Set dataset expiration date.', 'Close', {duration: this.config.DEFAULTS.SNACKBAR_DURATION});
            }
        } catch (error) {
            const errorMessage = await errorToText(error, 'Deleting dataset failed.');
            this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
        }
    }

    private getFormResult(): ExpirationWithType {
        const values = this.deletionForm.controls;
        const deletionType = values.deleteRecord.value ? DatasetDeletionType.DeleteRecordAndData : DatasetDeletionType.DeleteData;

        if (!this.deletionForm.controls.setExpire.disabled && values.setExpire.value) {
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
