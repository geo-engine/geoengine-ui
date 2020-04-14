import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MatSliderChange} from '@angular/material/slider';

import {Observable, Subscription} from 'rxjs';

import {defaultFormat as momentDefaultFormat, DurationInputArg2, Moment, normalizeUnits} from 'moment';

import {Config, ProjectService, Time, TimeInterval, TimePoint, TimeStepDuration} from 'wave-core';

import {UseCaseService} from '../use-case/use-case.service';
import {AppConfig} from '../app-config.service';

@Component({
    selector: 'wave-dtt-timestamp-slider',
    templateUrl: './timestamp-slider.component.html',
    styleUrls: ['./timestamp-slider.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimestampSliderComponent implements OnInit, OnDestroy {

    readonly min = 0;
    readonly step = 1;
    readonly tickInterval = 1;

    readonly currentTimestamp: Observable<Time>;

    public max = 1;

    private useCaseTimeSubscription: Subscription;

    constructor(@Inject(Config) private readonly config: AppConfig,
                private readonly projectService: ProjectService,
                private readonly useCaseService: UseCaseService,
                private readonly changeDetectorRef: ChangeDetectorRef) {
        this.useCaseTimeSubscription = this.useCaseService.timeConfigStream.subscribe(({limits, step}) => {
            // this way min always stays `0` and step always stays `1`
            this.max = calculateNumberOfTicks(limits, step);

            setTimeout(() => this.changeDetectorRef.detectChanges());
        });

        this.currentTimestamp = this.projectService.getTimeStream();
    }

    ngOnInit() {
    }

    ngOnDestroy() {
        this.useCaseTimeSubscription.unsubscribe();
    }

    setTime(event: MatSliderChange) {
        const tick: number = event.value;
        const timestamp = calculateTimestamp(this.useCaseService.timeLimits, this.useCaseService.timeStep, tick);
        this.projectService.setTime(new TimePoint(timestamp));
    }

    thumbLabelDisplay(): (value: number) => string {
        const useCaseService = this.useCaseService;
        return (value: number) => {
            const timestamp = calculateTimestamp(useCaseService.timeLimits, useCaseService.timeStep, value);
            return displayTimestamp(timestamp, useCaseService.timeStep.durationUnit);
        };
    }

}

function calculateNumberOfTicks(timeLimits: TimeInterval, timeStep: TimeStepDuration): number {
    const differenceInUnit = timeLimits.getEnd().diff(timeLimits.getStart(), timeStep.durationUnit);

    // TODO: what to do about other formats? has moment utilities for this?
    const durationNumber: number = (typeof timeStep.durationAmount === 'number') ? timeStep.durationAmount : 1;

    // TODO: round, clip?
    const numberOfTicks = differenceInUnit / durationNumber;

    return Math.max(numberOfTicks, 0);
}

function calculateTimestamp(timeLimits: TimeInterval, timeStep: TimeStepDuration, tick: number): Moment {
    // TODO: what to do about other formats? has moment utilities for this?
    const durationNumber: number = (typeof timeStep.durationAmount === 'number') ? timeStep.durationAmount : 1;

    return timeLimits.getStart().clone().add(tick * durationNumber, timeStep.durationUnit);
}

function displayTimestamp(time: Moment, stepUnit: DurationInputArg2): string {
    let format: string;
    switch (normalizeUnits(stepUnit)) {
        case 'year':
            format = 'YYYY';
            break;
        case 'month':
            format = 'YYYY-MM';
            break;
        case 'day':
            format = 'YYYY-MM-DD';
            break;
        default:
            format = momentDefaultFormat;
    }
    return time.format(format);
}
