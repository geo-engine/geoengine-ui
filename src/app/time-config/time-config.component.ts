import {Component, OnInit, OnDestroy} from '@angular/core';
import {ProjectService} from '../../project/project.service';
import {Moment} from 'moment';
import {Subscription} from 'rxjs/Rx';

@Component({
  selector: 'wave-time-config',
  templateUrl: './time-config.component.html',
  styleUrls: ['./time-config.component.scss']
})
export class TimeConfigComponent implements OnInit, OnDestroy {


    private moment: Moment;
    private subscriptions: Array<Subscription> = [];

  constructor(private projectService: ProjectService) { }

    updateYear(event: string | number) {
        const value = this.eventToNumber(event);
        if ( value && !isNaN(value)) {
            this.moment.year(value);
            this.push();
        }
    }
    updateMonth(event: string | number) {
        const value = this.eventToNumber(event);
        if ( value && !isNaN(value)) {
            this.moment.month(value);
            this.push();
        }
    }
    updateDate(event: string | number) {
        const value = this.eventToNumber(event);
        if ( value && !isNaN(value)) {
            this.moment.date(value);
            this.push();
        }
    }
    updateHour(event: string | number) {
        const value = this.eventToNumber(event);
        if ( value && !isNaN(value)) {
            this.moment.hour(value);
            this.push();
        }
    }
    updateMinute(event: string | number) {
        const value = this.eventToNumber(event);
        if ( value && !isNaN(value)) {
            this.moment.minute(value);
            this.push();
        }
    }
    updateSecond(event: string | number) {
        const value = this.eventToNumber(event);
        if ( value && !isNaN(value)) {
            this.moment.second(value);
            this.push();
        }
    }

    ngOnInit() {
        let sub = this.projectService.getTimeStream().subscribe(time => {
            if (!time.isSame(this.moment)) {
                this.moment = time.clone();
                // this.changeDetectorRef.markForCheck();
                // console.log("wave-time-ribbon", "projectService changed", this.moment);
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
        if (this.moment.isValid() && this.moment !== undefined) {
            this.projectService.setTime(this.moment.clone());
        }
    }



}
