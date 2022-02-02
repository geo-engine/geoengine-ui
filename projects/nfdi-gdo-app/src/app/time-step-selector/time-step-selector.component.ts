import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {MatSliderChange} from '@angular/material/slider';
import {Time, ProjectService} from 'wave-core';
import {Observable, Subscription, combineLatest} from 'rxjs';
import {map, tap} from 'rxjs/operators';
import {DataSelectionService} from '../data-selection.service';

@Component({
    selector: 'wave-app-time-step-selector',
    templateUrl: './time-step-selector.component.html',
    styleUrls: ['./time-step-selector.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeStepSelectorComponent implements OnInit, OnDestroy {
    readonly min = 0;
    readonly step = 1;
    readonly tickInterval = 1;

    readonly currentTimestamp: Observable<Time>;
    readonly currentTimeFormatted: Observable<string>;

    public currentTimeIndex: number | null = 0;
    public max = 0;

    private avaiableTimeStepsSubscription: Subscription;
    private avalableTimeSteps?: Array<Time>;
    private timeFormat = '';

    /**
     * Require services by using DI
     */
    constructor(
        private readonly projectService: ProjectService,
        private readonly changeDetectorRef: ChangeDetectorRef,
        public readonly dataSelectionService: DataSelectionService,
    ) {
        this.avaiableTimeStepsSubscription = this.dataSelectionService.timeSteps.subscribe((timeSteps) => {
            // this way min always stays `0` and step always stays `1`
            this.max = timeSteps.length - 1;
            this.avalableTimeSteps = timeSteps;

            setTimeout(() => this.changeDetectorRef.detectChanges());

            this.projectService.getTimeOnce().subscribe((time) => {
                if (!this.avalableTimeSteps) {
                    return;
                }

                this.currentTimeIndex = this.avalableTimeSteps.indexOf(time);
            });
        });

        this.currentTimestamp = this.projectService.getTimeStream();

        this.currentTimeFormatted = combineLatest([this.currentTimestamp, this.dataSelectionService.timeFormat]).pipe(
            tap(([, format]) => (this.timeFormat = format)),
            map(([time, format]) => time.start.format(format)),
        );
    }

    ngOnInit(): void {}

    ngOnDestroy(): void {
        this.avaiableTimeStepsSubscription.unsubscribe();
    }

    /**
     * On a slider event, calculate the timestamp and set the new time for the app layers
     */
    setTime(event: MatSliderChange): void {
        if (!this.avalableTimeSteps || event.value === null) {
            return;
        }
        const tick: number = event.value;
        const timeStep = this.avalableTimeSteps[tick];
        this.projectService.setTime(timeStep);
    }

    /**
     * Provides a thumb label display string that shows the timestamp to select (upon hovering)
     */
    thumbLabelDisplay(): (value: number) => string {
        return (value: number): string => {
            if (!this.avalableTimeSteps) {
                return '';
            }

            const timeStep = this.avalableTimeSteps[value];

            if (!timeStep) {
                return '';
            }

            return timeStep.start.format(this.timeFormat);
        };
    }
}
