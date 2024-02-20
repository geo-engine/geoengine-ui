import {Subscription} from 'rxjs';
import {Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy} from '@angular/core';
import {ProjectService} from '../../project/project.service';
import {LayoutService} from '../../layout.service';
import {TimeConfigComponent} from '../time-config/time-config.component';
import {TimeStepDuration} from '@geoengine/common';

@Component({
    selector: 'geoengine-small-time-interaction',
    templateUrl: './small-time-interaction.component.html',
    styleUrls: ['./small-time-interaction.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmallTimeInteractionComponent implements OnInit, OnDestroy {
    timeRepresentation?: string;

    timeStepDurationStreamSubscription?: Subscription;
    timeStepDuration: TimeStepDuration = {durationAmount: 1, durationUnit: 'months'}; // TODO: get from DEFAULTS?

    private timeStreamSubscription?: Subscription;

    constructor(
        private projectService: ProjectService,
        private layoutService: LayoutService,
        private changeDetectorRef: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this.timeStreamSubscription = this.projectService.getTimeStream().subscribe((t) => {
            this.timeRepresentation = t.toString();
            this.changeDetectorRef.markForCheck();
        });

        this.timeStepDurationStreamSubscription = this.projectService.getTimeStepDurationStream().subscribe((timeStepDuration) => {
            this.timeStepDuration = timeStepDuration;
        });
    }

    ngOnDestroy(): void {
        this.timeStreamSubscription?.unsubscribe();
        this.timeStepDurationStreamSubscription?.unsubscribe();
    }

    timeForward(): void {
        this.projectService.getTimeOnce().subscribe((time) => {
            const updatedTime = time.add(this.timeStepDuration.durationAmount, this.timeStepDuration.durationUnit);
            this.projectService.setTime(updatedTime);
        });
    }

    timeBackwards(): void {
        this.projectService.getTimeOnce().subscribe((time) => {
            const updatedTime = time.subtract(this.timeStepDuration.durationAmount, this.timeStepDuration.durationUnit);
            this.projectService.setTime(updatedTime);
        });
    }

    openTimeConfig(): void {
        this.layoutService.setSidenavContentComponent({component: TimeConfigComponent});
    }
}
