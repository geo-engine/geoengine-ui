import {AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {ProjectService} from '../../project/project.service';
import {Observable, Subscription} from 'rxjs';
import {Time, TimeStepDuration} from '../time.model';
import moment, {Moment} from 'moment';
import {AbstractControl, UntypedFormBuilder, UntypedFormGroup, ValidationErrors, Validators} from '@angular/forms';
import {Config} from '../../config.service';

const startBeforeEndValidator = (control: AbstractControl): ValidationErrors | null => {
    if (!(control instanceof UntypedFormGroup)) {
        return null;
    }

    const start = control.controls.start.value as Moment;
    const end = control.controls.end.value as Moment;
    const timeAsPoint = control.controls.timeAsPoint.value as boolean;

    if (start && end && (timeAsPoint || start.isBefore(end))) {
        return null;
    } else {
        return {valid: false};
    }
};

@Component({
    selector: 'wave-time-config',
    templateUrl: './time-config.component.html',
    styleUrls: ['./time-config.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeConfigComponent implements OnInit, OnDestroy, AfterViewInit {
    timeForm: UntypedFormGroup;

    timeStepDuration$: Observable<TimeStepDuration>;
    timeStepDurations: Array<TimeStepDuration> = [
        {durationAmount: 1, durationUnit: 'minute'},
        {durationAmount: 15, durationUnit: 'minutes'},
        {durationAmount: 1, durationUnit: 'hour'},
        {durationAmount: 1, durationUnit: 'day'},
        {durationAmount: 1, durationUnit: 'month'},
        {durationAmount: 6, durationUnit: 'months'},
        {durationAmount: 1, durationUnit: 'year'},
    ];

    protected time: Time;
    private projectTimeSubscription?: Subscription;

    constructor(
        private projectService: ProjectService,
        private changeDetectorRef: ChangeDetectorRef,
        private formBuilder: UntypedFormBuilder,
        public config: Config,
    ) {
        // initialize with the current time to have a defined value
        this.time = new Time(moment.utc(), moment.utc());

        this.timeForm = this.formBuilder.group({
            start: [this.time.start.clone(), Validators.required],
            timeAsPoint: [this.config.TIME.ALLOW_RANGES, Validators.required],
            end: [this.time.end.clone(), Validators.required],
        });

        this.timeForm.setValidators(startBeforeEndValidator);

        this.timeStepDuration$ = this.projectService.getTimeStepDurationStream();
    }

    timeStepComparator(option: TimeStepDuration, selectedElement: TimeStepDuration): boolean {
        const equalAmount = option.durationAmount === selectedElement.durationAmount;
        const equalUnit = option.durationUnit === selectedElement.durationUnit;
        return equalAmount && equalUnit;
    }

    ngOnInit(): void {
        this.projectTimeSubscription = this.projectService.getTimeStream().subscribe((time) => {
            this.time = time.clone();
            this.reset();
        });
    }

    ngAfterViewInit(): void {
        setTimeout(() => this.changeDetectorRef.markForCheck());
    }

    ngOnDestroy(): void {
        this.projectTimeSubscription?.unsubscribe();
    }

    applyTime(): void {
        if (!this.timeForm.valid) {
            return;
        }

        this.updateTime(this.timeOfForm());
    }

    reset(): void {
        this.timeForm.controls['timeAsPoint'].setValue(this.time.type === 'TimePoint');
        this.timeForm.controls['start'].setValue(this.time.start.clone());
        this.timeForm.controls['end'].setValue(this.time.end.clone());
    }

    isNotResettable(): boolean {
        return this.time.isSame(this.timeOfForm());
    }

    updateTimeStepDuration(timeStep: TimeStepDuration): void {
        this.projectService.setTimeStepDuration(timeStep);
    }

    protected getFormStartTime(): Moment {
        return this.timeForm.get('start')?.value;
    }

    protected getFormEndTime(): Moment {
        return this.timeForm.get('end')?.value;
    }

    protected isFormTimePoint(): boolean {
        return this.timeForm.get('timeAsPoint')?.value;
    }

    protected timeOfForm(): Time {
        if (this.isFormTimePoint()) {
            return new Time(this.getFormStartTime());
        } else {
            return new Time(this.getFormStartTime(), this.getFormEndTime());
        }
    }

    protected updateTime(time: Time): void {
        if (!time.isValid) {
            return;
        }
        this.projectService.setTime(time);
    }
}
