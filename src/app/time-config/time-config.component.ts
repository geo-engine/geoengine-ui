import {Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit} from '@angular/core';
import {ProjectService} from '../project/project.service';
import {Subscription} from 'rxjs/Rx';
import {Time, TimeType, TimePoint, TimeInterval} from '../time.model';
import {MdButtonToggleChange, MdSlideToggleChange} from '@angular/material';
import {unitOfTime} from 'Moment';

@Component({
  selector: 'wave-time-config',
  templateUrl: './time-config.component.html',
  styleUrls: ['./time-config.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeConfigComponent implements OnInit, OnDestroy, AfterViewInit {

    private timeAsPoint: boolean;
    private time: Time;
    private subscriptions: Array<Subscription> = [];


  constructor(private projectService: ProjectService, private changeDetectorRef: ChangeDetectorRef) { }

    updateStart(timeUnit: unitOfTime.Base, value: number) {
        if ( timeUnit && value && !isNaN(value)) {
            const next = this.time.getStart().clone().set(timeUnit, value);
            const asPoint = !!this.timeAsPoint || next.isSameOrAfter(this.time.getEnd());

            if(asPoint) {
                this.timeAsPoint = true;
                this.push(new TimePoint(next));
            } else {
                this.push(new TimeInterval(next, this.time.getEnd()));
            }
        }
    }

    updateEnd(timeUnit: unitOfTime.Base, value: number) {
        if ( timeUnit && value && !isNaN(value)) {
            const next = this.time.getEnd().clone().set(timeUnit, value);
            const asPoint = next.isSameOrBefore(this.time.getStart());

            if(asPoint) {
                this.timeAsPoint = true;
                this.push(new TimePoint(next));
            }
            else {
                this.push(new TimeInterval(this.time.getStart(), next));
            }
        }
    }

    changeMode(event: MdSlideToggleChange){
      console.log('time-config', event);
      this.timeAsPoint = !!event.checked;
      if(event.checked) {
          this.push(new TimePoint(this.time.getStart()));
      }
      else {
          this.push(this.time = new TimeInterval(this.time.getStart(), this.time.getStart()));
      }
      //this.changeDetectorRef.markForCheck();
    }

    ngOnInit() {
        let sub = this.projectService.getTimeStream().subscribe(time => {
            if (!time.isSame(this.time)) {
                this.time = time.clone();
                this.changeDetectorRef.markForCheck();
            }

            this.timeAsPoint = time.getType() === 'TimePoint';
        });

        this.subscriptions.push(sub);
    }

    ngAfterViewInit() {
      setTimeout(() => this.changeDetectorRef.markForCheck(), 0);
    }

    ngOnDestroy(): void {
      this.subscriptions.forEach(s => s.unsubscribe());
    }

    private push(time: Time) {
        if (!!time && !!this.time && time.isValid() && this.time.isValid() && !time.isSame(this.time)) {
            this.projectService.setTime(time);
        }
    }
}
