import {Component, EventEmitter, Inject, Input, OnChanges, Output, signal, SimpleChanges, ViewChild, WritableSignal} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {
    CollectionNavigation,
    CommonModule,
    ConfirmationComponent,
    errorToText,
    LAYER_DB_PROVIDER_ID,
    LAYER_DB_ROOT_COLLECTION_ID,
    LayerCollectionListComponent,
    LayersService,
} from '@geoengine/common';
import {LayerCollection, LayerCollectionListing, LayerListing, ProviderLayerCollectionId} from '@geoengine/openapi-client';
import {Item, ItemType} from '../layers.component';
import {MatSnackBar} from '@angular/material/snack-bar';
import {AppConfig} from '../../app-config.service';
import {firstValueFrom} from 'rxjs';

export interface CollectionForm {
    name: FormControl<string>;
    description: FormControl<string>;
}

enum ChildAction {
    Goto,
    Delete,
    Cancel,
}

@Component({
    selector: 'geoengine-manager-layer-collection-editor',
    templateUrl: './layer-collection-editor.component.html',
    styleUrl: './layer-collection-editor.component.scss',
})
export class LayerCollectionEditorComponent implements OnChanges {
    readonly CollectionNavigation = CollectionNavigation;

    @Input({required: true}) collectionListing!: LayerCollectionListing;

    @Output() readonly collectionSelected = new EventEmitter<LayerCollectionListing>();
    @Output() readonly layerSelected = new EventEmitter<LayerListing>();
    @Output() readonly collectionDeleted = new EventEmitter<void>();

    @Output() readonly collectionUpdated = new EventEmitter<void>();

    @ViewChild(LayerCollectionListComponent) layerCollectionListComponent!: LayerCollectionListComponent;

    readonly collection: WritableSignal<LayerCollection | undefined> = signal(undefined);

    form: FormGroup<CollectionForm> = this.placeholderForm();

    constructor(
        private readonly layersService: LayersService,
        private readonly dialog: MatDialog,
        private readonly snackBar: MatSnackBar,
        private readonly config: AppConfig,
    ) {}

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
        });
    }

    selectLayer(layer: LayerListing): void {
        const dialogRef = this.dialog.open(ChildActionDialogComponent);

        dialogRef.afterClosed().subscribe(async (result: ChildAction) => {
            if (result === ChildAction.Goto) {
                this.layerSelected.emit(layer);
            } else if (result === ChildAction.Delete) {
                await this.layersService.removeLayerFromCollection(layer.id.layerId, this.collectionListing.id.collectionId);
                this.layerCollectionListComponent.refreshCollection();
            }
        });
    }

    selectCollection(collection: LayerCollectionListing): void {
        const dialogRef = this.dialog.open(ChildActionDialogComponent);

        dialogRef.afterClosed().subscribe(async (result: ChildAction) => {
            if (result === ChildAction.Goto) {
                this.collectionSelected.emit(collection);
            } else if (result === ChildAction.Delete) {
                await this.layersService.removeCollectionFromCollection(collection.id.collectionId, this.collectionListing.id.collectionId);
                this.layerCollectionListComponent.refreshCollection();
            }
        });
    }

    addChild(): void {
        const dialogRef = this.dialog.open(AddChildDialogComponent, {data: {collection: this.collectionListing.id}});

        dialogRef.afterClosed().subscribe(async (item: Item | undefined) => {
            if (!item) {
                return;
            }

            if (item.type === ItemType.Layer) {
                await this.layersService.addLayerToCollection(item.layer.id.layerId, this.collectionListing.id.collectionId);
                this.layerCollectionListComponent.refreshCollection();
            } else if (item.type === ItemType.Collection) {
                await this.layersService.addCollectionToCollection(item.collection.id.collectionId, this.collectionListing.id.collectionId);
                this.layerCollectionListComponent.refreshCollection();
            }
        });
    }

    async applyChanges(): Promise<void> {
        if (this.form.invalid) {
            return;
        }

        const name = this.form.controls.name.value;
        const description = this.form.controls.description.value;
        // TODO: properties

        try {
            this.layersService.updateLayerCollection(this.collectionListing.id.collectionId, {
                description,
                name,
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
            data: {message: 'Confirm the deletion of the collection. This cannot be undone.'},
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
}

@Component({
    selector: 'geoengine-layer-collection-child-dialog',
    standalone: true,
    imports: [MatDialogModule, MatButtonModule],
    template: `
        <h2 mat-dialog-title>Child Collection</h2>
        <mat-dialog-content>
            <p>Choose an action</p>
        </mat-dialog-content>
        <mat-dialog-actions>
            <button mat-raised-button (click)="onGoto()">Go To</button>
            <button mat-raised-button (click)="onDelete()" color="warn">Remove from Collection</button>
            <button mat-raised-button (click)="onCancel()" cdkFocusInitial>Cancel</button>
        </mat-dialog-actions>
    `,
})
export class ChildActionDialogComponent {
    constructor(private dialogRef: MatDialogRef<ChildActionDialogComponent>) {}

    onGoto(): void {
        this.dialogRef.close(ChildAction.Goto);
    }

    onDelete(): void {
        this.dialogRef.close(ChildAction.Delete);
    }

    onCancel(): void {
        this.dialogRef.close(ChildAction.Cancel);
    }
}

@Component({
    selector: 'geoengine-layer-collection-add-child-dialog',
    standalone: true,
    imports: [MatDialogModule, MatButtonModule, CommonModule],
    template: `
        <h2 mat-dialog-title>Select New Child</h2>
        <div class="dialog-content">
            <geoengine-layer-collection-navigation
                class="left"
                [showLayerToggle]="false"
                [collectionNavigation]="CollectionNavigation.Button"
                [collectionId]="rootCollectionId"
                (selectLayer)="selectLayer($event)"
                (selectCollection)="selectCollection($event)"
            ></geoengine-layer-collection-navigation>
        </div>
    `,
    styles: [
        `
            .dialog-content {
                height: 66vh;
                width: 66vh;
            }
        `,
    ],
})
export class AddChildDialogComponent {
    CollectionNavigation = CollectionNavigation;

    rootCollectionId = {providerId: LAYER_DB_PROVIDER_ID, collectionId: LAYER_DB_ROOT_COLLECTION_ID};

    @Inject(MAT_DIALOG_DATA) config!: {collection: ProviderLayerCollectionId};

    constructor(private dialogRef: MatDialogRef<ChildActionDialogComponent>) {}

    selectLayer(layer: LayerListing): void {
        this.dialogRef.close({layer, type: ItemType.Layer});
    }

    selectCollection(collection: LayerCollectionListing): void {
        this.dialogRef.close({collection, type: ItemType.Collection});
    }
}
