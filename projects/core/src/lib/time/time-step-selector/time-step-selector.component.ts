import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {MatLegacySliderChange as MatSliderChange} from '@angular/material/legacy-slider';
import {Observable, combineLatest, BehaviorSubject} from 'rxjs';
import {map} from 'rxjs/operators';
import {ProjectService} from '../../project/project.service';
import {Time} from '../time.model';

@Component({
    selector: 'geoengine-time-step-selector',
    templateUrl: './time-step-selector.component.html',
    styleUrls: ['./time-step-selector.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeStepSelectorComponent implements OnInit, OnChanges, OnDestroy {
    @Input() timeSteps?: Array<Time>;
    @Input() timeFormat = 'YYYY';

    readonly min = 0;
    readonly step = 1;
    readonly tickInterval = 1;

    public currentTimeFormatted: Observable<string>;

    public currentTimeIndex: number | null = 0;
    public max = 0;

    private timeFormat$: BehaviorSubject<string> = new BehaviorSubject(this.timeFormat);

    /**
     * Require services by using DI
     */
    constructor(private readonly projectService: ProjectService, private readonly changeDetectorRef: ChangeDetectorRef) {
        this.currentTimeFormatted = combineLatest([this.projectService.getTimeStream(), this.timeFormat$]).pipe(
            map(([time, format]) => {
                if (this.timeSteps) {
                    this.currentTimeIndex = this.timeSteps.findIndex((t) => time.isSame(t));
                    setTimeout(() => this.changeDetectorRef.detectChanges());
                }

                return time.start.format(format);
            }),
        );
    }

    ngOnInit(): void {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.timeSteps) {
            if (this.timeSteps) {
                // this way min always stays `0` and step always stays `1`
                this.max = this.timeSteps.length - 1;
            } else {
                this.max = 0;
            }

            this.projectService.getTimeOnce().subscribe((time) => {
                if (!this.timeSteps) {
                    return;
                }

                this.currentTimeIndex = this.timeSteps.findIndex((t) => time.isSame(t));

                setTimeout(() => this.changeDetectorRef.detectChanges());
            });
        }

        if (changes.timeFormat) {
            this.timeFormat$.next(this.timeFormat);
        }
    }

    ngOnDestroy(): void {}

    /**
     * On a slider event, calculate the timestamp and set the new time for the app layers
     */
    setTime(event: MatSliderChange): void {
        if (!this.timeSteps || event.value === null) {
            return;
        }
        const tick: number = event.value;
        const timeStep = this.timeSteps[tick];
        this.projectService.setTime(timeStep);
    }

    /**
     * Provides a thumb label display string that shows the timestamp to select (upon hovering)
     */
    thumbLabelDisplay(): (value: number) => string {
        return (value: number): string => {
            if (!this.timeSteps) {
                return '';
            }

            const timeStep = this.timeSteps[value];

            if (!timeStep) {
                return '';
            }

            return timeStep.start.format(this.timeFormat);
        };
    }

    displayTimeSlider(): boolean {
        return this.timeSteps !== undefined && this.timeSteps.length > 1 ? true : false;
    }
}
