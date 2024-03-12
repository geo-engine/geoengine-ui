import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild} from '@angular/core';
import {AbstractControl, FormArray, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators} from '@angular/forms';
import {MatChipGrid, MatChipInputEvent} from '@angular/material/chips';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {
    ConfirmationComponent,
    DatasetsService,
    RasterSymbology,
    Symbology,
    UUID,
    VectorSymbology,
    WHITE,
    WorkflowsService,
    createVectorSymbology as createDefaultVectorSymbology,
} from '@geoengine/common';
import {
    Dataset,
    DatasetListing,
    RasterResultDescriptorWithType,
    ResponseError,
    TypedResultDescriptor,
    VectorResultDescriptorWithType,
} from '@geoengine/openapi-client';
import {BehaviorSubject, firstValueFrom} from 'rxjs';

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
})
export class DatasetEditorComponent implements OnChanges {
    @Input({required: true}) datasetListing!: DatasetListing;

    @Output() datasetDeleted = new EventEmitter<void>();

    dataset?: Dataset;
    form: FormGroup<DatasetForm> = this.placeholderForm();

    datasetWorkflowId$ = new BehaviorSubject<UUID | undefined>(undefined);

    rasterSymbology?: RasterSymbology = undefined;
    vectorSymbology?: VectorSymbology = undefined;

    constructor(
        private readonly datasetsService: DatasetsService,
        private readonly workflowsService: WorkflowsService,
        private readonly snackBar: MatSnackBar,
        private readonly dialog: MatDialog,
    ) {}

    async ngOnChanges(changes: SimpleChanges): Promise<void> {
        if (changes.datasetListing) {
            this.dataset = await this.datasetsService.getDataset(this.datasetListing.name);
            this.setUpForm(this.dataset);
            const workflowId = await this.getWorkflowId(this.dataset);
            this.datasetWorkflowId$.next(workflowId);
            this.setUpColorizer(this.dataset);
        }
    }

    async applyChanges(): Promise<void> {
        const name = this.form.controls.name.value;
        const displayName = this.form.controls.displayName.value;
        const description = this.form.controls.description.value;
        try {
            await this.datasetsService.updateDataset(this.datasetListing.name, {name, displayName, description});
            this.datasetListing.name = name;
            this.datasetListing.displayName = displayName;
            this.datasetListing.description = description;
            this.snackBar.open('Dataset successfully updated.', 'Close', {duration: 2000});
            this.form.markAsPristine();
        } catch (error) {
            const e = error as ResponseError;
            const errorJson = await e.response.json().catch(() => ({}));
            const errorMessage = errorJson.message ?? 'Updating dataset failed.';
            this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
        }
    }

    removeTag(tag: string): void {
        const tags: Array<string> = this.form.controls.tags.value;

        const index = tags.indexOf(tag);
        if (index > -1) {
            tags.splice(index, 1);
        }
    }

    addTag(event: MatChipInputEvent): void {
        const tags: Array<string> = this.form.controls.tags.value;
        const tag = event.value;
        const input = event.input;

        if (!isValidTag(tag)) {
            return;
        }

        input.value = '';

        tags.push(tag);
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
            this.snackBar.open('Dataset successfully deleted.', 'Close', {duration: 2000});
            this.datasetDeleted.emit();
        } catch (error) {
            const e = error as ResponseError;
            const errorJson = await e.response.json().catch(() => ({}));
            const errorMessage = errorJson.message ?? 'Deleting dataset failed.';
            this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
        }
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
            return (rd as RasterResultDescriptorWithType).dataType;
        }

        if (rd.type === 'vector') {
            return (rd as VectorResultDescriptorWithType).dataType;
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
                validators: [Validators.required, Validators.pattern(/^[a-zA-Z0-9_]+$/), Validators.minLength(1)],
            }),
            displayName: new FormControl(dataset.displayName, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            description: new FormControl(dataset.description, {
                nonNullable: true,
            }),
            tags: new FormControl<string[]>([], {nonNullable: true, validators: [Validators.required, duplicateTagValidator()]}),
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
            tags: new FormControl<string[]>([], {nonNullable: true, validators: [Validators.required, duplicateTagValidator()]}),
            newTag: new FormControl('', {nonNullable: true, validators: [tagValidator()]}),
        });
    }
}

export const duplicateTagValidator =
    (): ValidatorFn =>
    (control: AbstractControl): ValidationErrors | null => {
        const tags = control.value as string[];

        if (!tags) {
            return null;
        }

        const duplicates = tags.some((value, index) => tags.indexOf(value) !== index);

        return duplicates ? {duplicate: true} : null;
    };

export const isValidTag = (tag: string): boolean => {
    const illegalChars = [' ', '/', '..'];
    return !illegalChars.some((char) => tag.includes(char));
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
