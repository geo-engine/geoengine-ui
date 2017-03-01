import {Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef} from '@angular/core';
import {ProjectService} from '../../project/project.service';
import {Subscription} from 'rxjs/Rx';
import {Time, TimeType, TimePoint, TimeInterval} from '../time.model';
import {MdButtonToggleChange} from '@angular/material';

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

    updateStartYear(event: string | number) {
        const value = this.eventToNumber(event);
        if ( value && !isNaN(value)) {
            this.time.getStart().year(value);
            this.push();
        }
    }
    updateStartMonth(event: string | number) {
        const value = this.eventToNumber(event);
        if ( value && !isNaN(value)) {
            this.time.getStart().month(value);
            this.push();
        }
    }
    updateStartDate(event: string | number) {
        const value = this.eventToNumber(event);
        if ( value && !isNaN(value)) {
            this.time.getStart().date(value);
            this.push();
        }
    }
    updateStartHour(event: string | number) {
        const value = this.eventToNumber(event);
        if ( value && !isNaN(value)) {
            this.time.getStart().hour(value);
            this.push();
        }
    }
    updateStartMinute(event: string | number) {
        const value = this.eventToNumber(event);
        if ( value && !isNaN(value)) {
            this.time.getStart().minute(value);
            this.push();
        }
    }
    updateStartSecond(event: string | number) {
        const value = this.eventToNumber(event);
        if ( value && !isNaN(value)) {
            this.time.getStart().second(value);
            this.push();
        }
    }

    updateEndYear(event: string | number) {
        const value = this.eventToNumber(event);
        if ( value && !isNaN(value)) {
            this.time.getEnd().year(value);
            this.push();
        }
    }
    updateEndMonth(event: string | number) {
        const value = this.eventToNumber(event);
        if ( value && !isNaN(value)) {
            this.time.getEnd().month(value);
            this.push();
        }
    }
    updateEndDate(event: string | number) {
        const value = this.eventToNumber(event);
        if ( value && !isNaN(value)) {
            this.time.getEnd().date(value);
            this.push();
        }
    }
    updateEndHour(event: string | number) {
        const value = this.eventToNumber(event);
        if ( value && !isNaN(value)) {
            this.time.getEnd().hour(value);
            this.push();
        }
    }
    updateEndMinute(event: string | number) {
        const value = this.eventToNumber(event);
        if ( value && !isNaN(value)) {
            this.time.getEnd().minute(value);
            this.push();
        }
    }
    updateEndSecond(event: string | number) {
        const value = this.eventToNumber(event);
        if ( value && !isNaN(value)) {
            this.time.getEnd().second(value);
            this.push();
        }
    }

    changeMode(event: MdButtonToggleChange){
      console.log('time-config', event);
      let requestedType = event.value as TimeType;
      if(this.time.getType() === requestedType){
          console.log(this.time.getType(), requestedType);
      }
      else {
          switch(requestedType) {
              case 'TimePoint': {
                  this.time = new TimePoint(this.time.getStart());
                  break;
              }
              case 'TimeInterval': {
                  this.time = new TimeInterval(this.time.getStart(), this.time.getStart());
                  break;
              }
          }
          //this.changeDetectorRef.markForCheck();
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
        if (!!this.time && this.time.isValid()) {
            this.projectService.setTime(this.time.clone());
        }
    }



}
