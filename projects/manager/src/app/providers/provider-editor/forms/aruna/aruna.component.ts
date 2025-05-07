import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ArunaDataProviderDefinition, TypedDataProviderDefinition} from '@geoengine/openapi-client';
import {isValidUuid} from '@geoengine/common';
import {IdInputComponent} from '../util/id-input/id-input.component';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatFormField} from '@angular/material/form-field';
import {MatInput, MatLabel} from '@angular/material/input';
import {NgIf} from '@angular/common';
import {CdkTextareaAutosize} from '@angular/cdk/text-field';
import {MatTooltip} from '@angular/material/tooltip';

@Component({
    selector: 'geoengine-manager-aruna-editor-form',
    templateUrl: './aruna.component.html',
    styleUrl: './aruna.component.scss',
    imports: [
        IdInputComponent,
        ReactiveFormsModule,
        MatCard,
        MatCardContent,
        MatFormField,
        MatLabel,
        MatInput,
        NgIf,
        CdkTextareaAutosize,
        MatTooltip,
    ],
})
export class ArunaComponent implements OnInit, OnChanges {
    @Input() provider?: TypedDataProviderDefinition;
    @Input() createNew: boolean = false;
    @Input() readonly: boolean = false;
    @Input() visible: boolean = false;

    @Output() changed = new EventEmitter<TypedDataProviderDefinition>();

    form: FormGroup = this.fb.group({});

    constructor(private fb: FormBuilder) {}

    ngOnInit(): void {
        let definition = this.provider as ArunaDataProviderDefinition;

        if (!definition) {
            definition = {
                apiToken: '',
                apiUrl: '',
                description: '',
                filterLabel: '',
                id: '',
                name: '',
                projectId: '',
                type: 'Aruna',
            };
        }

        this.form = this.fb.group({
            apiToken: this.fb.nonNullable.control(definition.apiToken, Validators.required),
            apiUrl: this.fb.nonNullable.control(definition.apiUrl, Validators.required),
            description: this.fb.nonNullable.control(definition.description),
            filterLabel: this.fb.nonNullable.control(definition.filterLabel),
            id: this.fb.nonNullable.control(definition.id, [isValidUuid, Validators.required]),
            name: this.fb.nonNullable.control(definition.name, Validators.required),
            projectId: this.fb.nonNullable.control(definition.projectId, Validators.required),
            cacheTtl: this.fb.nonNullable.control(definition.cacheTtl),
            priority: this.fb.nonNullable.control(definition.priority),
        });

        if (this.readonly) {
            this.form.disable();
        } else {
            this.form.enable();
        }

        this.form.valueChanges.subscribe((_) => {
            if (!this.form.valid) {
                this.changed.emit(undefined);
            } else {
                this.changed.emit({
                    type: 'Aruna',
                    apiToken: this.form.controls['apiToken'].value,
                    apiUrl: this.form.controls['apiUrl'].value,
                    cacheTtl: this.form.controls['cacheTtl'].value,
                    description: this.form.controls['description'].value,
                    filterLabel: this.form.controls['filterLabel'].value,
                    id: this.form.controls['id'].value,
                    name: this.form.controls['name'].value,
                    priority: this.form.controls['priority'].value,
                    projectId: this.form.controls['projectId'].value,
                });
            }
        });
    }

    ngOnChanges(_: SimpleChanges): void {
        if (this.provider && this.visible) {
            setTimeout(() => {
                const provider = this.provider as ArunaDataProviderDefinition;
                this.form.setValue(
                    {
                        apiToken: provider.apiToken,
                        apiUrl: provider.apiUrl,
                        description: provider.description,
                        cacheTtl: provider.cacheTtl,
                        filterLabel: provider.filterLabel,
                        id: provider.id,
                        name: provider.name,
                        priority: provider.priority,
                        projectId: provider.projectId,
                    },
                    {emitEvent: false},
                );

                if (this.readonly) {
                    this.form.disable({emitEvent: false});
                } else {
                    this.form.enable({emitEvent: false});
                }
            }, 50);
        }
    }

    get idControl(): FormControl {
        return this.form.get('id') as FormControl;
    }
}
