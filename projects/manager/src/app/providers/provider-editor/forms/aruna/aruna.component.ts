import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {AbstractControl, FormBuilder, FormControl, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators} from '@angular/forms';
import {ArunaDataProviderDefinition, TypedDataProviderDefinition} from '@geoengine/openapi-client';
import {isValidUuid} from '@geoengine/common';
import {IdInputComponent} from '../util/id-input/id-input.component';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatError, MatFormField} from '@angular/material/form-field';
import {MatInput, MatLabel} from '@angular/material/input';
import {NgIf} from '@angular/common';
import {CdkTextareaAutosize} from '@angular/cdk/text-field';
import {MatTooltip} from '@angular/material/tooltip';
import {ErrorStateMatcher} from '@angular/material/core';

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
        MatError,
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

    form = this.fb.group({
        apiToken: this.fb.nonNullable.control('', Validators.required),
        apiUrl: this.fb.nonNullable.control('', Validators.required),
        description: this.fb.nonNullable.control(''),
        filterLabel: this.fb.nonNullable.control(''),
        id: this.fb.nonNullable.control('', [isValidUuid, Validators.required]),
        name: this.fb.nonNullable.control('', Validators.required),
        projectId: this.fb.nonNullable.control('', Validators.required),
        cacheTtl: this.fb.nonNullable.control<number | undefined>(0, [
            Validators.min(0),
            Validators.max(31536000),
            this.integerValidator(),
        ]),
        priority: this.fb.nonNullable.control<number | null | undefined>(0, [
            Validators.min(-32768),
            Validators.max(32767),
            this.integerValidator(),
        ]),
    });

    errorStateMatcher: ErrorStateMatcher = {
        isErrorState: (control: FormControl | null): boolean => !!control && control.invalid && (control.dirty || control.touched),
    };

    private editing: boolean = false;

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
                cacheTtl: 0,
                priority: 0,
                type: 'Aruna',
            };
        }

        this.setFormValue(definition);

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
                    cacheTtl: this.convertToNumber(this.form.controls['cacheTtl'].value),
                    description: this.form.controls['description'].value,
                    filterLabel: this.form.controls['filterLabel'].value,
                    id: this.form.controls['id'].value,
                    name: this.form.controls['name'].value,
                    priority: this.convertToNumber(this.form.controls['priority'].value),
                    projectId: this.form.controls['projectId'].value,
                });
            }
        });
    }

    ngOnChanges(_: SimpleChanges): void {
        if (!this.visible) {
            this.editing = false;
        } else if (this.provider && !this.editing) {
            setTimeout(() => {
                const provider = this.provider as ArunaDataProviderDefinition;
                this.setFormValue(provider);

                if (this.readonly) {
                    this.form.disable({emitEvent: false});
                } else {
                    this.form.enable({emitEvent: false});
                    this.editing = true;
                }
            }, 50);
        }
    }

    get priority(): FormControl<number | null | undefined> {
        return this.form.controls['priority'];
    }

    get cacheTtl(): FormControl<number | undefined> {
        return this.form.controls['cacheTtl'];
    }

    private integerValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value = control.value;

            const num = Number(value);
            return Number.isInteger(num) ? null : {notInteger: true};
        };
    }

    private convertToNumber(value: number | null | undefined): number | undefined {
        return value ? Number(value) : undefined;
    }

    private setFormValue(provider: ArunaDataProviderDefinition): void {
        this.form.setValue(
            {
                apiToken: provider.apiToken,
                apiUrl: provider.apiUrl,
                description: provider.description,
                cacheTtl: provider.cacheTtl,
                filterLabel: provider.filterLabel,
                id: provider.id,
                name: provider.name,
                priority: provider.priority ?? 0,
                projectId: provider.projectId,
            },
            {emitEvent: false},
        );
    }
}
