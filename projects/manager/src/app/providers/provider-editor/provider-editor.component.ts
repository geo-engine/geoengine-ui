import {Component, inject, OnChanges, OnInit, SimpleChanges, output, input} from '@angular/core';
import {LayerProviderListing, Permission, TypedDataProviderDefinition} from '@geoengine/openapi-client';
import {ConfirmationComponent, errorToText, LayersService, PermissionsService} from '@geoengine/common';
import {firstValueFrom} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {AppConfig} from '../../app-config.service';
import {ProviderInputComponent} from '../provider-input/provider-input.component';

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
    readonly providerListing = input.required<LayerProviderListing>();

    readonly providerUpdated = output<void>();

    readonly providerDeleted = output<void>();

    provider?: TypedDataProviderDefinition;

    updatedDefinition?: TypedDataProviderDefinition;

    providerType: ProviderType = ProviderType.OTHER;

    readonly = false;

    private readonly layersService = inject(LayersService);
    private readonly permissionsService = inject(PermissionsService);
    private readonly dialog = inject(MatDialog);
    private readonly snackBar = inject(MatSnackBar);
    private readonly config = inject(AppConfig);

    ngOnInit(): void {
        this.layersService.getProviderDefinition(this.providerListing().id).then((provider) => {
            this.provider = provider;
            this.setProviderType();

            this.permissionsService.getPermissions('provider', this.providerListing().id, 0, 1).then(
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
        this.updatedDefinition = undefined;
        this.layersService.getProviderDefinition(this.providerListing().id).then((provider) => {
            this.provider = provider;
            this.setProviderType();

            this.permissionsService.getPermissions('provider', this.providerListing().id).then(
                (permissions) => {
                    this.readonly = !permissions.find((permission) => permission.permission === Permission.Owner);
                },
                (_error) => {
                    this.readonly = true;
                },
            );
        });
    }

    setUpdatedDefinition(definition?: TypedDataProviderDefinition): void {
        this.updatedDefinition = definition;
    }

    async submitUpdate(): Promise<void> {
        const provider = this.updatedDefinition!;

        try {
            await this.layersService.updateProviderDefinition(this.providerListing().id, provider);

            this.providerUpdated.emit();
            this.provider = provider;
            this.updatedDefinition = undefined;
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
            await this.layersService.deleteProvider(this.providerListing().id);
            this.snackBar.open('Provider successfully deleted.', 'Close', {duration: this.config.DEFAULTS.SNACKBAR_DURATION});
            this.providerDeleted.emit(undefined);
        } catch (error) {
            const errorMessage = await errorToText(error, 'Deleting provider failed.');
            this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
        }
    }
}
