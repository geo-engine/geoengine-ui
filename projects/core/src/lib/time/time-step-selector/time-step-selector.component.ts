import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges, inject} from '@angular/core';
import {Observable, combineLatest, BehaviorSubject} from 'rxjs';
import {map} from 'rxjs/operators';
import {ProjectService} from '../../project/project.service';
import {Time, FxLayoutDirective, FxLayoutAlignDirective} from '@geoengine/common';
import {MatSlider, MatSliderThumb} from '@angular/material/slider';
import {FormsModule} from '@angular/forms';
import {AsyncPipe} from '@angular/common';

@Component({
    selector: 'geoengine-time-step-selector',
    templateUrl: './time-step-selector.component.html',
    styleUrls: ['./time-step-selector.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FxLayoutDirective, FxLayoutAlignDirective, MatSlider, MatSliderThumb, FormsModule, AsyncPipe],
})
export class TimeStepSelectorComponent implements OnChanges {
    private readonly projectService = inject(ProjectService);
    private readonly changeDetectorRef = inject(ChangeDetectorRef);

    @Input() timeSteps?: Array<Time>;
    @Input() timeFormat = 'YYYY';

    readonly min = 0;
    readonly step = 1;
    readonly tickInterval = 1;

    public currentTimeFormatted: Observable<string>;

    public currentTimeIndex: number | null = 0;
    public max = 0;

    private timeFormat$ = new BehaviorSubject<string>(this.timeFormat);

    /**
     * Require services by using DI
     */
    constructor() {
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

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async ngOnChanges(changes: SimpleChanges): Promise<void> {
        if (changes.timeSteps) {
            if (this.timeSteps) {
                // this way min always stays `0` and step always stays `1`
                this.max = this.timeSteps.length - 1;
            } else {
                this.max = 0;
            }

            const time = await this.projectService.getTimeOnce();
            if (!this.timeSteps) {
                return;
            }

            this.currentTimeIndex = this.timeSteps.findIndex((t) => time.isSame(t));

            setTimeout(() => this.changeDetectorRef.detectChanges());
        }

        if (changes.timeFormat) {
            this.timeFormat$.next(this.timeFormat);
        }
    }

    /**
     * On a slider event, calculate the timestamp and set the new time for the app layers
     */
    setTime(tick: number): void {
        if (!this.timeSteps) {
            return;
        }
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
