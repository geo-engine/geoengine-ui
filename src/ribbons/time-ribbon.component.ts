import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {COMMON_DIRECTIVES} from '@angular/common';

import {MATERIAL_DIRECTIVES} from 'ng2-material';

import {ProjectService} from '../services/project.service';

import moment from 'moment';

@Component({
    selector: 'wave-time-ribbon',
    template: `
    <div layout="row">
         <md-input-container class="md-block">
           <label>year</label>
           <input md-input type="number" maxLength="4"
                  [value]="moment.year()" (valueChange)="updateYear($event)"
                  (wheel)="$event.stopPropagation()">
         </md-input-container>
         <md-input-container class="md-block">
           <label>month</label>
           <input md-input type="number" maxLength="2"
                  [value]="moment.month()" (valueChange)="updateMonth($event)"
                  (wheel)="$event.stopPropagation()">
         </md-input-container>
         <md-input-container class="md-block">
           <label>day</label>
           <input md-input type="number" maxLength="2"
                  [value]="moment.date()" (valueChange)="updateDate($event)"
                  (wheel)="$event.stopPropagation()">
         </md-input-container>
       </div>
       <div layout="row">
            <md-input-container class="md-block">
              <label>hour</label>
              <input md-input type="number" maxLength="2"
                     [value]="moment.hour()" (valueChange)="updateHour($event)"
                     (wheel)="$event.stopPropagation()">
            </md-input-container>
            <md-input-container class="md-block">
              <label>minute</label>
              <input md-input type="number" maxLength="2"
                     [value]="moment.minute()" (valueChange)="updateMinute($event)"
                     (wheel)="$event.stopPropagation()">
            </md-input-container>
            <md-input-container class="md-block">
              <label>second</label>
              <input md-input type="number" maxLength="2"
                     [value]="moment.second()" (valueChange)="updateSecond($event)"
                     (wheel)="$event.stopPropagation()">
            </md-input-container>
          </div>
      `,
    styles: [`
        md-input-container {
            margin-bottom: 2px;
        }
        md-input-container input {
            width: 60px;
        }

        md-input-container >>> .md-errors-spacer {
            display: none;
        }
        `],
    directives: [COMMON_DIRECTIVES, MATERIAL_DIRECTIVES],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeRibbonComponent implements OnInit {

    private moment: moment.Moment;

    constructor(private projectService: ProjectService) {}

    updateYear(event: string | number) {
        this.moment.year(this.eventToNumber(event));
        this.push();
    }
    updateMonth(event: string | number) {
        this.moment.month(this.eventToNumber(event));
        this.push();
    }
    updateDate(event: string | number) {
        this.moment.date(this.eventToNumber(event));
        this.push();
    }
    updateHour(event: string | number) {
        this.moment.hour(this.eventToNumber(event));
        this.push();
    }
    updateMinute(event: string | number) {
        this.moment.minute(this.eventToNumber(event));
        this.push();
    }
    updateSecond(event: string | number) {
        this.moment.second(this.eventToNumber(event));
        this.push();
    }

    ngOnInit() {
        this.projectService.getTimeStream().subscribe(time => {
            if (!time.isSame(this.moment)) {
                this.moment = time.clone();
                // console.log("wave-time-ribbon", "projectService changed", this.moment);
            }
        });
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
        return 0;
    }

    private push() {
        if (this.moment.isValid()) {
            this.projectService.setTime(this.moment.clone());
        }
    }
}
