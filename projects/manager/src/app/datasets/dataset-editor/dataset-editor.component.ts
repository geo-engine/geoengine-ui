import {ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators} from '@angular/forms';
import {MatChipInput} from '@angular/material/chips';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {
    ConfirmationComponent,
    DatasetsService,
    OgrDatasetComponent,
    RasterSymbology,
    Symbology,
    UUID,
    VectorSymbology,
    WHITE,
    WorkflowsService,
    createVectorSymbology as createDefaultVectorSymbology,
    errorToText,
    geoengineValidators,
} from '@geoengine/common';
import {
    Dataset,
    DatasetListing,
    GdalMetaDataList,
    MetaDataDefinition,
    OgrMetaData,
    TypedRasterResultDescriptor,
    TypedResultDescriptor,
    TypedVectorResultDescriptor,
} from '@geoengine/openapi-client';
import {BehaviorSubject, firstValueFrom} from 'rxjs';
import {ProvenanceComponent} from '../../provenance/provenance.component';
import {AppConfig} from '../../app-config.service';
import {GdalMetadataListComponent} from '../loading-info/gdal-metadata-list/gdal-metadata-list.component';

export interface DatasetForm {
    layerType: FormControl<'plot' | 'raster' | 'vector'>;
    dataType: FormControl<string>;
    name: FormControl<string>;
    displayName: FormControl<string>;
    description: FormControl<string>;
    tags: FormControl<string[]>;
    newTag: FormControl<string>;
}

@Component({
    selector: 'geoengine-manager-dataset-editor',
    templateUrl: './dataset-editor.component.html',
    styleUrl: './dataset-editor.component.scss',
    standalone: false,
})
export class DatasetEditorComponent implements OnChanges {
    @Input({required: true}) datasetListing!: DatasetListing;

    @Output() datasetDeleted = new EventEmitter<void>();

    @ViewChild(MatChipInput) tagInput!: MatChipInput;
    @ViewChild(ProvenanceComponent) provenanceComponent!: ProvenanceComponent;
    @ViewChild(GdalMetadataListComponent) gdalMetadataListComponent?: GdalMetadataListComponent;
    @ViewChild(OgrDatasetComponent) ogrDatasetComponent?: OgrDatasetComponent;

    dataset?: Dataset;
    form: FormGroup<DatasetForm> = this.placeholderForm();

    datasetWorkflowId$ = new BehaviorSubject<UUID | undefined>(undefined);

    rasterSymbology?: RasterSymbology = undefined;
    vectorSymbology?: VectorSymbology = undefined;

    rawLoadingInfo = '';
    rawLoadingInfoPristine = true;
    gdalMetaDataList?: GdalMetaDataList;
    ogrMetaData?: OgrMetaData;

    constructor(
        private readonly datasetsService: DatasetsService,
        private readonly workflowsService: WorkflowsService,
        private readonly snackBar: MatSnackBar,
        private readonly dialog: MatDialog,
        private readonly config: AppConfig,
        private readonly changeDetectorRef: ChangeDetectorRef,
    ) {}

    async ngOnChanges(changes: SimpleChanges): Promise<void> {
        if (changes.datasetListing) {
            this.dataset = await this.datasetsService.getDataset(this.datasetListing.name);
            this.setUpForm(this.dataset);
            const workflowId = await this.getWorkflowId(this.dataset);
            this.datasetWorkflowId$.next(workflowId);
            this.setUpColorizer(this.dataset);

            const loadingInfo = await this.datasetsService.getLoadingInfo(this.dataset.name);
            if (loadingInfo.type === 'GdalMetaDataList') {
                this.gdalMetaDataList = loadingInfo;
                this.ogrMetaData = undefined;
                this.rawLoadingInfo = '';
            } else if (loadingInfo.type === 'OgrMetaData') {
                this.ogrMetaData = loadingInfo;
                this.gdalMetaDataList = undefined;
                this.rawLoadingInfo = '';
            } else {
                this.gdalMetaDataList = undefined;
                this.ogrMetaData = undefined;
                this.rawLoadingInfo = JSON.stringify(loadingInfo, null, 2);
                this.rawLoadingInfoPristine = true;
            }
            this.changeDetectorRef.detectChanges();
        }
    }

    async applyChanges(): Promise<void> {
        if (!this.form.valid) {
            return;
        }

        const name = this.form.controls.name.value;
        const displayName = this.form.controls.displayName.value;
        const description = this.form.controls.description.value;
        const tags = this.form.controls.tags.value;

        try {
            await this.datasetsService.updateDataset(this.datasetListing.name, {name, displayName, description, tags});
            this.datasetListing.name = name;
            this.datasetListing.displayName = displayName;
            this.datasetListing.description = description;
            this.snackBar.open('Dataset successfully updated.', 'Close', {duration: this.config.DEFAULTS.SNACKBAR_DURATION});
            this.form.markAsPristine();
        } catch (error) {
            const errorMessage = await errorToText(error, 'Updating dataset failed.');
            this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
        }
    }

    removeTag(tag: string): void {
        const tags: Array<string> = this.form.controls.tags.value;

        const index = tags.indexOf(tag);
        if (index > -1) {
            tags.splice(index, 1);
        }

        this.form.markAsDirty();
    }

    addTag(): void {
        const tags: Array<string> = this.form.controls.tags.value;

        const tag = this.tagInput.inputElement.value;

        if (!isValidTag(tag)) {
            return;
        }

        this.tagInput.inputElement.value = '';

        tags.push(tag);

        this.form.markAsDirty();
    }

    async saveProvenance(): Promise<void> {
        if (!this.provenanceComponent.form.valid) {
            return;
        }

        const provenance = this.provenanceComponent.getProvenance();

        try {
            await this.datasetsService.updateProvenance(this.datasetListing.name, provenance);
            this.snackBar.open('Dataset provenance successfully updated.', 'Close', {duration: this.config.DEFAULTS.SNACKBAR_DURATION});
            this.provenanceComponent.form.markAsPristine();
        } catch (error) {
            const errorMessage = await errorToText(error, 'Updating dataset provenance failed.');
            this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
        }
    }

    get tagInputControl(): FormControl {
        return this.form.get('newTag') as FormControl;
    }

    get tagsControl(): FormControl {
        return this.form.get('tags') as FormControl;
    }

    createSymbology(dataset: Dataset): void {
        if (dataset.resultDescriptor.type === 'vector') {
            this.createVectorSymbology(dataset);
        }
        if (dataset.resultDescriptor.type === 'raster') {
            this.createRasterSymbology();
        }
    }

    async deleteDataset(): Promise<void> {
        const dialogRef = this.dialog.open(ConfirmationComponent, {
            data: {message: 'Confirm the deletion of the dataset. This cannot be undone.'},
        });

        const confirm = await firstValueFrom(dialogRef.afterClosed());

        if (!confirm) {
            return;
        }

        try {
            await this.datasetsService.deleteDataset(this.datasetListing.name);
            this.snackBar.open('Dataset successfully deleted.', 'Close', {duration: this.config.DEFAULTS.SNACKBAR_DURATION});
            this.datasetDeleted.emit();
        } catch (error) {
            const errorMessage = await errorToText(error, 'Deleting dataset failed.');
            this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
        }
    }

    getMetaDataDefinition(): MetaDataDefinition | undefined {
        if (this.gdalMetadataListComponent) {
            return this.gdalMetadataListComponent.getMetaData();
        } else if (this.ogrDatasetComponent) {
            return this.ogrDatasetComponent.getMetaData();
        } else {
            try {
                return JSON.parse(this.rawLoadingInfo) as MetaDataDefinition;
            } catch (_e) {
                this.snackBar.open('Invalid loading information.', 'Close', {panelClass: ['error-snackbar']});
                return undefined;
            }
        }
    }

    isSaveLoadingInfoDisabled(): boolean {
        if (this.gdalMetadataListComponent) {
            return this.gdalMetadataListComponent.isSaveLoadingInfoDisabled();
        } else if (this.ogrDatasetComponent) {
            return this.ogrDatasetComponent.isSaveLoadingInfoDisabled();
        } else {
            return this.rawLoadingInfo === '' || this.rawLoadingInfoPristine;
        }
    }

    async saveLoadingInfo(): Promise<void> {
        const metaData = this.getMetaDataDefinition();

        if (!metaData) {
            return;
        }

        try {
            await this.datasetsService.updateLoadingInfo(this.datasetListing.name, metaData);
            this.snackBar.open('Dataset loading information successfully updated.', 'Close', {
                duration: this.config.DEFAULTS.SNACKBAR_DURATION,
            });
            this.dataset = await this.datasetsService.getDataset(this.datasetListing.name);

            this.rawLoadingInfoPristine = true;
            if (this.gdalMetadataListComponent) {
                this.gdalMetadataListComponent.form.markAsPristine();
            }
            if (this.ogrDatasetComponent) {
                this.ogrDatasetComponent.formMetaData.markAsPristine();
            }
        } catch (error) {
            const errorMessage = await errorToText(error, 'Updating dataset loading information failed.');
            this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
        }
    }

    touchLoadingInfo(): void {
        this.rawLoadingInfoPristine = false;
    }

    private setUpColorizer(dataset: Dataset): void {
        if (dataset.symbology) {
            const symbology = Symbology.fromDict(dataset.symbology);

            if (symbology instanceof RasterSymbology) {
                this.rasterSymbology = symbology;
            } else {
                this.rasterSymbology = undefined;
            }

            if (symbology instanceof VectorSymbology) {
                this.vectorSymbology = symbology;
            } else {
                this.vectorSymbology = undefined;
            }
        } else {
            this.rasterSymbology = undefined;
            this.vectorSymbology = undefined;
        }
    }

    private getWorkflowId(dataset: Dataset): Promise<UUID> {
        if (dataset.resultDescriptor.type === 'raster') {
            return this.workflowsService.registerWorkflow({
                type: 'Raster',
                operator: {
                    type: 'GdalSource',
                    params: {
                        data: dataset.name,
                    },
                },
            });
        }

        if (dataset.resultDescriptor.type === 'vector') {
            return this.workflowsService.registerWorkflow({
                type: 'Vector',
                operator: {
                    type: 'OgrSource',
                    params: {
                        data: dataset.name,
                    },
                },
            });
        }

        throw new Error('Unknown dataset type');
    }

    private createVectorSymbology(dataset: Dataset): void {
        if (!(dataset.resultDescriptor.type === 'vector')) {
            return;
        }

        this.vectorSymbology = createDefaultVectorSymbology(dataset.resultDescriptor.dataType, WHITE);
    }

    private createRasterSymbology(): void {
        this.rasterSymbology = RasterSymbology.fromRasterSymbologyDict({
            type: 'raster',
            opacity: 1.0,
            rasterColorizer: {
                type: 'singleBand',
                band: 0,
                bandColorizer: {
                    type: 'linearGradient',
                    breakpoints: [
                        {value: 1, color: [0, 0, 0, 255]},
                        {value: 255, color: [255, 255, 255, 255]},
                    ],
                    overColor: [255, 255, 255, 127],
                    underColor: [0, 0, 0, 127],
                    noDataColor: [0, 0, 0, 0],
                },
            },
        });
    }

    private dataTypeFromResultDescriptor(rd: TypedResultDescriptor): string {
        if (rd.type === 'raster') {
            return (rd as TypedRasterResultDescriptor).dataType;
        }

        if (rd.type === 'vector') {
            return (rd as TypedVectorResultDescriptor).dataType;
        }

        // There are no plot datasets so this should never happen
        return '';
    }

    private setUpForm(dataset: Dataset): void {
        this.form = new FormGroup<DatasetForm>({
            layerType: new FormControl(dataset.resultDescriptor.type, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            dataType: new FormControl(this.dataTypeFromResultDescriptor(dataset.resultDescriptor), {
                nonNullable: true,
                validators: [Validators.required],
            }),
            name: new FormControl(dataset.name, {
                nonNullable: true,
                validators: [Validators.required, Validators.pattern(/^([a-zA-Z0-9_-]+:)?[a-zA-Z0-9_-]+$/), Validators.minLength(1)],
            }),
            displayName: new FormControl(dataset.displayName, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            description: new FormControl(dataset.description, {
                nonNullable: true,
            }),
            tags: new FormControl<string[]>(dataset.tags ?? [], {
                nonNullable: true,
                validators: [geoengineValidators.duplicateValidator()],
            }),
            newTag: new FormControl('', {nonNullable: true, validators: [tagValidator()]}),
        });
    }

    private placeholderForm(): FormGroup<DatasetForm> {
        return new FormGroup<DatasetForm>({
            layerType: new FormControl('raster', {
                nonNullable: true,
                validators: [Validators.required],
            }),
            dataType: new FormControl('U8', {
                nonNullable: true,
                validators: [Validators.required],
            }),
            name: new FormControl('name', {
                nonNullable: true,
                validators: [Validators.required, Validators.pattern(/^[a-zA-Z0-9_]+$/), Validators.minLength(1)],
            }),
            displayName: new FormControl('displayName', {
                nonNullable: true,
                validators: [Validators.required],
            }),
            description: new FormControl('description', {
                nonNullable: true,
            }),
            tags: new FormControl<string[]>([], {nonNullable: true, validators: [geoengineValidators.duplicateValidator()]}),
            newTag: new FormControl('', {nonNullable: true, validators: [tagValidator()]}),
        });
    }
}

export const isValidTag = (tag: string): boolean => {
    const illegalChars = [' ', '/', '..'];
    return tag.length > 0 && !illegalChars.some((char) => tag.includes(char));
};

export const tagValidator =
    (): ValidatorFn =>
    (control: AbstractControl): ValidationErrors | null => {
        const text = control.value as string;
        if (!text) {
            return null;
        }

        if (isValidTag(text)) {
            return null;
        }
        return {invalidTag: true};
    };
