import {AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {ProjectService} from '../../project/project.service';
import {Observable, Subscription} from 'rxjs';
import {FormControl, FormGroup, NonNullableFormBuilder, Validators} from '@angular/forms';
import {CoreConfig} from '../../config.service';
import moment from 'moment';
import {Time, TimeInterval, TimeStepDuration} from '@geoengine/common';

export interface TimeConfigForm {
    timeInterval: FormControl<TimeInterval>;
}

@Component({
    selector: 'geoengine-time-config',
    templateUrl: './time-config.component.html',
    styleUrls: ['./time-config.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class TimeConfigComponent implements OnInit, OnDestroy, AfterViewInit {
    form: FormGroup<TimeConfigForm>;

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
        private formBuilder: NonNullableFormBuilder,
        public config: CoreConfig,
    ) {
        // initialize with the current time to have a defined value
        this.time = new Time(moment.utc(), moment.utc());

        this.form = this.formBuilder.group({
            timeInterval: [{start: this.time.start, timeAsPoint: true, end: this.time.end}, [Validators.required]],
        });

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
        if (!this.form.valid) {
            return;
        }

        const time = this.formToTime();

        this.updateTime(time);
    }

    reset(): void {
        const reset = this.time.clone();

        this.form.controls['timeInterval'].setValue({
            start: reset.start,
            end: reset.end,
            timeAsPoint: reset.start.isSame(reset.end),
        });
    }

    isNotResettable(): boolean {
        return this.formToTime().isSame(this.time);
    }

    updateTimeStepDuration(timeStep: TimeStepDuration): void {
        this.projectService.setTimeStepDuration(timeStep);
    }

    protected formToTime(): Time {
        const timeInterval = this.form.get('timeInterval')!.value;

        const start = timeInterval.start;
        const timeAsPoint = timeInterval.timeAsPoint;
        let end = timeInterval.end;

        if (timeAsPoint) {
            end = start;
        }

        return new Time(start, end);
    }

    protected updateTime(time: Time): void {
        if (!time.isValid) {
            return;
        }
        this.projectService.setTime(time);
    }
}
