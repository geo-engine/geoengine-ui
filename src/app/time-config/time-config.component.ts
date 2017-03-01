import {Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef} from '@angular/core';
import {ProjectService} from '../../project/project.service';
import {Subscription} from 'rxjs/Rx';
import {Time} from '../time.model';

@Component({
  selector: 'wave-time-config',
  templateUrl: './time-config.component.html',
  styleUrls: ['./time-config.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeConfigComponent implements OnInit, OnDestroy {


    private time: Time;
    private subscriptions: Array<Subscription> = [];

  constructor(private projectService: ProjectService, private changeDetectorRef: ChangeDetectorRef) { }

    updateYear(event: string | number) {
        const value = this.eventToNumber(event);
        if ( value && !isNaN(value)) {
            this.time.getStart().year(value);
            this.push();
        }
    }
    updateMonth(event: string | number) {
        const value = this.eventToNumber(event);
        if ( value && !isNaN(value)) {
            this.time.getStart().month(value);
            this.push();
        }
    }
    updateDate(event: string | number) {
        const value = this.eventToNumber(event);
        if ( value && !isNaN(value)) {
            this.time.getStart().date(value);
            this.push();
        }
    }
    updateHour(event: string | number) {
        const value = this.eventToNumber(event);
        if ( value && !isNaN(value)) {
            this.time.getStart().hour(value);
            this.push();
        }
    }
    updateMinute(event: string | number) {
        const value = this.eventToNumber(event);
        if ( value && !isNaN(value)) {
            this.time.getStart().minute(value);
            this.push();
        }
    }
    updateSecond(event: string | number) {
        const value = this.eventToNumber(event);
        if ( value && !isNaN(value)) {
            this.time.getStart().second(value);
            this.push();
        }
    }

    ngOnInit() {
        let sub = this.projectService.getTimeStream().subscribe(time => {
            if (!time.isSame(this.time)) {
                this.time = time.clone();
                this.changeDetectorRef.markForCheck();
            }
        });

        this.subscriptions.push(sub);
    }

    ngOnDestroy(): void {
      this.subscriptions.forEach(s => s.unsubscribe());
    }

    private eventToNumber(event: string | number): number {
        if (typeof event === 'string') {
            if ( event === '' ) {
                return 0;
            }
            return parseInt(event, 10);
        }
        if (typeof event === 'number') {
            return event;
        }
        return NaN;
    }

    private push() {
        if (this.time.isValid() && this.time !== undefined) {
            this.projectService.setTime(this.time.clone());
        }
    }



}
