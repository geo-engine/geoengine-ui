import {Component, EventEmitter, Input, OnChanges, Output, signal, SimpleChanges, WritableSignal} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {CollectionNavigation, ConfirmationComponent, errorToText, LayersService} from '@geoengine/common';
import {LayerCollection, LayerCollectionListing, LayerListing, ProviderLayerCollectionId} from '@geoengine/openapi-client';
import {firstValueFrom} from 'rxjs';
import {AppConfig} from '../../app-config.service';

export interface CollectionForm {
    name: FormControl<string>;
    description: FormControl<string>;
    properties: FormArray<FormArray<FormControl<string>>>;
}

@Component({
    selector: 'geoengine-manager-layer-collection-editor',
    templateUrl: './layer-collection-editor.component.html',
    styleUrl: './layer-collection-editor.component.scss',
    standalone: false,
})
export class LayerCollectionEditorComponent implements OnChanges {
    readonly CollectionNavigation = CollectionNavigation;

    @Input({required: true}) collectionListing!: LayerCollectionListing;
    @Input({required: true}) parentCollection!: ProviderLayerCollectionId;

    @Output() readonly collectionSelected = new EventEmitter<LayerCollectionListing>();
    @Output() readonly layerSelected = new EventEmitter<LayerListing>();
    @Output() readonly collectionDeleted = new EventEmitter<void>();

    @Output() readonly collectionUpdated = new EventEmitter<void>();

    readonly collection: WritableSignal<LayerCollection | undefined> = signal(undefined);

    form: FormGroup<CollectionForm> = this.placeholderForm();

    selectedLayer?: LayerListing;
    selectedCollection?: LayerCollectionListing;

    constructor(
        private readonly layersService: LayersService,
        private readonly dialog: MatDialog,
        private readonly snackBar: MatSnackBar,
        private readonly config: AppConfig,
    ) {}

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async ngOnChanges(changes: SimpleChanges): Promise<void> {
        if (changes.collectionListing) {
            const collection = await this.layersService.getLayerCollectionItems(
                this.collectionListing.id.providerId,
                this.collectionListing.id.collectionId,
                0,
                0,
            );
            this.collection.set(collection);
            this.setUpForm(collection);
        }
    }

    private setUpForm(collection: LayerCollection): void {
        this.form = new FormGroup<CollectionForm>({
            name: new FormControl(collection.name, {
                nonNullable: true,
                validators: [Validators.required, Validators.minLength(1)],
            }),
            description: new FormControl(collection.description, {
                nonNullable: true,
            }),
            properties: new FormArray<FormArray<FormControl<string>>>(
                collection.properties?.map((c) => {
                    return new FormArray<FormControl<string>>([
                        new FormControl(c[0], {
                            nonNullable: true,
                            validators: [Validators.required],
                        }),
                        new FormControl(c[1], {
                            nonNullable: true,
                            validators: [Validators.required],
                        }),
                    ]);
                }) ?? [],
            ),
        });
    }

    private placeholderForm(): FormGroup<CollectionForm> {
        return new FormGroup<CollectionForm>({
            name: new FormControl('name', {
                nonNullable: true,
                validators: [Validators.required, Validators.minLength(1)],
            }),
            description: new FormControl('description', {
                nonNullable: true,
            }),
            properties: new FormArray<FormArray<FormControl<string>>>([]),
        });
    }

    addProperty(): void {
        this.form.controls.properties.push(
            new FormArray<FormControl<string>>([
                new FormControl('newKey', {
                    nonNullable: true,
                    validators: [Validators.required],
                }),
                new FormControl('newValue', {
                    nonNullable: true,
                    validators: [Validators.required],
                }),
            ]),
        );
        this.form.markAsDirty();
    }

    removeProperty(i: number): void {
        this.form.controls.properties.removeAt(i);
        this.form.markAsDirty();
    }

    async applyChanges(): Promise<void> {
        if (this.form.invalid) {
            return;
        }

        const name = this.form.controls.name.value;
        const description = this.form.controls.description.value;
        const properties = this.form.controls.properties.value;

        try {
            this.layersService.updateLayerCollection(this.collectionListing.id.collectionId, {
                name,
                description,
                properties,
            });

            this.snackBar.open('Collection successfully updated.', 'Close', {duration: this.config.DEFAULTS.SNACKBAR_DURATION});
            this.collectionListing.name = name;
            this.collectionListing.description = description;
            this.form.markAsPristine();

            this.collectionUpdated.emit();
        } catch (error) {
            const errorMessage = await errorToText(error, 'Updating collection failed.');
            this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
        }
    }

    async deleteCollection(): Promise<void> {
        const dialogRef = this.dialog.open(ConfirmationComponent, {
            data: {message: 'Confirm the deletion of the collection. It will be removed from ALL collections. This cannot be undone.'},
        });

        const confirm = await firstValueFrom(dialogRef.afterClosed());

        if (!confirm) {
            return;
        }

        try {
            await this.layersService.removeLayerCollection(this.collectionListing.id.collectionId);
            this.snackBar.open('Collection successfully deleted.', 'Close', {duration: this.config.DEFAULTS.SNACKBAR_DURATION});
            this.collectionDeleted.emit();
        } catch (error) {
            const errorMessage = await errorToText(error, 'Deleting collection failed.');
            this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
        }
    }

    async deleteCollectionFromParent(): Promise<void> {
        const dialogRef = this.dialog.open(ConfirmationComponent, {
            data: {message: 'Confirm the removal of the collection from the parent collection.'},
        });

        const confirm = await firstValueFrom(dialogRef.afterClosed());

        if (!confirm) {
            return;
        }

        try {
            await this.layersService.removeCollectionFromCollection(
                this.collectionListing.id.collectionId,
                this.parentCollection.collectionId,
            );
            this.snackBar.open('Collection successfully deleted.', 'Close', {duration: this.config.DEFAULTS.SNACKBAR_DURATION});
            this.collectionDeleted.emit();
        } catch (error) {
            const errorMessage = await errorToText(error, 'Removing collection failed.');
            this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
        }
    }
}
