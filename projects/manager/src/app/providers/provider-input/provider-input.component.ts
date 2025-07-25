import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';
import {ProviderType} from '../provider-editor/provider-editor.component';
import {TypedDataProviderDefinition} from '@geoengine/openapi-client';
import {MatTab, MatTabChangeEvent, MatTabGroup} from '@angular/material/tabs';
import {ProviderJsonInputComponent} from '../provider-json-input/provider-json-input.component';
import {ArunaComponent} from '../provider-editor/forms/aruna/aruna.component';
import {NgIf, NgSwitch, NgSwitchCase} from '@angular/common';

@Component({
    selector: 'geoengine-manager-provider-input',
    templateUrl: './provider-input.component.html',
    styleUrl: './provider-input.component.scss',
    imports: [ProviderJsonInputComponent, NgSwitch, ArunaComponent, MatTabGroup, MatTab, NgIf, NgSwitchCase],
})
export class ProviderInputComponent implements OnInit, OnChanges {
    @Input() providerType: ProviderType = ProviderType.OTHER;
    @Output() updated = new EventEmitter<TypedDataProviderDefinition>();
    @Input() provider: TypedDataProviderDefinition | undefined;
    @Input() createNew: boolean = false;
    @Input() readonly: boolean = false;
    @ViewChild('tabs') tabs?: MatTabGroup;
    jsonInputVisible: boolean = false;
    jsonDefinition: TypedDataProviderDefinition | undefined;
    formDefinition: TypedDataProviderDefinition | undefined;

    protected readonly ProviderType = ProviderType;

    ngOnInit(): void {
        this.jsonInputVisible = this.providerType === ProviderType.OTHER;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['providerType']) {
            setTimeout(() => (this.tabs!.selectedIndex = 0));
        }
        this.jsonDefinition = undefined;
        this.formDefinition = undefined;
    }

    setChangedJSONDefinition(provider: TypedDataProviderDefinition): void {
        this.jsonDefinition = provider;
        this.updated.emit(provider);
    }

    setChangedFormDefinition(provider: TypedDataProviderDefinition): void {
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
