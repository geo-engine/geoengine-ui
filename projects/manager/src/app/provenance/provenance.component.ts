import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {geoengineValidators} from '@geoengine/common';
import {Provenance} from '@geoengine/openapi-client';

interface ProvenanceListForm {
    provenance: FormArray<FormGroup<ProvenanceForm>>;
}

interface ProvenanceForm {
    citation: FormControl<string>;
    license: FormControl<string>;
    uri: FormControl<string>;
}

export interface ProvenanceChange {
    provenance: Array<Provenance>;
    valid: boolean;
}

@Component({
    selector: 'geoengine-manager-provenance',
    templateUrl: './provenance.component.html',
    styleUrl: './provenance.component.scss',
    standalone: false,
})
export class ProvenanceComponent implements OnChanges {
    @Input() provenance?: Array<Provenance>;

    @Output() provenanceChange = new EventEmitter<ProvenanceChange>();

    form: FormGroup<ProvenanceListForm> = this.setUpForm();

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.provenance) {
            this.form = this.setUpForm();
        }
    }

    addEntry(): void {
        this.form.controls.provenance.push(this.createProvenanceForm());
    }

    removeEntry(i: number): void {
        this.form.controls.provenance.removeAt(i);

        this.form.markAsDirty();
    }

    getProvenance(): Array<Provenance> {
        return this.form.controls.provenance.value.map((p) => ({
            citation: p.citation ?? '',
            license: p.license ?? '',
            uri: p.uri ?? '',
        }));
    }

    private setUpForm(): FormGroup<ProvenanceListForm> {
        if (!this.provenance) {
            return new FormGroup<ProvenanceListForm>({
                provenance: new FormArray<FormGroup<ProvenanceForm>>([]),
            });
        }

        this.form.valueChanges.subscribe(() => {
            this.provenanceChange.emit({provenance: this.getProvenance(), valid: this.form.valid});
        });

        return new FormGroup<ProvenanceListForm>({
            provenance: new FormArray<FormGroup<ProvenanceForm>>(this.provenance.map((p) => this.createProvenanceForm(p))),
        });
    }

    private createProvenanceForm(p?: Provenance): FormGroup<ProvenanceForm> {
        return new FormGroup<ProvenanceForm>({
            citation: new FormControl(p?.citation ?? '', {
                nonNullable: true,
                validators: [Validators.required, geoengineValidators.notOnlyWhitespace],
            }),
            license: new FormControl(p?.license ?? '', {
                nonNullable: true,
                validators: [Validators.required, geoengineValidators.notOnlyWhitespace],
            }),
            uri: new FormControl(p?.uri ?? '', {
                nonNullable: true,
                validators: [Validators.required, geoengineValidators.notOnlyWhitespace],
            }),
        });
    }
}
