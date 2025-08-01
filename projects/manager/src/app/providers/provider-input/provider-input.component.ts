import {Component, viewChild, output, input, effect} from '@angular/core';
import {ProviderType} from '../provider-editor/provider-editor.component';
import {TypedDataProviderDefinition} from '@geoengine/openapi-client';
import {MatTab, MatTabChangeEvent, MatTabGroup} from '@angular/material/tabs';
import {ProviderJsonInputComponent} from '../provider-json-input/provider-json-input.component';
import {ArunaComponent} from '../provider-editor/forms/aruna/aruna.component';

@Component({
    selector: 'geoengine-manager-provider-input',
    templateUrl: './provider-input.component.html',
    styleUrl: './provider-input.component.scss',
    imports: [ProviderJsonInputComponent, ArunaComponent, MatTabGroup, MatTab],
})
export class ProviderInputComponent {
    readonly providerType = input<ProviderType>(ProviderType.OTHER);
    readonly updated = output<TypedDataProviderDefinition | undefined>();
    readonly provider = input<TypedDataProviderDefinition>();
    readonly createNew = input<boolean>(false);
    readonly readonly = input<boolean>(false);
    readonly tabs = viewChild<MatTabGroup>('tabs');
    jsonInputVisible: boolean = false;
    jsonDefinition: TypedDataProviderDefinition | undefined;
    formDefinition: TypedDataProviderDefinition | undefined;

    protected readonly ProviderType = ProviderType;

    constructor() {
        effect(() => {
            this.jsonInputVisible = this.providerType() === ProviderType.OTHER;
            setTimeout(() => (this.tabs()!.selectedIndex = 0));
        });

        effect(() => {
            this.provider();
            this.providerType();
            this.createNew();
            this.readonly();

            this.jsonDefinition = undefined;
            this.formDefinition = undefined;
        });
    }

    setChangedJSONDefinition(provider: TypedDataProviderDefinition): void {
        this.jsonDefinition = provider;
        this.updated.emit(provider);
    }

    setChangedFormDefinition(provider?: TypedDataProviderDefinition): void {
        this.formDefinition = provider;
        this.updated.emit(provider);
    }

    onTabChange($event: MatTabChangeEvent): void {
        this.jsonInputVisible = $event.tab.textLabel === 'JSON';
        if (this.jsonInputVisible) {
            this.updated.emit(this.jsonDefinition);
        } else {
            this.updated.emit(this.formDefinition);
        }
    }
}
