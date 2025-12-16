import {Component, OnChanges, SimpleChanges, input, output} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {
    geoengineValidators,
    MeasurementComponent,
    time_interval_from_dict,
    time_interval_to_dict,
    TimeInterval,
    CommonModule,
    timeStepGranularityOptions,
} from '@geoengine/common';
import {
    Measurement,
    Provenance,
    RasterBandDescriptor,
    TimeDescriptor,
    TimeDimensionOneOf1TypeEnum,
    TimeDimensionOneOfTypeEnum,
    TimeGranularity,
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
    hasBounds: FormControl<boolean>;
    bounds: FormControl<TimeInterval | null>;
    dimension: FormControl<Regularity>;
    regularTimeDimension: FormGroup<RegularTimeDimensionForm>;
}

interface RegularTimeDimensionForm {
    origin: FormControl<TimeInterval>;
    step: FormGroup<TimeStepForm>;
}

interface TimeStepForm {
    granularity: FormControl<TimeGranularity>;
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
    TimeGranularities = timeStepGranularityOptions;

    readonly timeDescriptor = input<TimeDescriptor>();

    readonly timeDescriptorChange = output<TimeDescriptor>();

    form: FormGroup<TimeDescriptorForm> = this.setUpForm();

    sub?: Subscription;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.timeDescriptor) {
            this.form = this.setUpForm();
        }
    }

    private setUpForm(): FormGroup<TimeDescriptorForm> {
        const timeDescriptor = this.timeDescriptor();

        let form;

        if (!timeDescriptor) {
            form = new FormGroup<TimeDescriptorForm>({
                hasBounds: new FormControl<boolean>(false, {nonNullable: true}),
                bounds: new FormControl<TimeInterval>(this.placeholderTimeInterval(false), {nonNullable: true}),
                dimension: new FormControl<Regularity>(Regularity.Irregular, {nonNullable: true}),
                regularTimeDimension: new FormGroup<RegularTimeDimensionForm>({
                    origin: new FormControl<TimeInterval>(this.placeholderTimeInterval(true), {nonNullable: true}),
                    step: new FormGroup<TimeStepForm>({
                        granularity: new FormControl<TimeGranularity>('days', {nonNullable: true}),
                        step: new FormControl<number>(1, {nonNullable: true}),
                    }),
                }),
            });
        } else {
            let bounds = timeDescriptor.bounds;
            let form_bounds = null;
            if (!!bounds) {
                form_bounds = time_interval_from_dict(bounds);
            } else {
                form_bounds = this.placeholderTimeInterval(false);
            }

            form = new FormGroup<TimeDescriptorForm>({
                hasBounds: new FormControl<boolean>(!!bounds, {nonNullable: true}),
                bounds: new FormControl<TimeInterval>(form_bounds ? form_bounds : this.placeholderTimeInterval(false), {nonNullable: true}),
                dimension: new FormControl<Regularity>(
                    timeDescriptor.dimension.type == 'irregular' ? Regularity.Irregular : Regularity.Regular,
                    {nonNullable: true},
                ),
                regularTimeDimension: new FormGroup<RegularTimeDimensionForm>({
                    origin: new FormControl<TimeInterval>(
                        timeDescriptor.dimension.type == 'regular'
                            ? this.timeOriginFromTimestamp(timeDescriptor.dimension.origin)
                            : this.placeholderTimeInterval(false),
                        {nonNullable: true},
                    ),
                    step: new FormGroup<TimeStepForm>({
                        granularity: new FormControl<TimeGranularity>(
                            timeDescriptor.dimension.type == 'regular' ? timeDescriptor.dimension.step.granularity : 'days',
                            {nonNullable: true},
                        ),
                        step: new FormControl<number>(timeDescriptor.dimension.type == 'regular' ? timeDescriptor.dimension.step.step : 1, {
                            nonNullable: true,
                        }),
                    }),
                }),
            });
        }

        if (this.sub) {
            this.sub.unsubscribe();
        }

        this.sub = form.valueChanges.subscribe(() => {
            console.log('TimeDescriptor changed:', this.getTimeDescriptor());
            this.timeDescriptorChange.emit(this.getTimeDescriptor());
        });

        return form;
    }

    private timeOriginFromTimestamp(timestamp: number): TimeInterval {
        const time = moment.utc(timestamp);
        return {
            start: time.hour(0).minute(0).second(0).millisecond(0),
            end: time.hour(0).minute(0).second(0).millisecond(0),
            timeAsPoint: true,
        };
    }

    private placeholderTimeInterval(timeAsPoint: boolean): TimeInterval {
        if (timeAsPoint) {
            return {
                start: moment.utc().hour(0).minute(0).second(0).millisecond(0),
                end: moment.utc().hour(0).minute(0).second(0).millisecond(0),
                timeAsPoint: true,
            };
        }

        return {
            start: moment.utc().hour(0).minute(0).second(0).millisecond(0),
            end: moment.utc().add(1, 'days').hour(0).minute(0).second(0).millisecond(0),
            timeAsPoint: false,
        };
    }

    private getTimeDescriptor(): TimeDescriptor {
        let formBounds = this.form.controls.bounds.value;
        let hasBounds = this.form.controls.hasBounds.value;

        let bounds = null;

        if (hasBounds && formBounds) {
            bounds = time_interval_to_dict(formBounds);
        }

        const dimension = this.form.controls.dimension.value;

        switch (dimension) {
            case Regularity.Regular:
                const regular = this.form.controls.regularTimeDimension.controls;
                return {
                    bounds: bounds,
                    dimension: {
                        type: TimeDimensionOneOfTypeEnum.Regular,
                        origin: regular.origin.value.start.valueOf(),
                        step: {
                            granularity: regular.step.controls.granularity.value,
                            step: regular.step.controls.step.value,
                        },
                    },
                };
            case Regularity.Irregular:
                return {
                    bounds: bounds,
                    dimension: {
                        type: TimeDimensionOneOf1TypeEnum.Irregular,
                    },
                };
        }
    }
}
