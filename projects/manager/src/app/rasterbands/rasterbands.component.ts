import {Component, OnChanges, SimpleChanges, input, output} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {geoengineValidators, MeasurementComponent} from '@geoengine/common';
import {Measurement, Provenance, RasterBandDescriptor} from '@geoengine/openapi-client';
import {MatDivider} from '@angular/material/list';
import {MatFormField, MatLabel, MatInput} from '@angular/material/input';
import {MatIconButton, MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {Subscription} from 'rxjs';

interface RasterbandsForm {
    rasterbands: FormArray<FormGroup<RasterbandForm>>;
}

interface RasterbandForm {
    name: FormControl<string>;
    measurement: FormControl<Measurement>; // TODO: Measurement type
}

@Component({
    selector: 'geoengine-manager-rasterbands',
    templateUrl: './rasterbands.component.html',
    styleUrl: './rasterbands.component.scss',
    imports: [FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatInput, MatIconButton, MatIcon, MatButton, MeasurementComponent],
})
export class RasterbandsComponent implements OnChanges {
    readonly rasterbands = input<Array<RasterBandDescriptor>>();

    readonly rasterbandsChange = output<Array<RasterBandDescriptor>>();

    form: FormGroup<RasterbandsForm> = this.setUpForm();

    sub?: Subscription;

    ngOnChanges(changes: SimpleChanges): void {
        console.log('RasterbandsComponent.ngOnChanges', changes);
        if (changes.rasterbands) {
            this.form = this.setUpForm();
        }
    }

    addEntry(): void {
        this.form.controls.rasterbands.push(this.createRasterbandForm());
        this.rasterbandsChange.emit(this.getRasterbands());
    }

    removeEntry(i: number): void {
        if (this.form.controls.rasterbands.length == 1) {
            return;
        }
        this.form.controls.rasterbands.removeAt(i);

        this.form.markAsDirty();
        this.rasterbandsChange.emit(this.getRasterbands());
    }

    getRasterbands(): Array<RasterBandDescriptor> {
        return this.form.controls.rasterbands.value.map((p) => ({
            name: p?.name ?? 'unnamed measurement',
            measurement: p?.measurement ?? {type: 'unitless'},
        }));
    }

    private setUpForm(): FormGroup<RasterbandsForm> {
        const rasterbands = this.rasterbands();

        const form = new FormGroup<RasterbandsForm>({
            rasterbands: new FormArray<FormGroup<RasterbandForm>>(rasterbands?.map((p) => this.createRasterbandForm(p)) ?? []),
        });

        if (this.sub) {
            this.sub.unsubscribe();
        }

        this.sub = form.valueChanges.subscribe(() => {
            this.rasterbandsChange.emit(this.getRasterbands());
        });

        return form;
    }

    private createRasterbandForm(p?: RasterBandDescriptor): FormGroup<RasterbandForm> {
        return new FormGroup<RasterbandForm>({
            name: new FormControl(p?.name ?? '', {
                nonNullable: true,
                validators: [Validators.required, geoengineValidators.notOnlyWhitespace],
                updateOn: 'blur',
            }),
            measurement: new FormControl(p?.measurement ?? {type: 'unitless'}, {
                nonNullable: true,
                validators: [Validators.required],
            }),
        });
    }
}
