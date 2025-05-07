import {Component, ViewChild} from '@angular/core';
import {ProviderListComponent} from './provider-list/provider-list.component';
import {LayerProviderListing} from '@geoengine/openapi-client';
import {ProviderEditorComponent} from './provider-editor/provider-editor.component';

@Component({
    selector: 'geoengine-manager-providers',
    templateUrl: './providers.component.html',
    styleUrl: './providers.component.scss',
    imports: [ProviderEditorComponent, ProviderListComponent],
})
export class ProvidersComponent {
    @ViewChild(ProviderListComponent) providerList!: ProviderListComponent;

    selectedProvider$: LayerProviderListing | undefined = undefined;

    constructor() {}

    selectProvider(provider: LayerProviderListing): void {
        this.selectedProvider$ = provider;
    }

    providerUpdated(): void {
        this.providerList.reload();
    }

    providerDeleted(): void {
        this.providerList.reload();
        this.selectedProvider$ = undefined;
    }
}
