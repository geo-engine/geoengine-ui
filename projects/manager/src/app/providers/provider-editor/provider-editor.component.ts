import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {LayerProviderListing, Permission, TypedDataProviderDefinition} from '@geoengine/openapi-client';
import {ConfirmationComponent, errorToText, LayersService, PermissionsService} from '@geoengine/common';
import {firstValueFrom} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {AppConfig} from '../../app-config.service';
import {ProviderInputComponent} from '../provider-input/provider-input.component';
import {NgIf} from '@angular/common';
import {MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle} from '@angular/material/card';
import {MatHint} from '@angular/material/form-field';
import {PermissionsComponent} from '../../permissions/permissions.component';
import {MatButton} from '@angular/material/button';

export enum ProviderType {
    ARUNA = 'Aruna',
    OTHER = 'Other / JSON',
}

@Component({
    selector: 'geoengine-manager-provider-editor',
    templateUrl: './provider-editor.component.html',
    styleUrl: './provider-editor.component.scss',
    imports: [
        ProviderInputComponent,
        NgIf,
        MatCard,
        MatCardHeader,
        MatCardSubtitle,
        MatCardTitle,
        MatCardContent,
        MatHint,
        PermissionsComponent,
        MatButton,
    ],
})
export class ProviderEditorComponent implements OnChanges, OnInit {
    @Input({required: true}) providerListing!: LayerProviderListing;

    @Output() providerUpdated = new EventEmitter<void>();

    @Output() providerDeleted = new EventEmitter<void>();

    provider?: TypedDataProviderDefinition;

    providerType: ProviderType = ProviderType.OTHER;

    changedDefinition = false;

    readonly = false;

    constructor(
        private readonly layersService: LayersService,
        private readonly permissionsService: PermissionsService,
        private readonly dialog: MatDialog,
        private readonly snackBar: MatSnackBar,
        private readonly config: AppConfig,
    ) {}

    ngOnInit(): void {
        this.layersService.getProviderDefinition(this.providerListing.id).then((provider) => {
            this.provider = provider;
            this.setProviderType();

            this.permissionsService.getPermissions('provider', this.providerListing.id, 0, 1).then(
                (permissions) => {
                    this.readonly = permissions.length < 1 || permissions[0].permission != Permission.Owner;
                },
                (_error) => {
                    this.readonly = true;
                },
            );
        });
    }

    ngOnChanges(_: SimpleChanges): void {
        this.provider = undefined;
        this.changedDefinition = false;
        this.layersService.getProviderDefinition(this.providerListing.id).then((provider) => {
            this.provider = provider;
            this.setProviderType();

            this.permissionsService.getPermissions('provider', this.providerListing.id).then(
                (permissions) => {
                    if (!permissions.find((permission) => permission.permission === Permission.Owner)) {
                        this.readonly = true;
                    } else {
                        this.readonly = false;
                    }
                },
                (_error) => {
                    this.readonly = true;
                },
            );
        });
    }

    setChangedDefinition(definition: TypedDataProviderDefinition): void {
        this.changedDefinition = true;
        this.provider = definition;
    }

    async submitUpdate(): Promise<void> {
        const provider = this.provider!;

        try {
            await this.layersService.updateProviderDefinition(this.providerListing.id, provider);

            this.providerUpdated.next();
            this.provider = provider;
            this.changedDefinition = false;
        } catch (e) {
            const error = await errorToText(e, 'Unknown error while updating provider');
            this.snackBar.open(error, 'Error');
        }
    }

    private setProviderType(): void {
        switch (this.provider?.type) {
            case 'Aruna':
                this.providerType = ProviderType.ARUNA;
                return;
            default:
                this.providerType = ProviderType.OTHER;
        }
    }

    async delete(): Promise<void> {
        const dialogRef = this.dialog.open(ConfirmationComponent, {
            data: {message: 'Confirm the deletion of the provider. This cannot be undone.'},
        });

        const confirm = await firstValueFrom(dialogRef.afterClosed());

        if (!confirm) {
            return;
        }

        try {
            await this.layersService.deleteProvider(this.providerListing.id);
            this.snackBar.open('Provider successfully deleted.', 'Close', {duration: this.config.DEFAULTS.SNACKBAR_DURATION});
            this.providerDeleted.emit();
        } catch (error) {
            const errorMessage = await errorToText(error, 'Deleting provider failed.');
            this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
        }
    }
}
