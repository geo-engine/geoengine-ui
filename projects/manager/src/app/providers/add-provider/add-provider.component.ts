import {Component} from '@angular/core';
import {LayersService} from '@geoengine/common';
import {ProviderType} from '../provider-editor/provider-editor.component';
import {TypedDataProviderDefinition} from '@geoengine/openapi-client';
import {MatDialogRef, MatDialogTitle} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {errorToText} from 'projects/common/src/lib/util/conversions';
import {FormsModule} from '@angular/forms';
import {ProviderInputComponent} from '../provider-input/provider-input.component';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatLabel} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';
import {NgForOf} from '@angular/common';
import {MatButton} from '@angular/material/button';

@Component({
    selector: 'geoengine-manager-add-provider',
    templateUrl: './add-provider.component.html',
    styleUrl: './add-provider.component.scss',
    imports: [
        FormsModule,
        ProviderInputComponent,
        MatDialogTitle,
        MatCard,
        MatCardContent,
        MatLabel,
        MatSelect,
        MatOption,
        NgForOf,
        MatButton,
    ],
})
export class AddProviderComponent {
    providerType: ProviderType = ProviderType.OTHER;
    provider: TypedDataProviderDefinition | undefined;

    protected readonly ProviderType = ProviderType;
    protected readonly Object = Object;

    constructor(
        private readonly layersService: LayersService,
        private readonly dialogRef: MatDialogRef<AddProviderComponent>,
        private readonly matSnackBar: MatSnackBar,
    ) {}

    async createProvider(): Promise<void> {
        try {
            const id = await this.layersService.addProvider(this.provider!);
            this.dialogRef.close(id);
        } catch (e) {
            const error = await errorToText(e, 'Unknown error while creating provider');
            this.matSnackBar.open(error, 'Error');
        }
    }

    setChangedDefinition(definition?: TypedDataProviderDefinition): void {
        this.provider = definition;
    }
}
