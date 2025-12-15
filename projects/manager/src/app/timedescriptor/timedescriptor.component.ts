import {Component, OnChanges, SimpleChanges, input, output} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {
    geoengineValidators,
    MeasurementComponent,
    time_interval_from_dict,
    time_interval_to_dict,
    TimeInterval,
    CommonModule,
} from '@geoengine/common';
import {
    Measurement,
    Provenance,
    RasterBandDescriptor,
    TimeDescriptor,
    TimeDimensionOneOf1TypeEnum,
    TimeDimensionOneOfTypeEnum,
} from '@geoengine/openapi-client';
import {MatDivider} from '@angular/material/list';
import {MatFormField, MatLabel, MatInput} from '@angular/material/input';
import {MatIconButton, MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {Subscription} from 'rxjs';
import {MatSelect, MatOption} from '@angular/material/select';
import moment from 'moment';
import {MatCheckbox} from '@angular/material/checkbox';

interface TimeDescriptorForm {
    has_bounds: FormControl<boolean>;
    bounds: FormControl<TimeInterval | null>;
    dimension: FormControl<Regularity>;
    regularTimeDimension: FormGroup<RegularTimeDimensionForm>;
}

interface RegularTimeDimensionForm {
    origin: FormControl<number>;
    step: FormGroup<TimeStepForm>;
}

interface TimeStepForm {
    granularity: FormControl<string>;
    step: FormControl<number>;
}

enum Regularity {
    Regular = 'regular',
    Irregular = 'irregular',
}

@Component({
    selector: 'geoengine-manager-timedescriptor',
    templateUrl: './timedescriptor.component.html',
    styleUrl: './timedescriptor.component.scss',
    imports: [
        FormsModule,
        ReactiveFormsModule,
        MatFormField,
        MatLabel,
        MatInput,
        MatIconButton,
        MatIcon,
        MatButton,
        MeasurementComponent,
        MatSelect,
        MatOption,
        CommonModule,
        MatCheckbox,
    ],
})
export class TimedescriptorComponent implements OnChanges {
    Regularity = [TimeDimensionOneOf1TypeEnum.Irregular, TimeDimensionOneOfTypeEnum.Regular] as const;
    TimeGranularities = ['years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds'] as const;

    readonly timeDescriptor = input<TimeDescriptor>();

    readonly timeDescriptorChange = output<TimeDescriptor>();

    form: FormGroup<TimeDescriptorForm> = this.setUpForm();

    sub?: Subscription;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.rasterbands) {
            this.form = this.setUpForm();
        }
    }

    private setUpForm(): FormGroup<TimeDescriptorForm> {
        let bounds = this.timeDescriptor()?.bounds;
        let form_bounds = null;
        if (!!bounds) {
            form_bounds = time_interval_from_dict(bounds);
        } else {
            form_bounds = {
                start: moment.utc().hour(0).minute(0).second(0).millisecond(0),
                end: moment.utc().add(1, 'days').hour(0).minute(0).second(0).millisecond(0),
                timeAsPoint: false,
            };
        }

        const form = new FormGroup<TimeDescriptorForm>({
            has_bounds: new FormControl<boolean>(!!form_bounds, {nonNullable: true}),
            bounds: new FormControl<TimeInterval>(form_bounds, {nonNullable: true}),
            dimension: new FormControl<Regularity>(Regularity.Irregular, {nonNullable: true}),
            regularTimeDimension: new FormGroup<RegularTimeDimensionForm>({
                origin: new FormControl<number>(0, {nonNullable: true}),
                step: new FormGroup<TimeStepForm>({
                    granularity: new FormControl<string>('days', {nonNullable: true}),
                    step: new FormControl<number>(1, {nonNullable: true}),
                }),
            }),
        });

        if (this.sub) {
            this.sub.unsubscribe();
        }

        this.sub = form.valueChanges.subscribe(() => {
            this.timeDescriptorChange.emit(this.getTimeDescriptor());
        });

        return form;
    }

    private getTimeDescriptor(): TimeDescriptor {
        let form_bounds = this.form.controls.bounds.value;
        let bound = null;

        if (form_bounds) {
            bound = time_interval_to_dict(form_bounds);
        }

        const dimension = this.form.controls.dimension.value;

        switch (dimension) {
            case Regularity.Regular:
                return {
                    bounds: bound,
                    dimension: {
                        type: TimeDimensionOneOfTypeEnum.Regular,
                        origin: 0, // TODO
                        step: {
                            // TODO
                            granularity: 'days',
                            step: 1,
                        },
                    },
                };
            case Regularity.Irregular:
                return {
                    bounds: bound,
                    dimension: {
                        type: TimeDimensionOneOf1TypeEnum.Irregular,
                    },
                };
        }
    }
}
